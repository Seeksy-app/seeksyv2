import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Production redirect URL
const FRONTEND_URL = 'https://seeksy.io';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[meta-callback] Processing Meta OAuth callback');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[meta-callback] OAuth error:', error);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=${error}`, 302);
    }

    if (!code || !state) {
      console.error('[meta-callback] Missing code or state parameter');
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=missing_params`, 302);
    }

    console.log('[meta-callback] User ID from state:', state);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-callback`;

    if (!metaAppId || !metaAppSecret) {
      console.error('[meta-callback] Meta credentials not configured');
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=config_error`, 302);
    }

    // Exchange code for access token
    console.log('[meta-callback] Exchanging code for access token');
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', metaAppId);
    tokenUrl.searchParams.set('client_secret', metaAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[meta-callback] Token exchange failed:', tokenData);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=token_failed`, 302);
    }

    const accessToken = tokenData.access_token;
    console.log('[meta-callback] Access token obtained successfully');

    // Get user's Facebook pages
    console.log('[meta-callback] Fetching user pages');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('[meta-callback] Failed to fetch pages:', pagesData);
      return Response.redirect(`${FRONTEND_URL}/social-analytics?error=pages_failed`, 302);
    }

    console.log('[meta-callback] Found pages:', pagesData.data?.length || 0);

    // Get Instagram Business Account for each page
    console.log('[meta-callback] Fetching Instagram accounts');
    let connectedCount = 0;

    for (const page of pagesData.data || []) {
      try {
        console.log('[meta-callback] Checking page:', page.name, page.id);
        
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count,follows_count,media_count,biography}&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        if (igData.instagram_business_account) {
          const igAccount = igData.instagram_business_account;
          console.log('[meta-callback] Found Instagram account:', igAccount.username);

          // Insert into social_media_profiles table
          const { data: insertData, error: insertError } = await supabaseClient
            .from('social_media_profiles')
            .upsert({
              user_id: state,
              platform: 'instagram',
              platform_user_id: igAccount.id,
              username: igAccount.username,
              profile_picture: igAccount.profile_picture_url,
              account_type: 'business',
              biography: igAccount.biography || null,
              followers_count: igAccount.followers_count || 0,
              follows_count: igAccount.follows_count || 0,
              media_count: igAccount.media_count || 0,
              access_token: page.access_token, // Use page access token for API calls
              connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: 'pending',
            }, {
              onConflict: 'user_id,platform,platform_user_id',
            })
            .select();

          if (insertError) {
            console.error('[meta-callback] Error inserting social_media_profiles:', insertError);
          } else {
            console.log('[meta-callback] Successfully stored Instagram profile:', igAccount.username);
            connectedCount++;
            
            // Trigger initial data sync
            try {
              console.log('[meta-callback] Triggering initial data sync for user:', state);
              const syncResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-sync-social-data`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({ user_id: state }),
                }
              );
              console.log('[meta-callback] Sync triggered, status:', syncResponse.status);
            } catch (syncErr) {
              console.error('[meta-callback] Error triggering sync:', syncErr);
              // Don't fail the callback if sync fails
            }
          }
        }
      } catch (err) {
        console.error('[meta-callback] Error processing page:', page.id, err);
      }
    }

    console.log('[meta-callback] Total Instagram accounts connected:', connectedCount);

    // Redirect to social analytics with success
    const redirectUrl = `${FRONTEND_URL}/social-analytics?connected=instagram&count=${connectedCount}`;
    console.log('[meta-callback] Redirecting to:', redirectUrl);
    
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('[meta-callback] Unhandled error:', error);
    return Response.redirect(`${FRONTEND_URL}/social-analytics?error=unknown`, 302);
  }
});