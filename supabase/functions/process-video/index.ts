import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessVideoRequest {
  mediaFileId: string;
  jobType: 'ai_edit' | 'ad_insertion' | 'full_process';
  config?: {
    removeFillers?: boolean;
    removePauses?: boolean;
    adSlots?: Array<{
      slotType: 'pre_roll' | 'mid_roll' | 'post_roll';
      positionSeconds?: number;
      adFileUrl: string;
      adDuration: number;
    }>;
  };
}

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

    const { mediaFileId, jobType, config = {} }: ProcessVideoRequest = await req.json();

    console.log("Processing video:", { mediaFileId, jobType });

    // Get media file details
    const { data: mediaFile, error: mediaError } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", mediaFileId)
      .single();

    if (mediaError || !mediaFile) {
      throw new Error("Media file not found");
    }

    // Verify ownership
    if (mediaFile.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Create processing job
    const { data: job, error: jobError } = await supabase
      .from("media_processing_jobs")
      .insert({
        media_file_id: mediaFileId,
        job_type: jobType,
        status: "processing",
        processing_started_at: new Date().toISOString(),
        config: config,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    console.log("Created processing job:", job.id);

    // Start background processing (fire and forget)
    processVideoBackground(supabase, job.id, mediaFile, jobType, config).catch(err => {
      console.error("Background processing error:", err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        message: "Video processing started",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error starting video processing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processVideoBackground(
  supabase: any,
  jobId: string,
  mediaFile: any,
  jobType: string,
  config: any
) {
  const startTime = Date.now();
  
  try {
    console.log("Background processing started for job:", jobId);

    // STEP 1: Analyze video content with Lovable AI
    console.log("Starting AI video analysis...");
    const analysisResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-video-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          mediaFileId: mediaFile.id,
          videoUrl: mediaFile.file_url,
          analysisType: jobType,
        }),
      }
    );

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      throw new Error(`Analysis failed: ${error}`);
    }

    const { analysis } = await analysisResponse.json();
    console.log("AI analysis completed:", analysis);

    let processedFileUrl = mediaFile.file_url;
    let processingResults: any = {
      analysis,
      processingType: jobType,
    };

    // STEP 2: Process based on job type
    if (jobType === 'ai_edit' || jobType === 'full_process') {
      console.log("Applying AI edits...");
      
      const fillerWords = analysis.fillerWords || [];
      const qualityIssues = analysis.qualityIssues || [];
      
      processingResults.editsApplied = {
        fillerWordsIdentified: fillerWords.length,
        totalFillerDuration: fillerWords.reduce((sum: number, fw: any) => sum + (fw.duration || 0), 0),
        qualityEnhancementsNeeded: qualityIssues.filter((i: any) => i.severity === 'high').length,
        scenesAnalyzed: (analysis.scenes || []).length,
        transcriptGenerated: !!analysis.transcript,
      };

      // In production: Apply FFmpeg cuts for filler words
      // processedFileUrl = await applyFFmpegEdits(mediaFile.file_url, fillerWords);
    }

    // STEP 3: Ad Insertion processing
    let adsInserted = 0;
    if (jobType === 'ad_insertion' || jobType === 'full_process') {
      console.log("Processing ad insertion...");
      
      const suggestedBreaks = analysis.suggestedAdBreaks || [];
      const adSlots = config.adSlots || [];
      
      if (adSlots.length > 0) {
        for (const slot of adSlots) {
          await supabase.from("media_ad_slots").insert({
            media_file_id: mediaFile.id,
            processing_job_id: jobId,
            slot_type: slot.slotType,
            position_seconds: slot.positionSeconds,
            ad_file_url: slot.adFileUrl,
            ad_duration_seconds: slot.adDuration,
          });
          adsInserted++;
        }
      }
      
      processingResults.adInsertionData = {
        adsInserted,
        suggestedBreaks: suggestedBreaks.length,
        optimalTimestamps: suggestedBreaks.map((b: any) => b.timestamp),
      };

      // In production: Splice ads using FFmpeg
      // processedFileUrl = await spliceAdsWithFFmpeg(processedFileUrl, adSlots);
    }

    // STEP 4: Create version record
    const versionType = 
      jobType === 'ai_edit' ? 'ai_edited' :
      jobType === 'ad_insertion' ? 'with_ads' :
      'full_processed';

    const { error: versionError } = await supabase
      .from("media_versions")
      .insert({
        original_media_id: mediaFile.id,
        processing_job_id: jobId,
        version_type: versionType,
        file_url: processedFileUrl,
        file_size_bytes: mediaFile.file_size_bytes,
        duration_seconds: mediaFile.duration_seconds,
        processing_config: processingResults,
        is_primary: false,
      });

    if (versionError) throw versionError;

    // STEP 5: Update job status
    const processingTime = (Date.now() - startTime) / 1000;
    
    await supabase
      .from("media_processing_jobs")
      .update({
        status: "completed",
        processing_completed_at: new Date().toISOString(),
        output_file_url: processedFileUrl,
        output_data: processingResults,
        processing_time_seconds: processingTime,
      })
      .eq("id", jobId);

    console.log(`Job ${jobId} completed in ${processingTime}s`);

  } catch (error) {
    console.error("Background processing error:", error);
    
    // Update job with error
    await supabase
      .from("media_processing_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

/* 
PRODUCTION FFMPEG IMPLEMENTATION NOTES:

Current Implementation:
- Uses Lovable AI (google/gemini-2.5-flash) to analyze video content
- Identifies filler words, quality issues, scene boundaries, and optimal ad break points
- Generates transcripts with timestamps for auto-captions
- Provides detailed analysis that guides editing decisions

To enable actual video editing, you would need to:

1. Set up Docker-based edge function with FFmpeg installed
2. Implement video manipulation:

// Smart Trim/Cut - Remove filler word segments
async function applySmartTrim(inputUrl: string, fillerWords: any[]): Promise<string> {
  const inputPath = await downloadFile(inputUrl);
  const outputPath = "/tmp/trimmed_" + Date.now() + ".mp4";
  
  // Build filter to remove filler word segments
  const segments = buildKeepSegments(fillerWords);
  const filterComplex = segments.map((s, i) => 
    `[0:v]trim=${s.start}:${s.end},setpts=PTS-STARTPTS[v${i}];` +
    `[0:a]atrim=${s.start}:${s.end},asetpts=PTS-STARTPTS[a${i}]`
  ).join(';') + ';' + segments.map((_, i) => `[v${i}][a${i}]`).join('') + 
  `concat=n=${segments.length}:v=1:a=1[outv][outa]`;
  
  await execFFmpeg([
    '-i', inputPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]', '-map', '[outa]',
    '-c:v', 'libx264', '-c:a', 'aac',
    outputPath
  ]);
  
  return await uploadToStorage(outputPath);
}

// Quality Enhancement - Stabilize, denoise, enhance
async function enhanceQuality(inputUrl: string, issues: any[]): Promise<string> {
  const inputPath = await downloadFile(inputUrl);
  const outputPath = "/tmp/enhanced_" + Date.now() + ".mp4";
  
  const videoFilters = [
    'deshake',  // Stabilization
    'eq=brightness=0.06:saturation=1.2',  // Color enhancement
    'unsharp=5:5:1.0:5:5:0.0',  // Sharpening
  ];
  
  const audioFilters = [
    'highpass=f=200',  // Remove low rumble
    'lowpass=f=3000',  // Remove high hiss
    'loudnorm',  // Normalize audio levels
  ];
  
  await execFFmpeg([
    '-i', inputPath,
    '-vf', videoFilters.join(','),
    '-af', audioFilters.join(','),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-c:a', 'aac', '-b:a', '192k',
    outputPath
  ]);
  
  return await uploadToStorage(outputPath);
}

// Auto-Captions - Burn subtitles into video
async function addCaptions(inputUrl: string, transcript: string): Promise<string> {
  const inputPath = await downloadFile(inputUrl);
  const srtPath = await generateSRT(transcript);
  const outputPath = "/tmp/captioned_" + Date.now() + ".mp4";
  
  await execFFmpeg([
    '-i', inputPath,
    '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'`,
    '-c:v', 'libx264', '-c:a', 'copy',
    outputPath
  ]);
  
  return await uploadToStorage(outputPath);
}

// Ad Insertion - Splice ads at optimal points
async function insertAds(videoUrl: string, adSlots: any[]): Promise<string> {
  const videoPath = await downloadFile(videoUrl);
  const adPaths = await Promise.all(adSlots.map(s => downloadFile(s.adFileUrl)));
  const outputPath = "/tmp/with_ads_" + Date.now() + ".mp4";
  
  // Create concat file listing all segments
  const concatList = buildConcatList(videoPath, adPaths, adSlots);
  await Deno.writeTextFile('/tmp/concat.txt', concatList);
  
  await execFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', '/tmp/concat.txt',
    '-c', 'copy',
    outputPath
  ]);
  
  return await uploadToStorage(outputPath);
}

3. Integration requirements:
   - FFmpeg binary in Docker container
   - Sufficient storage for temporary files
   - File download/upload helpers
   - Progress tracking and error handling
   - Timeout management for long videos
*/