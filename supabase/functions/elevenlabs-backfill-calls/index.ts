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

// Cost per minute for ElevenLabs conversational AI
const COST_PER_MINUTE = 0.07;

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

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ conversation_id: string; status: string; duration?: number; error?: string }>,
    };

    // Step 2: Process each conversation
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
            : 0);

        const audioUrl = detail.call?.recording_url || null;
        const callerPhone = detail.call?.from_number || null;
        const startTime = detail.start_time_unix_secs 
          ? new Date(detail.start_time_unix_secs * 1000).toISOString()
          : new Date().toISOString();
        const endTime = detail.end_time_unix_secs
          ? new Date(detail.end_time_unix_secs * 1000).toISOString()
          : null;

        // Calculate estimated cost
        const estimatedCost = (duration / 60) * COST_PER_MINUTE;

        // Determine outcome
        let outcome = 'completed';
        if (detail.analysis?.data_collection_results) {
          const results = detail.analysis.data_collection_results as Record<string, unknown>;
          if (results.callback_requested) outcome = 'callback_requested';
          else if (results.declined) outcome = 'declined';
          else if (results.confirmed) outcome = 'confirmed';
        }

        // Summary from analysis
        const summary = detail.analysis?.summary || null;

        // Check if record exists with this conversation_id in trucking_call_logs
        // We'll use the id as a unique key - try to match by time window
        const searchStart = new Date(new Date(startTime).getTime() - 60 * 1000).toISOString();
        const searchEnd = new Date(new Date(startTime).getTime() + 60 * 1000).toISOString();

        const { data: existingLog } = await supabase
          .from('trucking_call_logs')
          .select('id, transcript, recording_url, duration_seconds')
          .gte('call_started_at', searchStart)
          .lte('call_started_at', searchEnd)
          .limit(1)
          .maybeSingle();

        if (existingLog) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('trucking_call_logs')
            .update({
              duration_seconds: duration || existingLog.duration_seconds,
              transcript: transcriptText || existingLog.transcript,
              recording_url: audioUrl || existingLog.recording_url,
              summary: summary,
              estimated_cost_usd: estimatedCost,
              call_ended_at: endTime,
            })
            .eq('id', existingLog.id);

          if (updateError) {
            console.error(`Update error for ${conv.conversation_id}:`, updateError);
            results.errors++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'update_error', error: updateError.message });
          } else {
            results.updated++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'updated', duration });
          }
        } else {
          // Create new record in trucking_call_logs
          const { error: insertError } = await supabase
            .from('trucking_call_logs')
            .insert({
              owner_id: resolvedOwnerId,
              carrier_phone: callerPhone,
              call_direction: 'inbound',
              summary: summary,
              transcript: transcriptText,
              recording_url: audioUrl,
              call_started_at: startTime,
              call_ended_at: endTime,
              duration_seconds: duration,
              outcome: outcome,
              estimated_cost_usd: estimatedCost,
              is_demo: false,
            });

          if (insertError) {
            console.error(`Insert error for ${conv.conversation_id}:`, insertError);
            results.errors++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'insert_error', error: insertError.message });
          } else {
            results.created++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'created', duration });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

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

    console.log('Backfill complete:', {
      processed: results.processed,
      created: results.created,
      updated: results.updated,
      errors: results.errors,
    });

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
