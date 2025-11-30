import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  // ===== BOOT DIAGNOSTICS =====
  try {
    console.log("[VerifyFace][BOOT] Function invoked");
    
    // Log environment variables (only lengths/existence, NOT actual secrets)
    console.log("[VerifyFace][ENV] OPENAI_API_KEY length:", Deno.env.get("OPENAI_API_KEY")?.length || "missing");
    console.log("[VerifyFace][ENV] SEEKSY_MINTER_PRIVATE_KEY length:", Deno.env.get("SEEKSY_MINTER_PRIVATE_KEY")?.length || "missing");
    console.log("[VerifyFace][ENV] POLYGON_RPC_URL exists:", !!Deno.env.get("POLYGON_RPC_URL"));
    console.log("[VerifyFace][ENV] SUPABASE_URL exists:", !!Deno.env.get("SUPABASE_URL"));
    console.log("[VerifyFace][ENV] SUPABASE_SERVICE_ROLE_KEY exists:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    
    // Log request details
    console.log("[VerifyFace][REQ] Method:", req.method);
    console.log("[VerifyFace][REQ] Has Authorization header:", !!req.headers.get("Authorization"));
    console.log("[VerifyFace][REQ] Content-Type:", req.headers.get("Content-Type"));
  } catch (bootErr) {
    console.error("[VerifyFace][BOOT ERROR]", bootErr);
    console.error("[VerifyFace][BOOT ERROR STACK]", bootErr instanceof Error ? bootErr.stack : "No stack");
  }
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
        console.error("❌ Failed to create face identity asset:", createError);
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
      console.error("❌ OPENAI_API_KEY not configured");
      throw new Error("OpenAI API key not configured");
    }

    console.log("→ OpenAI API key found, calling Vision API...");

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
      const errorText = await openaiResponse.text();
      console.error("❌ OpenAI API error:", openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
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

    // Step 5: Update asset with face_hash and metadata (let mint function handle status)
    await supabase
      .from('identity_assets')
      .update({
        face_hash: faceHash,
        face_metadata_uri: metadataUri,
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
      const errorMsg = mintResult.error || mintResult.message || "Unknown minting error";
      const stage = mintResult.stage || "mint";
      const code = mintResult.code || "UNKNOWN_ERROR";
      
      console.error(`❌ Blockchain minting failed at ${stage}:`, errorMsg);
      console.error(`❌ Error code: ${code}`);
      
      // Update to failed status
      await supabase
        .from('identity_assets')
        .update({ cert_status: 'failed', cert_updated_at: new Date().toISOString() })
        .eq('id', assetId);

      // Log failure with detailed error info
      await supabase.from('identity_access_logs').insert({
        identity_asset_id: assetId,
        action: 'face_failed',
        actor_id: user.id,
        details: { 
          error: errorMsg,
          stage,
          code,
        },
      });

      return new Response(
        JSON.stringify({
          status: "failed",
          stage,
          code,
          message: errorMsg,
          details: "Face verification completed but blockchain minting failed",
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
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Determine error stage
    let stage: string = "unknown";
    let code: string = "UNKNOWN_ERROR";
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("OpenAI") || errorMsg.includes("API key")) {
      stage = "openai";
      code = "OPENAI_ERROR";
    } else if (errorMsg.includes("authentication") || errorMsg.includes("Not authenticated")) {
      stage = "auth";
      code = "AUTH_ERROR";
    } else if (errorMsg.includes("images")) {
      stage = "input";
      code = "INVALID_INPUT";
    } else if (errorMsg.includes("blockchain") || errorMsg.includes("mint")) {
      stage = "mint";
      code = "MINT_ERROR";
    } else if (errorMsg.includes("database") || errorMsg.includes("identity_assets")) {
      stage = "db";
      code = "DB_ERROR";
    }
    
    return new Response(
      JSON.stringify({
        status: "failed",
        stage,
        code,
        error: errorMsg,
        message: `Face verification failed at ${stage}: ${errorMsg}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});