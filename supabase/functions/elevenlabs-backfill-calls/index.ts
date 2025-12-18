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
    call_cost_credits?: number;
    ended_reason?: string;
  };
}

// Cost per minute for ElevenLabs conversational AI
const COST_PER_MINUTE = 0.07;
const COST_PER_CREDIT = 0.00003; // Approximate credit to USD conversion

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ELEVENLABS BACKFILL CALLS ===');
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const JESS_AGENT_ID = Deno.env.get('ELEVENLABS_JESS_AGENT_ID');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
    
    // CRITICAL: Must have agent ID to prevent cross-agent contamination
    if (!JESS_AGENT_ID) {
      throw new Error('ELEVENLABS_JESS_AGENT_ID not configured - cannot backfill without agent filter');
    }

    console.log(`Using Jess Agent ID: ${JESS_AGENT_ID}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { owner_id, max_pages = 50 } = body; // Pagination limit to prevent infinite loops

    // Get owner_id if not provided
    let resolvedOwnerId = owner_id;
    if (!resolvedOwnerId) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      resolvedOwnerId = anyOwner?.owner_id;
      console.log(`Resolved owner_id: ${resolvedOwnerId}`);
    }

    if (!resolvedOwnerId) {
      throw new Error('No owner_id found - cannot create call logs without owner');
    }

    const results = {
      fetched_total: 0,
      upserted_total: 0,
      skipped_total: 0,
      skipped_wrong_agent: 0,
      errors_total: 0,
      pages_fetched: 0,
      details: [] as Array<{ conversation_id: string; status: string; duration?: number; error?: string }>,
    };

    // Fetch ALL conversations from ElevenLabs with AGENT FILTER and FULL PAGINATION
    let cursor: string | null = null;
    let hasMore = true;
    const allConversations: ElevenLabsConversation[] = [];

    console.log('Fetching all conversations from ElevenLabs with agent filter...');

    while (hasMore && results.pages_fetched < max_pages) {
      let url = `https://api.elevenlabs.io/v1/convai/conversations?page_size=100&agent_id=${JESS_AGENT_ID}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      console.log(`Fetching page ${results.pages_fetched + 1}...`);

      const listResponse = await fetch(url, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('Failed to fetch conversations:', errorText);
        throw new Error(`ElevenLabs API error: ${listResponse.status} - ${errorText}`);
      }

      const listData = await listResponse.json();
      const pageConversations: ElevenLabsConversation[] = listData.conversations || [];
      
      console.log(`Page ${results.pages_fetched + 1}: Found ${pageConversations.length} conversations`);
      
      // Double-check agent_id filter (defensive programming)
      for (const conv of pageConversations) {
        if (conv.agent_id !== JESS_AGENT_ID) {
          console.warn(`Skipping conversation ${conv.conversation_id} - wrong agent: ${conv.agent_id}`);
          results.skipped_wrong_agent++;
          continue;
        }
        allConversations.push(conv);
      }

      results.pages_fetched++;
      results.fetched_total = allConversations.length;

      // Check for next page
      cursor = listData.next_cursor || null;
      hasMore = !!cursor && pageConversations.length > 0;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Total conversations fetched: ${allConversations.length} (pages: ${results.pages_fetched})`);

    // Process each conversation
    for (const conv of allConversations) {
      try {
        // Skip if wrong agent (should not happen with filter, but defensive)
        if (conv.agent_id !== JESS_AGENT_ID) {
          results.skipped_wrong_agent++;
          continue;
        }

        // Fetch detailed conversation data
        const detailUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        });

        if (!detailResponse.ok) {
          console.warn(`Failed to fetch details for ${conv.conversation_id}`);
          results.errors_total++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'fetch_error' });
          continue;
        }

        const detail: ElevenLabsConversationDetail = await detailResponse.json();
        
        // Validate agent again from detail
        if (detail.agent_id !== JESS_AGENT_ID) {
          console.warn(`Detail mismatch: ${conv.conversation_id} has agent ${detail.agent_id}, expected ${JESS_AGENT_ID}`);
          results.skipped_wrong_agent++;
          continue;
        }

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
        const callCostCredits = detail.call?.call_cost_credits || null;
        const endedReason = detail.call?.ended_reason || null;
        
        const startTime = detail.start_time_unix_secs 
          ? new Date(detail.start_time_unix_secs * 1000).toISOString()
          : new Date().toISOString();
        const endTime = detail.end_time_unix_secs
          ? new Date(detail.end_time_unix_secs * 1000).toISOString()
          : null;

        // Calculate estimated costs
        const estimatedCostUsd = (duration / 60) * COST_PER_MINUTE;
        const callCostUsd = callCostCredits ? callCostCredits * COST_PER_CREDIT : estimatedCostUsd;
        const llmCostUsdTotal = estimatedCostUsd * 0.3; // Approximate LLM portion
        const llmCostUsdPerMin = duration > 0 ? (llmCostUsdTotal / (duration / 60)) : 0;

        // Determine outcome
        let outcome = 'completed';
        if (detail.analysis?.data_collection_results) {
          const dataResults = detail.analysis.data_collection_results as Record<string, unknown>;
          if (dataResults.callback_requested) outcome = 'callback_requested';
          else if (dataResults.declined) outcome = 'declined';
          else if (dataResults.confirmed) outcome = 'confirmed';
        }

        // Summary from analysis
        const summary = detail.analysis?.summary || null;

        // UPSERT by elevenlabs_conversation_id - the ONLY reliable key
        const { data: existingLog } = await supabase
          .from('trucking_call_logs')
          .select('id')
          .eq('elevenlabs_conversation_id', conv.conversation_id)
          .maybeSingle();

        const callLogData = {
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
          estimated_cost_usd: callCostUsd,
          is_demo: false,
          // New ElevenLabs tracking fields
          elevenlabs_conversation_id: conv.conversation_id,
          elevenlabs_agent_id: conv.agent_id,
          call_cost_credits: callCostCredits,
          call_cost_usd: callCostUsd,
          llm_cost_usd_total: llmCostUsdTotal,
          llm_cost_usd_per_min: llmCostUsdPerMin,
          ended_reason: endedReason,
          call_status: detail.status,
        };

        if (existingLog) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('trucking_call_logs')
            .update(callLogData)
            .eq('id', existingLog.id);

          if (updateError) {
            console.error(`Update error for ${conv.conversation_id}:`, updateError);
            results.errors_total++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'update_error', error: updateError.message });
          } else {
            results.upserted_total++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'updated', duration });
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('trucking_call_logs')
            .insert(callLogData);

          if (insertError) {
            console.error(`Insert error for ${conv.conversation_id}:`, insertError);
            results.errors_total++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'insert_error', error: insertError.message });
          } else {
            results.upserted_total++;
            results.details.push({ conversation_id: conv.conversation_id, status: 'created', duration });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Error processing ${conv.conversation_id}:`, err);
        results.errors_total++;
        results.details.push({ 
          conversation_id: conv.conversation_id, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    console.log('=== BACKFILL COMPLETE ===');
    console.log({
      fetched_total: results.fetched_total,
      upserted_total: results.upserted_total,
      skipped_wrong_agent: results.skipped_wrong_agent,
      errors_total: results.errors_total,
      pages_fetched: results.pages_fetched,
    });

    return new Response(JSON.stringify({
      success: true,
      agent_id: JESS_AGENT_ID,
      results: {
        fetched_total: results.fetched_total,
        upserted_total: results.upserted_total,
        skipped_wrong_agent: results.skipped_wrong_agent,
        errors_total: results.errors_total,
        pages_fetched: results.pages_fetched,
      },
      details: results.details,
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
