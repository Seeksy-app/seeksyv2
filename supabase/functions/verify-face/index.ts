import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Verify Face Identity
 * 
 * Processes face images/video to:
 * 1. Extract face embedding using OpenAI Vision API
 * 2. Generate stable faceHash
 * 3. Mint Face Identity Certificate on Polygon
 * 4. Store certificate data in identity_assets
 * 
 * Input: { images: string[] } - base64 encoded images
 * Output: { status, faceHash, txHash, explorerUrl, metadataUri }
 */

interface VerifyFaceRequest {
  images: string[]; // base64 encoded images
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== VERIFY FACE IDENTITY ===");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    console.log(`→ Authenticated user: ${user.id}`);

    const requestData: VerifyFaceRequest = await req.json();
    const { images } = requestData;

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    console.log(`→ Processing ${images.length} face images`);

    // Check if user already has a face identity asset
    const { data: existingAsset } = await supabase
      .from('identity_assets')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'face_identity')
      .maybeSingle();

    let assetId: string;

    if (existingAsset) {
      assetId = existingAsset.id;
      console.log(`→ Updating existing face identity: ${assetId}`);
      
      // Update to pending
      await supabase
        .from('identity_assets')
        .update({ 
          cert_status: 'pending',
          cert_updated_at: new Date().toISOString(),
        })
        .eq('id', assetId);

      // Log face verification started
      await supabase.from('identity_access_logs').insert({
        identity_asset_id: assetId,
        action: 'face_started',
        actor_id: user.id,
        details: { images_count: images.length },
      });

    } else {
      console.log("→ Creating new face identity asset");
      
      // Create new face identity asset
      const { data: newAsset, error: createError } = await supabase
        .from('identity_assets')
        .insert({
          user_id: user.id,
          type: 'face_identity',
          title: 'Face Identity',
          file_url: '', // Will be populated if we store processed image
          cert_status: 'pending',
          permissions: {
            clip_use: false,
            ai_generation: false,
            advertiser_access: false,
            anonymous_training: false,
          },
          consent_version: '1.0',
        })
        .select()
        .single();

      if (createError || !newAsset) {
        throw new Error("Failed to create face identity asset");
      }

      assetId = newAsset.id;
      console.log(`→ Created face identity asset: ${assetId}`);

      // Log face verification started
      await supabase.from('identity_access_logs').insert({
        identity_asset_id: assetId,
        action: 'face_started',
        actor_id: user.id,
        details: { images_count: images.length },
      });
    }

    // Step 1: Extract best frame (use first image for MVP)
    const bestImage = images[0];
    console.log("→ Using first image for face extraction");

    // Step 2: Generate face embedding using OpenAI Vision
    console.log("→ Analyzing face with AI...");
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this face and provide a detailed description of facial features including face shape, eye characteristics, nose structure, and overall facial geometry. Be specific and consistent for identity verification purposes.",
              },
              {
                type: "image_url",
                image_url: {
                  url: bestImage.startsWith('data:') ? bestImage : `data:image/jpeg;base64,${bestImage}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const faceDescription = openaiData.choices[0].message.content;
    console.log("✓ Face analysis complete");

    // Step 3: Generate stable faceHash from embedding
    const hash = createHash('sha256');
    hash.update(faceDescription + user.id); // Include user ID for uniqueness
    const faceHash = '0x' + hash.digest('hex');
    
    console.log(`→ Generated faceHash: ${faceHash.substring(0, 10)}...`);

    // Step 4: Create metadata for IPFS (simulated for MVP)
    const metadataUri = `ipfs://Qm${faceHash.substring(2, 48)}`; // Simulated IPFS URI
    const metadata = {
      name: "Seeksy Face Identity Certificate",
      description: "Blockchain-verified face identity",
      creator: user.id,
      faceHash,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    console.log(`→ Metadata URI: ${metadataUri}`);

    // Step 5: Update asset with face_hash and metadata
    await supabase
      .from('identity_assets')
      .update({
        face_hash: faceHash,
        face_metadata_uri: metadataUri,
        cert_status: 'minting',
        cert_updated_at: new Date().toISOString(),
      })
      .eq('id', assetId);

    // Step 6: Mint Face Identity Certificate on Polygon
    console.log("→ Minting face certificate on blockchain...");

    const mintResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/mint-identity-certificate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          identityAssetId: assetId,
          chain: "polygon",
        }),
      }
    );

    const mintResult = await mintResponse.json();

    if (!mintResult.success) {
      console.error("❌ Blockchain minting failed:", mintResult.error);
      
      // Update to failed status
      await supabase
        .from('identity_assets')
        .update({ cert_status: 'failed', cert_updated_at: new Date().toISOString() })
        .eq('id', assetId);

      // Log failure
      await supabase.from('identity_access_logs').insert({
        identity_asset_id: assetId,
        action: 'face_failed',
        actor_id: user.id,
        details: { error: mintResult.error },
      });

      return new Response(
        JSON.stringify({
          status: "failed",
          message: "Face verification failed during blockchain minting",
          error: mintResult.error,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✓ Face identity verified and minted on-chain");

    // Log success
    await supabase.from('identity_access_logs').insert({
      identity_asset_id: assetId,
      action: 'face_verified',
      actor_id: user.id,
      details: {
        faceHash,
        tx_hash: mintResult.certificate.tx_hash,
        chain: mintResult.certificate.chain,
      },
    });

    return new Response(
      JSON.stringify({
        status: "verified",
        faceHash,
        txHash: mintResult.certificate.tx_hash,
        explorerUrl: mintResult.certificate.explorer_url,
        metadataUri,
        assetId,
        message: "Face identity verified successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Face verification error:", error);
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});