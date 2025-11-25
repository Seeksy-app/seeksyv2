import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `https://seeksy.io/availability?error=zoom_oauth_failed` }
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    const clientId = Deno.env.get('ZOOM_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
    const redirectUri = `https://seeksy.io/functions/v1/zoom-callback`;

    // Exchange code for tokens
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();
    console.log('Received Zoom tokens for user:', state);

    // Get user's Zoom info
    const userInfoResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const zoomUserId = userInfo.id;
    const zoomEmail = userInfo.email;

    // Store tokens in database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from('zoom_connections')
      .select('id')
      .eq('user_id', state)
      .single();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('zoom_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
          zoom_user_id: zoomUserId,
          zoom_email: zoomEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from('zoom_connections')
        .insert({
          user_id: state,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
          zoom_user_id: zoomUserId,
          zoom_email: zoomEmail,
        });

      if (insertError) throw insertError;
    }

    console.log('Successfully stored Zoom connection for user:', state);

    // Redirect back to app
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/integrations?zoom_success=true` }
    });
  } catch (error) {
    console.error('Error in zoom-callback:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: `https://seeksy.io/integrations?error=zoom_connection_failed` }
    });
  }
});
