import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElevenLabsConversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs?: number;
  end_time_unix_secs?: number;
  call_duration_secs?: number;
  call?: {
    from_number?: string;
    to_number?: string;
  };
  metadata?: Record<string, unknown>;
}

interface ElevenLabsConversationDetail {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs?: number;
  end_time_unix_secs?: number;
  call_duration_secs?: number;
  transcript?: Array<{
    role: string;
    message: string;
    time_in_call_secs?: number;
  }>;
  analysis?: {
    summary?: string;
    call_successful?: boolean;
    data_collection_results?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  call?: {
    from_number?: string;
    to_number?: string;
    recording_url?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ELEVENLABS BACKFILL CALLS ===');
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { agent_id, limit = 100, owner_id } = body;

    // Step 1: Fetch all conversations from ElevenLabs
    console.log('Fetching conversations from ElevenLabs...');
    
    let url = `https://api.elevenlabs.io/v1/convai/conversations?page_size=${limit}`;
    if (agent_id) {
      url += `&agent_id=${agent_id}`;
    }

    const listResponse = await fetch(url, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Failed to fetch conversations:', errorText);
      throw new Error(`ElevenLabs API error: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const conversations: ElevenLabsConversation[] = listData.conversations || [];
    console.log(`Found ${conversations.length} conversations`);

    // Step 2: Get existing call_external_ids to avoid duplicates
    const { data: existingCalls } = await supabase
      .from('trucking_calls')
      .select('call_external_id')
      .not('call_external_id', 'is', null);

    const existingIds = new Set((existingCalls || []).map(c => c.call_external_id));

    // Also check trucking_call_logs
    const { data: existingLogs } = await supabase
      .from('trucking_call_logs')
      .select('id, transcript, duration_seconds, recording_url')
      .not('transcript', 'is', null);

    const results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ conversation_id: string; status: string; error?: string }>,
    };

    // Get owner_id if not provided
    let resolvedOwnerId = owner_id;
    if (!resolvedOwnerId) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      resolvedOwnerId = anyOwner?.owner_id;
    }

    // Step 3: For each conversation, fetch details and update database
    for (const conv of conversations) {
      try {
        results.processed++;
        
        // Fetch detailed conversation data
        const detailUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        });

        if (!detailResponse.ok) {
          console.warn(`Failed to fetch details for ${conv.conversation_id}`);
          results.errors++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'fetch_error' });
          continue;
        }

        const detail: ElevenLabsConversationDetail = await detailResponse.json();
        
        // Build transcript text
        let transcriptText: string | null = null;
        if (detail.transcript && Array.isArray(detail.transcript)) {
          transcriptText = detail.transcript
            .map(t => `${t.role}: ${t.message}`)
            .join('\n');
        }

        const duration = detail.call_duration_secs || 
          (detail.end_time_unix_secs && detail.start_time_unix_secs 
            ? detail.end_time_unix_secs - detail.start_time_unix_secs 
            : null);

        const audioUrl = detail.call?.recording_url || null;
        const callerPhone = detail.call?.from_number || null;
        const startTime = detail.start_time_unix_secs 
          ? new Date(detail.start_time_unix_secs * 1000).toISOString()
          : null;

        // Check if this conversation already exists in trucking_calls
        if (existingIds.has(conv.conversation_id)) {
          // Update existing record with any missing data
          const { error: updateError } = await supabase
            .from('trucking_calls')
            .update({
              call_duration_seconds: duration,
              transcript_text: transcriptText,
              audio_url: audioUrl,
            })
            .eq('call_external_id', conv.conversation_id)
            .is('transcript_text', null); // Only update if transcript is missing

          if (!updateError) {
            results.updated++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'updated' });
          }
          continue;
        }

        // Try to find matching record in trucking_call_logs by phone/time
        let matchedLogId: string | null = null;
        if (callerPhone && startTime) {
          const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
          const { data: matchedLog } = await supabase
            .from('trucking_call_logs')
            .select('id, transcript, duration_seconds, recording_url')
            .or(`carrier_phone.ilike.%${cleanPhone}%`)
            .gte('created_at', new Date(new Date(startTime).getTime() - 5 * 60 * 1000).toISOString())
            .lte('created_at', new Date(new Date(startTime).getTime() + 5 * 60 * 1000).toISOString())
            .limit(1)
            .maybeSingle();

          if (matchedLog) {
            matchedLogId = matchedLog.id;
            // Update the log with backfilled data
            await supabase
              .from('trucking_call_logs')
              .update({
                duration_seconds: duration || matchedLog.duration_seconds,
                transcript: transcriptText || matchedLog.transcript,
                recording_url: audioUrl || matchedLog.recording_url,
              })
              .eq('id', matchedLog.id);
          }
        }

        // Create new trucking_calls record
        const { error: insertError } = await supabase
          .from('trucking_calls')
          .insert({
            call_provider: 'elevenlabs',
            call_external_id: conv.conversation_id,
            agent_name: 'Jess',
            caller_phone: callerPhone,
            call_duration_seconds: duration,
            transcript_text: transcriptText,
            audio_url: audioUrl,
            call_outcome: detail.status === 'done' ? 'completed' : 'incomplete',
            handoff_requested: false,
            lead_created: false,
            cei_score: 50, // Default score for backfilled calls
            cei_band: '50-74',
            owner_id: resolvedOwnerId,
            created_at: startTime || new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Insert error for ${conv.conversation_id}:`, insertError);
          results.errors++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'insert_error', error: insertError.message });
        } else {
          results.updated++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'created' });
        }

      } catch (err) {
        console.error(`Error processing ${conv.conversation_id}:`, err);
        results.errors++;
        results.details.push({ 
          conversation_id: conv.conversation_id, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    console.log('Backfill complete:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
