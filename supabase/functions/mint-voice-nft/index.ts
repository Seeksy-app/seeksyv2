import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { voiceProfileId, voiceFingerprint, metadata } = await req.json();

    if (!voiceProfileId || !voiceFingerprint) {
      throw new Error('Missing required fields: voiceProfileId, voiceFingerprint');
    }

    console.log('Minting voice NFT for profile:', voiceProfileId);

    // Check if certificate already exists
    const { data: existing } = await supabaseClient
      .from('voice_blockchain_certificates')
      .select('id, certification_status')
      .eq('voice_profile_id', voiceProfileId)
      .eq('creator_id', user.id)
      .single();

    if (existing && existing.certification_status === 'verified') {
      throw new Error('Voice already certified on-chain');
    }

    // Generate unique token ID from voice fingerprint
    const tokenId = `voice-${Date.now()}-${voiceFingerprint.substring(0, 8)}`;

    // Prepare NFT metadata
    const nftMetadata = {
      name: metadata?.voiceName || 'Voice Profile',
      description: metadata?.description || 'Creator voice profile certified on Polygon',
      voice_fingerprint: voiceFingerprint,
      creator_id: user.id,
      profile_id: voiceProfileId,
      recording_date: metadata?.recordingDate || new Date().toISOString(),
      certification_date: new Date().toISOString(),
      usage_terms: metadata?.usageTerms || 'Standard licensing',
      attributes: [
        {
          trait_type: 'Voice Type',
          value: metadata?.voiceType || 'Professional'
        },
        {
          trait_type: 'Duration',
          value: metadata?.duration || 'N/A'
        },
        {
          trait_type: 'Platform',
          value: 'Seeksy'
        }
      ]
    };

    // Store metadata (simulated IPFS)
    const metadataString = JSON.stringify(nftMetadata);
    const metadataHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(metadataString)
    );
    const metadataHashArray = Array.from(new Uint8Array(metadataHash));
    const metadataHashHex = metadataHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const metadataUri = `ipfs://Qm${metadataHashHex.substring(0, 44)}`;

    console.log('Metadata URI generated:', metadataUri);

    // Simulate blockchain transaction (gasless via Biconomy)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const txHash = '0x' + Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');

    console.log('NFT minted with transaction hash:', txHash);

    // Create or update blockchain certificate
    const certificateData = {
      voice_profile_id: voiceProfileId,
      creator_id: user.id,
      voice_fingerprint_hash: voiceFingerprint,
      token_id: tokenId,
      transaction_hash: txHash,
      metadata_uri: metadataUri,
      nft_metadata: nftMetadata,
      certification_status: 'verified',
      gas_sponsored: true
    };

    let certificate;

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabaseClient
        .from('voice_blockchain_certificates')
        .update(certificateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      certificate = updated;
    } else {
      // Create new
      const { data: created, error: createError } = await supabaseClient
        .from('voice_blockchain_certificates')
        .insert(certificateData)
        .select()
        .single();

      if (createError) throw createError;
      certificate = created;
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificate,
        transactionHash: txHash,
        tokenId,
        metadataUri,
        explorerUrl: `https://polygonscan.com/tx/${txHash}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error minting voice NFT:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
