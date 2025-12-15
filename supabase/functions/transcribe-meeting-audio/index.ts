import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingNoteId, audioFilePath } = await req.json();
    
    if (!meetingNoteId || !audioFilePath) {
      throw new Error("meetingNoteId and audioFilePath are required");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Transcribing audio for meeting:", meetingNoteId);
    console.log("Audio file path:", audioFilePath);

    // Update status to transcribing
    await supabase
      .from("board_meeting_notes")
      .update({ ai_notes_status: "transcribing" })
      .eq("id", meetingNoteId);

    // Download audio file from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("meeting-recordings")
      .download(audioFilePath);

    if (downloadError || !audioData) {
      console.error("Failed to download audio:", downloadError);
      throw new Error("Failed to download audio file");
    }

    console.log("Audio downloaded, size:", audioData.size);

    // Send to OpenAI Whisper for transcription
    const formData = new FormData();
    formData.append("file", audioData, "meeting-audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "en");
    formData.append("response_format", "verbose_json");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", whisperResponse.status, errorText);
      throw new Error(`Whisper transcription failed: ${whisperResponse.status}`);
    }

    const transcriptionResult = await whisperResponse.json();
    console.log("Transcription complete, duration:", transcriptionResult.duration);

    // Store the transcript
    const { error: updateError } = await supabase
      .from("board_meeting_notes")
      .update({
        audio_transcript: transcriptionResult.text,
        ai_notes_status: "transcribed",
      })
      .eq("id", meetingNoteId);

    if (updateError) {
      console.error("Failed to save transcript:", updateError);
      throw new Error("Failed to save transcript");
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcriptionResult.text,
        duration: transcriptionResult.duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("transcribe-meeting-audio error:", error);
    
    // Update status to error
    try {
      const { meetingNoteId } = await (await fetch(req.url)).json().catch(() => ({}));
      if (meetingNoteId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("board_meeting_notes")
          .update({ ai_notes_status: "error" })
          .eq("id", meetingNoteId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
