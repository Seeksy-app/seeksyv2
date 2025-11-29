import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CREATE DEMO CLIP - Phase 3 Cloudflare Stream Pipeline
 * 
 * Creates a demo clip using the Phase 3 pipeline:
 * - Creates clips record with proper status tracking
 * - Calls process-clip-phase3 for OpusClip-quality processing
 * - Generates vertical (9:16) and thumbnail (1:1) clips
 * - Uses Cloudflare Stream for real video transformations
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

    // Use service role key for edge function to bypass RLS
    supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        global: { 
          headers: { 
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` 
          } 
        } 
      }
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

    // STEP 2: Call Phase 3 processing with Cloudflare Stream
    console.log("Calling process-clip-phase3 to generate OpusClip-quality clips...");
    
    const processResponse = await supabase.functions.invoke('process-clip-phase3', {
      body: {
        clipId: clipRecord.id,
        sourceVideoUrl: sourceVideo.file_url,
        startTime: startTime,
        duration: duration,
        title: "Demo: AI Clip Test",
        transcript: "This is a demonstration clip showing the complete Phase 3 pipeline with Cloudflare Stream transformations.",
      }
    });

    if (processResponse.error) {
      console.error("Processing error:", processResponse.error);
      throw new Error(`Clip processing failed: ${processResponse.error.message || 'Unknown error'}`);
    }

    const processData = processResponse.data;
    console.log("Processing complete:", processData);

    console.log("PHASE3 SUCCESS", JSON.stringify({
      clipId: clipRecord.id,
      jobId: processData.vertical?.jobId,
      engine: 'cloudflare_stream',
      verticalUrl: processData.vertical?.url,
      thumbnailUrl: processData.thumbnail?.url,
    }, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipRecord.id,
        title: "Demo: AI Clip Test",
        duration: duration,
        vertical: processData.vertical,
        thumbnail: processData.thumbnail,
        message: "Phase 3: OpusClip-quality clips generated with Cloudflare Stream",
        phase: "Phase 3 - Cloudflare Stream Processing",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("PHASE3 ERROR - Full details:", JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      clipId: clipRecord?.id,
      hasSupabaseClient: !!supabase,
    }, null, 2));
    
    // Update clip status to failed if we have a clipRecord
    if (clipRecord?.id && supabase) {
      try {
        await supabase
          .from("clips")
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error)
          })
          .eq("id", clipRecord.id);
      } catch (updateError) {
        console.error("Failed to update clip status:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: String(error),
        code: (error as any)?.code,
        hint: (error as any)?.hint,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
