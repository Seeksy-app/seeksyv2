import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CREATE DEMO CLIP - Phase 2 Pipeline Validation
 * 
 * Creates a demo clip to validate the end-to-end pipeline:
 * - Creates clips record with proper status tracking
 * - Calls process-clip-stream to generate vertical + thumbnail outputs
 * - Validates pipeline architecture with real file generation
 * 
 * Phase 2 MVP: Files are generated but not yet cropped/transformed
 * Phase 3: Add real video processing (FFmpeg or Cloudflare Stream API)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let clipRecord: any = null;
  let supabase: any = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    supabase = createClient(
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
    const { data: clip, error: clipError } = await supabase
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
    clipRecord = clip;

    console.log("Created clip record:", clipRecord.id);

    // STEP 2: Call the processing function to generate real clip files
    console.log("Calling process-clip-stream to generate transformed clips...");
    
    const processResponse = await supabase.functions.invoke('process-clip-stream', {
      body: {
        clipId: clipRecord.id,
        sourceVideoUrl: sourceVideo.file_url,
        startTime: startTime,
        duration: duration,
        outputFormats: ['vertical', 'thumbnail'],
      }
    });

    if (processResponse.error) {
      console.error("Processing error:", processResponse.error);
      throw new Error(`Clip processing failed: ${processResponse.error.message || 'Unknown error'}`);
    }

    const processData = processResponse.data;
    console.log("Processing complete:", processData);

    console.log("✅ Demo clip created successfully with real file outputs");

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipRecord.id,
        title: "Demo: AI Clip Test",
        duration: duration,
        processedClips: processData.processedClips,
        message: "Phase 2 MVP: Clip pipeline validated with real file generation",
        note: "Files are generated but not yet cropped/transformed. Phase 3 will add real video processing with FFmpeg or Cloudflare Stream.",
        phase: "Phase 2 - Pipeline Architecture Validated",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error creating demo clip:", error);
    
    // Update clip status to failed if we have a clipRecord
    if (clipRecord?.id) {
      await supabase
        .from("clips")
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error)
        })
        .eq("id", clipRecord.id);
    }
    
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
