import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')}/integrations/meta?error=${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-callback`;

    if (!metaAppId || !metaAppSecret) {
      throw new Error('Meta credentials not configured');
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
      throw new Error('Failed to exchange code for token');
    }

    const accessToken = tokenData.access_token;
    console.log('[meta-callback] Access token obtained');

    // Get user's Facebook pages
    console.log('[meta-callback] Fetching user pages');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('[meta-callback] Failed to fetch pages:', pagesData);
      throw new Error('Failed to fetch Facebook pages');
    }

    // Get Instagram Business Account for each page
    console.log('[meta-callback] Fetching Instagram accounts');
    let instagramAccounts = [];

    for (const page of pagesData.data || []) {
      try {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count}&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        if (igData.instagram_business_account) {
          instagramAccounts.push({
            ...igData.instagram_business_account,
            pageId: page.id,
            pageName: page.name,
            pageAccessToken: page.access_token,
          });
        }
      } catch (err) {
        console.error('[meta-callback] Error fetching Instagram for page:', page.id, err);
      }
    }

    console.log('[meta-callback] Found Instagram accounts:', instagramAccounts.length);

    // Store each Instagram connection
    for (const igAccount of instagramAccounts) {
      const { error: insertError } = await supabaseClient
        .from('meta_integrations')
        .upsert({
          user_id: state,
          platform: 'instagram',
          platform_user_id: igAccount.id,
          platform_username: igAccount.username,
          access_token: igAccount.pageAccessToken,
          profile_image_url: igAccount.profile_picture_url,
          followers_count: igAccount.followers_count || 0,
          is_active: true,
          metadata: {
            page_id: igAccount.pageId,
            page_name: igAccount.pageName,
          },
        }, {
          onConflict: 'user_id,platform,platform_user_id',
        });

      if (insertError) {
        console.error('[meta-callback] Error storing integration:', insertError);
      } else {
        console.log('[meta-callback] Successfully stored integration for:', igAccount.username);
      }
    }

    // Redirect back to integrations page
    const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || '';
    const redirectUrl = `${frontendUrl}/integrations/meta?success=true&count=${instagramAccounts.length}`;
    
    console.log('[meta-callback] Redirecting to:', redirectUrl);
    
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('[meta-callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || '';
    return Response.redirect(`${frontendUrl}/integrations/meta?error=${encodeURIComponent(errorMessage)}`, 302);
  }
});
