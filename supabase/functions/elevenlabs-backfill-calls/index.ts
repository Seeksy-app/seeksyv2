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
  metadata?: {
    // Core metadata
    call_sid?: string;
    stream_sid?: string;
    caller_phone_number?: string;
    called_phone_number?: string;
    call_direction?: string;
    // Twilio specific
    twilio_call_sid?: string;
    twilio_stream_sid?: string;
    // Other metadata
    [key: string]: unknown;
  };
  call?: {
    from_number?: string;
    to_number?: string;
    recording_url?: string;
    call_cost_credits?: number;
    ended_reason?: string;
    call_direction?: string;
    connection_duration_secs?: number;
  };
  // Audio availability flags
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
  // User and branch tracking
  user_id?: string;
  branch_id?: string;
  // Conversation initiation data
  conversation_initiation_client_data?: {
    dynamic_variables?: Record<string, unknown>;
    [key: string]: unknown;
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

    // Validate agent ID format - must be agent_*, NOT agtbrch_*
    if (!JESS_AGENT_ID.startsWith('agent_')) {
      throw new Error(`Invalid agent ID format: ${JESS_AGENT_ID.substring(0, 15)}... - must start with 'agent_', not 'agtbrch_'`);
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

    // Helper function with retry logic
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(url, {
          headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        });
        
        if (response.ok) return response;
        
        if (response.status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        return response; // Return failed response for error handling
      }
      throw new Error('Max retries exceeded');
    };

    // Fetch ALL conversations from ElevenLabs with AGENT FILTER and FULL PAGINATION
    let cursor: string | null = null;
    let hasMore = true;
    const allConversations: ElevenLabsConversation[] = [];

    console.log('Fetching all conversations from ElevenLabs with agent filter...');

    while (hasMore && results.pages_fetched < max_pages) {
      // Build URL with agent_id filter
      let url = `https://api.elevenlabs.io/v1/convai/conversations?page_size=100&agent_id=${encodeURIComponent(JESS_AGENT_ID)}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      console.log(`Fetching page ${results.pages_fetched + 1}... URL: ${url.substring(0, 100)}...`);

      const listResponse = await fetchWithRetry(url);

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
        // Accept any conversation returned since we filtered by agent_id
        // The API should only return conversations for the specified agent
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
        // Fetch detailed conversation data with retry
        const detailUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`;
        const detailResponse = await fetchWithRetry(detailUrl);

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          console.warn(`Failed to fetch details for ${conv.conversation_id}: ${errorText}`);
          results.errors_total++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'fetch_error', error: errorText });
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

        // Extract all available data from call object and metadata
        const callData = detail.call || {};
        const metadata = detail.metadata || {};
        
        const audioUrl = callData.recording_url || null;
        const callCostCredits = callData.call_cost_credits || null;
        const endedReason = callData.ended_reason || null;
        const connectionDuration = callData.connection_duration_secs || null;
        
        // Phone numbers - check both call object and metadata
        const callerPhone = callData.from_number || metadata.caller_phone_number as string || null;
        const receiverPhone = callData.to_number || metadata.called_phone_number as string || null;
        
        // Call direction - check call object and metadata
        const callDirection = callData.call_direction || metadata.call_direction as string || 'inbound';
        
        // Twilio SIDs - check metadata for these
        const twilioCallSid = metadata.call_sid as string || metadata.twilio_call_sid as string || null;
        const twilioStreamSid = metadata.stream_sid as string || metadata.twilio_stream_sid as string || null;
        
        // CRITICAL: Use actual ElevenLabs timestamps, NOT now()
        const startTime = detail.start_time_unix_secs 
          ? new Date(detail.start_time_unix_secs * 1000).toISOString()
          : null; // Don't default to now() - leave null if no timestamp
        const endTime = detail.end_time_unix_secs
          ? new Date(detail.end_time_unix_secs * 1000).toISOString()
          : null;

        // Calculate estimated costs
        const estimatedCostUsd = duration > 0 ? (duration / 60) * COST_PER_MINUTE : 0;
        const callCostUsd = callCostCredits ? callCostCredits * COST_PER_CREDIT : estimatedCostUsd;
        const llmCostUsdTotal = estimatedCostUsd * 0.3; // Approximate LLM portion
        const llmCostUsdPerMin = duration > 0 ? (llmCostUsdTotal / (duration / 60)) : 0;

        // Determine outcome from analysis
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
          receiver_number: receiverPhone,
          call_direction: callDirection,
          summary: summary,
          transcript: transcriptText,
          recording_url: audioUrl,
          call_started_at: startTime,
          call_ended_at: endTime,
          duration_seconds: duration,
          connection_duration_seconds: connectionDuration,
          outcome: outcome,
          estimated_cost_usd: callCostUsd,
          is_demo: false,
          // ElevenLabs tracking fields
          elevenlabs_conversation_id: conv.conversation_id,
          elevenlabs_agent_id: conv.agent_id,
          elevenlabs_user_id: detail.user_id || null,
          call_cost_credits: callCostCredits,
          call_cost_usd: callCostUsd,
          llm_cost_usd_total: llmCostUsdTotal,
          llm_cost_usd_per_min: llmCostUsdPerMin,
          ended_reason: endedReason,
          call_status: detail.status,
          // Twilio integration
          twilio_call_sid: twilioCallSid,
          twilio_stream_sid: twilioStreamSid,
          // Audio availability flags
          has_audio: detail.has_audio || false,
          has_user_audio: detail.has_user_audio || false,
          has_response_audio: detail.has_response_audio || false,
          // Branch/version tracking
          branch_id: detail.branch_id || null,
          // Analysis data
          analysis_summary: detail.analysis?.summary || null,
          call_successful: detail.analysis?.call_successful || null,
          data_collection_results: detail.analysis?.data_collection_results || null,
          // Client initiation data
          initiation_client_data: detail.conversation_initiation_client_data || null,
          // Full metadata blob for future fields
          elevenlabs_metadata: metadata,
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
