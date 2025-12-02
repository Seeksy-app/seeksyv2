import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const productionRedirectBase = 'https://seeksy.io';

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('YouTube callback received - code:', !!code, 'state:', !!state, 'error:', error);

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    if (!state) {
      throw new Error('No state parameter received');
    }

    // Decode state to get user_id
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      if (!userId) {
        throw new Error('No user_id in state');
      }
      console.log('Decoded user_id from state:', userId);
    } catch (e) {
      console.error('Failed to decode state:', e);
      throw new Error('Invalid state parameter');
    }

    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret || !supabaseUrl) {
      throw new Error('Missing YouTube credentials');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/youtube-callback`;

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received - access_token:', !!tokens.access_token, 'refresh_token:', !!tokens.refresh_token);

    // Fetch YouTube channel info
    console.log('Fetching YouTube channel info...');
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      const errorData = await channelResponse.text();
      console.error('Channel fetch failed:', errorData);
      throw new Error('Failed to fetch YouTube channel data');
    }

    const channelData = await channelResponse.json();
    console.log('Channel data received:', JSON.stringify(channelData, null, 2));

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const channelTitle = channel.snippet?.title || 'Unknown Channel';
    const profilePicture = channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '';
    const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0', 10);
    const videoCount = parseInt(channel.statistics?.videoCount || '0', 10);

    console.log('Channel info:', {
      channelId,
      channelTitle,
      subscriberCount,
      videoCount,
    });

    // Save to social_media_profiles using service role
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('social_media_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('platform_user_id', channelId)
      .single();

    const profileData = {
      user_id: userId,
      platform: 'youtube',
      platform_user_id: channelId,
      username: channelTitle,
      profile_picture: profilePicture,
      followers_count: subscriberCount,
      media_count: videoCount,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    let savedProfile;
    if (existingProfile) {
      console.log('Updating existing YouTube profile:', existingProfile.id);
      const { data, error: updateError } = await supabase
        .from('social_media_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        throw new Error('Failed to update YouTube profile');
      }
      savedProfile = data;
    } else {
      console.log('Creating new YouTube profile for user:', userId);
      const { data, error: insertError } = await supabase
        .from('social_media_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert profile:', insertError);
        throw new Error('Failed to save YouTube profile');
      }
      savedProfile = data;
    }

    console.log('Profile saved successfully:', savedProfile?.id);

    // Trigger sync (fire and forget)
    try {
      const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-youtube-channel-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          profile_id: savedProfile?.id,
        }),
      });
      console.log('Sync triggered, status:', syncResponse.status);
    } catch (syncError) {
      console.error('Failed to trigger sync (non-blocking):', syncError);
    }

    // Redirect to production URL with tab param
    const redirectUrl = new URL('/social-analytics', productionRedirectBase);
    redirectUrl.searchParams.set('connected', 'youtube');
    redirectUrl.searchParams.set('tab', 'youtube');
    
    console.log('Redirecting to:', redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  } catch (error) {
    console.error('YouTube callback error:', error);
    
    const redirectUrl = new URL('/social-analytics', productionRedirectBase);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    redirectUrl.searchParams.set('youtube_error', errorMessage);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });
  }
});
