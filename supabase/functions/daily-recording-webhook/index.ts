import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Daily webhook received:', payload.type);

    // Use service role for webhook (no user auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle recording.ready-to-download event
    if (payload.type === 'recording.ready-to-download') {
      const { room_name, recording_id, duration, download_link, s3_key } = payload.payload || {};

      console.log('Recording ready:', {
        room_name,
        recording_id,
        duration,
        download_link,
      });

      // Find the meeting by room name
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('meetings')
        .select('id')
        .eq('room_name', room_name)
        .single();

      if (meetingError || !meeting) {
        console.error('Meeting not found for room:', room_name);
        return new Response(
          JSON.stringify({ success: false, error: 'Meeting not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update recording record with download URL
      const { error: updateError } = await supabaseClient
        .from('meeting_recordings')
        .update({
          recording_url: download_link,
          duration: Math.round(duration || 0),
          daily_recording_id: recording_id,
          status: 'completed',
        })
        .eq('meeting_id', meeting.id)
        .eq('status', 'processing');

      if (updateError) {
        console.error('Error updating recording:', updateError);
        
        // If no existing record, create one
        await supabaseClient
          .from('meeting_recordings')
          .insert({
            meeting_id: meeting.id,
            recording_url: download_link,
            duration: Math.round(duration || 0),
            daily_recording_id: recording_id,
            status: 'completed',
          });
      }

      console.log('Recording saved for meeting:', meeting.id);

      // Optionally upload to R2 for permanent storage
      const R2_BUCKET = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME');
      const R2_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
      
      if (R2_BUCKET && R2_ACCESS_KEY && download_link) {
        console.log('TODO: Upload recording to R2 for permanent storage');
        // Future: Download from Daily and upload to R2
      }
    }

    // Handle recording.error event
    if (payload.type === 'recording.error') {
      const { room_name, error: recordingError } = payload.payload || {};
      console.error('Recording error for room:', room_name, recordingError);

      const { data: meeting } = await supabaseClient
        .from('meetings')
        .select('id')
        .eq('room_name', room_name)
        .single();

      if (meeting) {
        await supabaseClient
          .from('meeting_recordings')
          .update({ status: 'failed' })
          .eq('meeting_id', meeting.id)
          .eq('status', 'recording');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-recording-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
