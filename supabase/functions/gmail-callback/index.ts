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
      const baseUrl = Deno.env.get('SUPABASE_URL') || '';
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/email-settings?error=oauth_failed` }
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();
    console.log('Received Gmail tokens for user:', state);

    // Get user's email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    // Store tokens in database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000));

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from('gmail_connections')
      .select('id')
      .eq('user_id', state)
      .single();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('gmail_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from('gmail_connections')
        .insert({
          user_id: state,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
          email: email,
        });

      if (insertError) throw insertError;
    }

    console.log('Successfully stored Gmail connection for user:', state);

    // Redirect back to app
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/email-settings?success=gmail_connected` }
    });
  } catch (error) {
    console.error('Error in gmail-callback:', error);
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/email-settings?error=connection_failed` }
    });
  }
});
