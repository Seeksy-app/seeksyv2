import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Submit Shotstack Render Job
 * 
 * Creates a video clip render job using Shotstack Edit API.
 * Supports vertical (9:16) format for social media (Reels, TikTok, Shorts).
 * 
 * Input:
 * - clipId: UUID of the clips record
 * - cloudflareDownloadUrl: MP4 download URL from Cloudflare Stream
 * - start: start time in seconds (relative to source video)
 * - length: duration in seconds
 * - orientation: 'vertical' (9:16) or 'horizontal' (16:9) - defaults to vertical
 * 
 * Process:
 * 1. Validates input and authenticates user
 * 2. Builds Shotstack render JSON payload
 * 3. Submits to Shotstack API
 * 4. Updates clips record with shotstack_job_id and status
 */

interface SubmitRenderRequest {
  clipId: string;
  cloudflareDownloadUrl: string;
  start?: number; // Start offset within the source video (defaults to 0)
  length: number; // Clip duration in seconds
  orientation?: 'vertical' | 'horizontal'; // Output format
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SUBMIT SHOTSTACK RENDER ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        },
      }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    // Parse request
    const requestData: SubmitRenderRequest = await req.json();
    const {
      clipId,
      cloudflareDownloadUrl,
      start = 0,
      length,
      orientation = 'vertical',
    } = requestData;

    console.log(`✓ Request parsed - Clip: ${clipId}, Length: ${length}s, Orientation: ${orientation}`);

    // Validate clip exists and belongs to user
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("*")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .single();

    if (clipError || !clip) {
      throw new Error(`Clip not found or access denied: ${clipId}`);
    }

    // Get Shotstack API key
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!SHOTSTACK_API_KEY) {
      throw new Error("Shotstack API key not configured");
    }

    // Get webhook URL (our shotstack-webhook endpoint)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${SUPABASE_URL}/functions/v1/shotstack-webhook`;

    // Build Shotstack render payload
    const outputSize = orientation === 'vertical'
      ? { width: 1080, height: 1920 } // 9:16 for Reels/TikTok/Shorts
      : { width: 1920, height: 1080 }; // 16:9 for YouTube

    const renderPayload = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: cloudflareDownloadUrl,
                },
                start: 0, // Always start at 0 within the clip timeline
                length: length, // Duration of clip
                scale: 1,
                fit: "crop", // Crop to prevent pillarboxing
              },
            ],
          },
        ],
      },
      output: {
        format: "mp4",
        size: outputSize,
      },
      callback: callbackUrl,
      disk: "local", // Store on Shotstack's CDN
    };

    console.log("→ Submitting render to Shotstack...");
    console.log("  Source:", cloudflareDownloadUrl);
    console.log("  Output:", `${outputSize.width}x${outputSize.height}`);

    // Submit to Shotstack Edit API
    const shotstackResponse = await fetch("https://api.shotstack.io/edit/v1/render", {
      method: "POST",
      headers: {
        "x-api-key": SHOTSTACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(renderPayload),
    });

    const shotstackData = await shotstackResponse.json();

    if (!shotstackResponse.ok || !shotstackData.success) {
      const errorMsg = shotstackData.message || JSON.stringify(shotstackData);
      console.error("✗ Shotstack API error:", errorMsg);
      throw new Error(`Shotstack render failed: ${errorMsg}`);
    }

    const shotstackJobId = shotstackData.response.id;
    console.log(`✓ Shotstack job created: ${shotstackJobId}`);

    // Update clips record
    const { error: updateError } = await supabase
      .from("clips")
      .update({
        shotstack_job_id: shotstackJobId,
        shotstack_status: "queued",
        status: "processing",
        source_cloudflare_url: cloudflareDownloadUrl,
      })
      .eq("id", clipId);

    if (updateError) {
      console.error("Failed to update clip record:", updateError);
      throw updateError;
    }

    console.log("✓ Clip record updated with Shotstack job ID");

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipId,
        shotstackJobId: shotstackJobId,
        status: "queued",
        message: "Render job submitted to Shotstack successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Submit render error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
