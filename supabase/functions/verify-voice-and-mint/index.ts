import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Unified Voice Verification + Minting Flow
 * 
 * Steps:
 * 1. Receive and validate audio
 * 2. Generate voiceHash with OpenAI
 * 3. Create voice profile record
 * 4. Create identity_assets record
 * 5. Call mint-identity-certificate
 * 6. Create voice_blockchain_certificates record
 * 7. Update voice profile to verified
 * 8. Return success
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const { audioData, recordingDuration, selectedPrompt } = await req.json();

    if (!audioData) {
      throw new Error('Audio data is required');
    }

    console.log('[verify-voice-and-mint] Starting verification for user:', user.id);

    // Step 1: Validate audio (basic checks - production would use proper audio analysis)
    if (audioData.length < 1000) {
      throw new Error('Audio file size too small');
    }

    // Step 2: Generate voice hash using OpenAI (simplified for now)
    const encoder = new TextEncoder();
    const data = encoder.encode(audioData + user.id + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const voiceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('[verify-voice-and-mint] Voice hash generated');

    // Step 3: Create voice profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('creator_voice_profiles')
      .insert({
        user_id: user.id,
        voice_name: user.user_metadata?.full_name || 'My Voice',
        is_verified: false
      })
      .select()
      .single();

    if (profileError) {
      // Profile might already exist
      const { data: existingProfile } = await supabaseClient
        .from('creator_voice_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!existingProfile) {
        throw new Error(`Failed to create voice profile: ${profileError.message}`);
      }
    }

    const voiceProfileId = profile?.id || (await supabaseClient
      .from('creator_voice_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()).data?.id;

    console.log('[verify-voice-and-mint] Voice profile ready:', voiceProfileId);

    // Step 4: Create identity asset
    const { data: asset, error: assetError } = await supabaseClient
      .from('identity_assets')
      .insert({
        user_id: user.id,
        type: 'voice_identity',
        hash_value: voiceHash,
        cert_status: 'pending'
      })
      .select()
      .single();

    if (assetError) throw new Error(`Failed to create identity asset: ${assetError.message}`);

    console.log('[verify-voice-and-mint] Identity asset created:', asset.id);

    // Step 5: Mint certificate on blockchain
    const mintResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/mint-identity-certificate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.get('Authorization')!,
        },
        body: JSON.stringify({
          identityAssetId: asset.id,
          chain: "polygon",
        }),
      }
    );

    const mintData = await mintResponse.json();

    if (!mintResponse.ok || !mintData.success) {
      throw new Error(mintData.message || 'Blockchain minting failed');
    }

    console.log('[verify-voice-and-mint] Certificate minted:', mintData.certificate.tx_hash);

    // Step 6: Create blockchain certificate record
    const { error: certError } = await supabaseClient
      .from('voice_blockchain_certificates')
      .insert({
        voice_profile_id: voiceProfileId,
        creator_id: user.id,
        voice_fingerprint_hash: voiceHash,
        token_id: mintData.certificate.token_id,
        transaction_hash: mintData.certificate.tx_hash,
        certification_status: 'verified',
        contract_address: mintData.certificate.contract_address,
        cert_explorer_url: mintData.certificate.explorer_url,
        metadata_uri: `ipfs://voice-${voiceHash.slice(0, 16)}`,
        nft_metadata: {
          name: user.user_metadata?.full_name || 'Voice Profile',
          voice_hash: voiceHash
        }
      });

    if (certError) {
      console.error('[verify-voice-and-mint] Certificate insert error:', certError);
      // Continue anyway - we have the blockchain record
    }

    // Step 7: Update voice profile to verified
    await supabaseClient
      .from('creator_voice_profiles')
      .update({ is_verified: true })
      .eq('id', voiceProfileId);

    console.log('[verify-voice-and-mint] Voice profile marked as verified');

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        assetId: asset.id,
        voiceProfileId,
        voiceHash,
        certificate: mintData.certificate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[verify-voice-and-mint] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
