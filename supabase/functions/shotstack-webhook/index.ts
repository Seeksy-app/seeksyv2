import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shotstack-signature, x-shotstack-timestamp",
};

/**
 * Shotstack Webhook Handler
 * 
 * Receives status updates from Shotstack when render jobs complete.
 * 
 * Shotstack sends POST requests with:
 * - id: Shotstack render job ID
 * - status: queued, fetching, rendering, done, failed
 * - url: Final rendered video URL (when status === "done")
 * - error: Error message (when status === "failed")
 * 
 * Headers (for signature verification):
 * - x-shotstack-signature: HMAC signature
 * - x-shotstack-timestamp: Unix timestamp
 * 
 * Process:
 * 1. Parse webhook payload
 * 2. Look up clip by shotstack_job_id
 * 3. Update clip status based on Shotstack status
 * 4. When done, save final video URL to storage_path/vertical_url
 */

interface ShotstackWebhookPayload {
  id: string; // Shotstack job ID
  owner: string;
  action: string; // "render-status"
  type: string; // "status"
  status: "queued" | "fetching" | "rendering" | "done" | "failed";
  url?: string; // Final video URL when status === "done"
  error?: string; // Error message when status === "failed"
  completed?: string; // ISO timestamp
  data?: {
    duration?: number;
    size?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SHOTSTACK WEBHOOK RECEIVED ===");

    // Optional: Verify webhook signature
    const signature = req.headers.get("x-shotstack-signature");
    const timestamp = req.headers.get("x-shotstack-timestamp");
    
    if (signature && timestamp) {
      // Future: Implement HMAC verification using SHOTSTACK_WEBHOOK_SECRET
      console.log("→ Webhook signature present (verification not yet implemented)");
    }

    // Parse payload
    const payload: ShotstackWebhookPayload = await req.json();
    console.log("→ Webhook payload:", JSON.stringify(payload, null, 2));

    const { id: shotstackJobId, status, url, error } = payload;

    if (!shotstackJobId) {
      throw new Error("Missing Shotstack job ID in webhook payload");
    }

    console.log(`→ Job: ${shotstackJobId}, Status: ${status}`);

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

    // Look up clip by Shotstack job ID
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("*")
      .eq("shotstack_job_id", shotstackJobId)
      .single();

    if (clipError || !clip) {
      console.error(`✗ Clip not found for Shotstack job: ${shotstackJobId}`);
      throw new Error(`Clip not found for job ${shotstackJobId}`);
    }

    console.log(`✓ Found clip: ${clip.id}`);

    // Update clip based on status
    let updateData: any = {
      shotstack_status: status,
    };

    if (status === "done") {
      // Render complete - save final URL
      if (!url) {
        throw new Error("Shotstack returned 'done' status but no URL");
      }

      console.log(`✓ Render complete: ${url}`);

      updateData = {
        ...updateData,
        status: "ready",
        vertical_url: url, // Store final rendered video URL
        storage_path: url, // Also update storage_path for backwards compatibility
        error_message: null, // Clear any previous errors
      };

      // Check if blockchain certification should be enabled
      // For Phase 1: Auto-enable for all clips (later: check user/workspace settings)
      if (clip.cert_status === 'not_requested') {
        console.log("→ Clip eligible for blockchain certification");
        updateData.cert_status = 'pending';
      }

      // Optional: Create ai_edited_assets record for tracking
      try {
        await supabase.from("ai_edited_assets").insert({
          source_media_id: clip.source_media_id,
          ai_job_id: clip.ai_job_id,
          output_type: "vertical",
          storage_path: url,
          duration_seconds: clip.duration_seconds,
          metadata: {
            shotstack_job_id: shotstackJobId,
            processing_method: "shotstack_edit_api",
            completed_at: new Date().toISOString(),
          },
        });
        console.log("✓ Created ai_edited_assets record");
      } catch (assetError) {
        console.error("Warning: Failed to create ai_edited_assets record:", assetError);
        // Don't throw - clip update is more important
      }

    } else if (status === "failed") {
      // Render failed
      const errorMessage = error || "Shotstack render failed (no error message provided)";
      console.error(`✗ Render failed: ${errorMessage}`);

      updateData = {
        ...updateData,
        status: "failed",
        error_message: errorMessage,
      };

    } else {
      // Intermediate statuses: queued, fetching, rendering
      console.log(`→ Status update: ${status}`);
    }

    // Update clip record
    const { error: updateError } = await supabase
      .from("clips")
      .update(updateData)
      .eq("id", clip.id);

    if (updateError) {
      console.error("Failed to update clip:", updateError);
      throw updateError;
    }

    console.log(`✓ Clip ${clip.id} updated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clip.id,
        status: status,
        message: `Webhook processed for job ${shotstackJobId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    
    // Return 200 even on error to prevent Shotstack from retrying
    // Log the error but acknowledge receipt
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        acknowledged: true,
      }),
      {
        status: 200, // Return 200 to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
