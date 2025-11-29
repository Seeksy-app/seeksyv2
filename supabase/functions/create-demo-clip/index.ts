import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CREATE DEMO CLIP - Shotstack Integration
 * 
 * Creates a demo clip using Shotstack Edit API:
 * - Creates clips record with proper status tracking
 * - Extracts Cloudflare Stream MP4 download URL
 * - Submits render job to Shotstack
 * - Returns clipId for status polling
 * - Shotstack webhook updates clip when rendering completes
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

    // Extract and verify user JWT from Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
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

    // STEP 2: Submit to Shotstack for rendering
    console.log("Submitting to Shotstack for OpusClip-quality rendering...");
    
    // Get Cloudflare download URL for the source video
    // Extract video ID from file_url (format: https://customer-xxx.cloudflarestream.com/VIDEO_ID/...)
    const videoIdMatch = sourceVideo.file_url.match(/cloudflarestream\.com\/([^\/]+)/);
    if (!videoIdMatch) {
      throw new Error("Could not extract Cloudflare video ID from file_url");
    }
    
    const videoId = videoIdMatch[1];
    const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const cloudflareDownloadUrl = `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/downloads/default.mp4`;
    
    console.log("Cloudflare download URL:", cloudflareDownloadUrl);

    const shotstackResponse = await supabase.functions.invoke('submit-shotstack-render', {
      headers: {
        Authorization: authHeader, // Pass the user's JWT token
      },
      body: {
        clipId: clipRecord.id,
        cloudflareDownloadUrl: cloudflareDownloadUrl,
        start: 0, // Clip from the beginning (Shotstack doesn't support trimming before render)
        length: duration,
        orientation: "vertical",
      }
    });

    if (shotstackResponse.error) {
      const shotstackError = shotstackResponse.error;
      console.error("Shotstack submission failed:", JSON.stringify(shotstackError, null, 2));
      
      throw new Error(JSON.stringify({
        error: "Shotstack submission failed",
        message: shotstackError.message || 'Failed to submit render job',
      }));
    }

    const shotstackData = shotstackResponse.data;
    console.log("Shotstack job submitted:", shotstackData);

    console.log("SHOTSTACK SUCCESS", JSON.stringify({
      clipId: clipRecord.id,
      shotstackJobId: shotstackData.shotstackJobId,
      engine: 'shotstack',
      status: shotstackData.status,
    }, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipRecord.id,
        shotstackJobId: shotstackData.shotstackJobId,
        title: "Demo: AI Clip Test",
        duration: duration,
        status: "processing",
        message: "Clip submitted to Shotstack. Use the clipId to poll for completion.",
        instructions: "Poll GET /clips?id={clipId} to check status. When status='ready', vertical_url will contain the final video.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("SHOTSTACK ERROR - Full details:", JSON.stringify({
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
