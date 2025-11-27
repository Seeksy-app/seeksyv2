import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Not authenticated');
    }

    const {
      voiceName,
      elevenlabsVoiceId,
      sampleAudioUrl,
      isAvailableForAds,
      pricePerAd,
      usageTerms,
      profileImageUrl,
    } = await req.json();

    if (!voiceName || !elevenlabsVoiceId) {
      throw new Error('Missing required fields: voiceName or elevenlabsVoiceId');
    }

    console.log('Creating voice profile for user:', user.id);

    // Use service role to insert (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: insertError } = await supabaseAdmin
      .from('creator_voice_profiles')
      .insert({
        user_id: user.id,
        voice_name: voiceName,
        elevenlabs_voice_id: elevenlabsVoiceId,
        sample_audio_url: sampleAudioUrl,
        is_available_for_ads: isAvailableForAds || false,
        price_per_ad: pricePerAd || null,
        usage_terms: usageTerms || null,
        profile_image_url: profileImageUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating voice profile:', insertError);
      throw insertError;
    }

    console.log('Voice profile created successfully:', profile.id);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-voice-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
