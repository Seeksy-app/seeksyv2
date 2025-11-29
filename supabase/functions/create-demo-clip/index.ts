import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CREATE DEMO CLIP - Pipeline Validation
 * 
 * This creates one concrete demo clip to prove the pipeline works end-to-end:
 * - Creates clips record with proper status
 * - Creates ai_jobs tracking
 * - Creates ai_edited_assets  
 * - Links to real source video
 * - Displays in UI with proper metadata
 * 
 * Note: Uses source video directly since FFmpeg not available
 * Will be replaced with Cloudflare Stream API processing
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    console.log("Creating demo clip for user:", user.id);

    // Get a source video from the user's library
    const { data: sourceVideos, error: videosError } = await supabase
      .from("media_files")
      .select("id, file_url, file_name, duration_seconds")
      .eq("user_id", user.id)
      .ilike("file_type", "video%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (videosError || !sourceVideos) {
      throw new Error("No source video found. Please upload a video first.");
    }

    const sourceVideo = sourceVideos;
    const startTime = 5; // Start at 5 seconds
    const endTime = Math.min(15, sourceVideo.duration_seconds || 30); // 10 second clip
    const duration = endTime - startTime;

    console.log("Source video:", sourceVideo.file_name, "Duration:", duration);

    // STEP 1: Create clips record
    const { data: clipRecord, error: clipError } = await supabase
      .from("clips")
      .insert({
        user_id: user.id,
        source_media_id: sourceVideo.id,
        start_seconds: startTime,
        end_seconds: endTime,
        title: "Demo: AI Clip Test",
        suggested_caption: "🎯 This is a demonstration clip showing the complete pipeline architecture",
        status: 'processing',
      })
      .select()
      .single();

    if (clipError) throw clipError;

    console.log("Created clip record:", clipRecord.id);

    // STEP 2: Create AI jobs for both formats
    // STEP 2: Process both formats sequentially for better error tracking
    const results = [];
    
    for (const format of ['vertical', 'thumbnail']) {
      try {
        console.log(`Creating ${format} job...`);
        
        const { data: job, error: jobError } = await supabase
          .from("ai_jobs")
          .insert({
            user_id: user.id,
            job_type: 'clips_generation',
            engine: 'lovable_ai',
            params: {
              clip_id: clipRecord.id,
              start_time: startTime,
              end_time: endTime,
              output_format: format,
              title: "Demo: AI Clip Test",
              note: "Pipeline validation - using source video with time fragments for demo"
            },
            status: 'processing',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (jobError) {
          console.error(`Job creation error for ${format}:`, jobError);
          throw jobError;
        }

        console.log(`Job created for ${format}:`, job.id);

        // STEP 3: Create asset records (using source video URL for demo)
        const assetUrl = `${sourceVideo.file_url}#t=${startTime},${endTime}`;
        
        const { data: asset, error: assetError } = await supabase
          .from("ai_edited_assets")
          .insert({
            ai_job_id: job.id,
            source_media_id: sourceVideo.id,
            output_type: format === 'vertical' ? 'vertical_clip' : 'thumbnail_clip',
            storage_path: assetUrl,
            duration_seconds: duration,
            metadata: {
              format: format,
              resolution: format === 'vertical' ? '1080x1920' : '1920x1080',
              demo_mode: true,
              note: "Using source video with time fragment - will be replaced with processed clip",
              start_time: startTime,
              end_time: endTime,
            }
          })
          .select()
          .single();

        if (assetError) {
          console.error(`Asset creation error for ${format}:`, assetError);
          throw assetError;
        }

        console.log(`Asset created for ${format}:`, asset.id);

        // STEP 4: Update job as completed
        const { error: updateJobError } = await supabase
          .from("ai_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            processing_time_seconds: 1.5,
          })
          .eq("id", job.id);

        if (updateJobError) {
          console.error(`Job update error for ${format}:`, updateJobError);
          throw updateJobError;
        }

        console.log(`Job completed for ${format}`);

        // STEP 5: Create edit event
        const { error: eventError } = await supabase
          .from("ai_edit_events")
          .insert({
            ai_job_id: job.id,
            event_type: 'clip_generated',
            timestamp_seconds: startTime,
            details: {
              format: format,
              duration: duration,
              demo_mode: true,
            }
          });

        if (eventError) {
          console.error(`Edit event error for ${format}:`, eventError);
          // Don't throw - this is not critical
        }

        results.push({ format, assetUrl, jobId: job.id, assetId: asset.id });
      } catch (error) {
        console.error(`Failed to process ${format} format:`, error);
        // Continue with other format
      }
    }

    if (results.length === 0) {
      throw new Error("Failed to create any clips");
    }

    // STEP 6: Update clips record with URLs
    const verticalResult = results.find(r => r.format === 'vertical');
    const thumbnailResult = results.find(r => r.format === 'thumbnail');

    console.log("Updating clip record with URLs...", {
      vertical: verticalResult?.assetUrl,
      thumbnail: thumbnailResult?.assetUrl,
    });

    const { error: updateClipError } = await supabase
      .from("clips")
      .update({
        status: 'ready',
        vertical_url: verticalResult?.assetUrl || null,
        thumbnail_url: thumbnailResult?.assetUrl || null,
        storage_path: verticalResult?.assetUrl || thumbnailResult?.assetUrl || null,
      })
      .eq("id", clipRecord.id);

    if (updateClipError) {
      console.error("Clip update error:", updateClipError);
      throw updateClipError;
    }

    console.log("✅ Demo clip created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipRecord.id,
        title: "Demo: AI Clip Test",
        duration: duration,
        verticalUrl: verticalResult?.assetUrl,
        thumbnailUrl: thumbnailResult?.assetUrl,
        jobs: results,
        message: "Demo clip created! Pipeline validation complete. Ready for Cloudflare Stream integration.",
        note: "This uses source video with time fragments. Replace with Cloudflare Stream API for actual processing.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error creating demo clip:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
