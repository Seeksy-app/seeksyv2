import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // This endpoint ALWAYS logs the call - never fail silently
  let callLogId: string | null = null;
  let logError: string | null = null;

  try {
    // Log all headers for debugging
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = key.toLowerCase().includes('auth') || key.toLowerCase().includes('secret') 
        ? '[REDACTED]' 
        : value;
    });
    console.log('=== CALL COMPLETE WEBHOOK ===');
    console.log('Incoming headers:', JSON.stringify(headers, null, 2));
    
    // Validate webhook secret if configured (optional - log warning but don't block)
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-elevenlabs-signature') || 
                        req.headers.get('x-webhook-secret') ||
                        req.headers.get('authorization');
      
      const isValid = signature === webhookSecret || 
                      signature === `Bearer ${webhookSecret}` ||
                      signature?.includes(webhookSecret);
      
      if (!isValid) {
        console.warn('Webhook signature mismatch - proceeding anyway. Signature:', 
          signature ? 'present' : 'missing');
      } else {
        console.log('Webhook signature validated');
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Raw body:', JSON.stringify(body, null, 2));

    // ElevenLabs sends call data in various formats
    const {
      conversation_id,
      call_id,
      agent_id,
      caller_id,
      caller_number,
      phone_number,
      from_number,
      duration,
      duration_seconds,
      call_duration,
      status,
      outcome,
      transcript,
      summary,
      metadata,
      started_at,
      ended_at,
      // Tool call results
      collected_data,
      tool_results,
      // Lead info if available
      lead_id,
      load_id: provided_load_id,
      // Confirmation tracking
      confirmed_load_number,
      final_rate
    } = body;

    // Extract phone number from various possible fields
    const callerPhone = caller_number || phone_number || from_number || caller_id || null;
    
    // Calculate duration from various possible sources
    let callDuration = duration_seconds || duration || call_duration;
    if (!callDuration && started_at && ended_at) {
      const start = new Date(started_at);
      const end = new Date(ended_at);
      callDuration = Math.round((end.getTime() - start.getTime()) / 1000);
    }

    // Determine call outcome
    let callOutcome = outcome || status || 'completed';
    
    // Mark as incomplete if phone wasn't captured and no lead was created
    if (!callerPhone && !lead_id) {
      callOutcome = 'incomplete_no_phone';
    }

    // Try to get owner_id and load_id from various sources
    let owner_id = null;
    let load_id = provided_load_id || null;
    
    // 1. Check if lead was created in this call (most reliable)
    if (lead_id) {
      const { data: lead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('id', lead_id)
        .single();
      
      if (lead) {
        owner_id = lead.owner_id;
        load_id = load_id || lead.load_id;
        console.log('Found lead:', lead_id);
      }
    }
    
    // 2. Look for recently created lead from this caller (within last 10 minutes)
    if (!owner_id && callerPhone) {
      const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
      const { data: recentLead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id, id')
        .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (recentLead) {
        owner_id = recentLead.owner_id;
        load_id = load_id || recentLead.load_id;
        console.log('Found recent lead for caller:', recentLead.id);
      }
    }

    // 3. If still no owner, get default from any load
    if (!owner_id) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .single();
      
      if (anyOwner) {
        owner_id = anyOwner.owner_id;
        console.log('Using default owner_id:', owner_id);
      }
    }

    // Build call log entry - THIS ALWAYS GETS CREATED
    const callLogData = {
      owner_id,
      load_id,
      caller_number: callerPhone,
      call_started_at: started_at || new Date().toISOString(),
      call_ended_at: ended_at || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: callOutcome,
      transcript: transcript || null,
      ai_summary: summary || null,
      elevenlabs_conversation_id: conversation_id || call_id || null,
      is_demo: false,
      total_characters: transcript ? transcript.length : null,
      estimated_cost_usd: null,
      // Additional tracking fields
      confirmed_load_number: confirmed_load_number || null,
      final_rate: final_rate || null,
      phone_captured: !!callerPhone,
      lead_created: !!lead_id
    };

    console.log('Creating call log:', JSON.stringify(callLogData, null, 2));

    const { data: callLog, error } = await supabase
      .from('trucking_call_logs')
      .insert(callLogData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating call log:', error);
      logError = error.message;
    } else {
      callLogId = callLog.id;
      console.log('Call logged successfully:', callLog.id);

      // Update the lead with the call_log_id if we found one
      if (load_id && callerPhone) {
        const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
        await supabase
          .from('trucking_carrier_leads')
          .update({ call_log_id: callLog.id })
          .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
          .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
      }
    }

  } catch (error: unknown) {
    console.error('Error in ai-trucking-call-complete:', error);
    logError = error instanceof Error ? error.message : 'Unknown error';
  }

  // ALWAYS return success to ElevenLabs - we don't want to retry webhooks
  // but include the actual status in the response
  return new Response(JSON.stringify({
    success: !logError,
    message: logError ? `Call logged with error: ${logError}` : "Call logged successfully",
    call_log_id: callLogId,
    error: logError
  }), {
    status: 200, // Always 200 to prevent webhook retries
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
