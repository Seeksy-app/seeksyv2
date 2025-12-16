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

  // This endpoint ALWAYS returns 200 and ALWAYS logs the call
  // It must accept partial data - all fields optional
  let callLogId: string | null = null;
  let logError: string | null = null;

  try {
    console.log('=== POST CALL WEBHOOK ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Raw body:', JSON.stringify(body, null, 2));

    // Extract ALL possible fields - everything is OPTIONAL except we try to get call_outcome
    const params = body.parameters || body;
    const {
      // Call outcome fields
      call_outcome,
      outcome,
      status,
      // Partial lead data (if lead creation failed, still capture this)
      company_name,
      mc_number,
      callback_phone,
      contact_number,
      phone,
      load_id,
      notes,
      // ElevenLabs call metadata
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
      transcript,
      summary,
      metadata,
      started_at,
      ended_at,
      // Lead tracking
      lead_id,
      lead_status, // "created", "failed", etc.
      lead_error,  // Error message if lead creation failed
      // Confirmation tracking
      confirmed_load_number,
      final_rate
    } = params;

    // Normalize call outcome - use call_outcome first, then outcome, then status
    const callOutcome = call_outcome || outcome || status || 'completed';

    // Extract phone from various possible fields
    const callerPhone = callback_phone || contact_number || phone || 
                        caller_number || phone_number || from_number || caller_id || null;
    
    // Calculate duration from various possible sources
    let callDuration = duration_seconds || duration || call_duration;
    if (!callDuration && started_at && ended_at) {
      const start = new Date(started_at);
      const end = new Date(ended_at);
      callDuration = Math.round((end.getTime() - start.getTime()) / 1000);
    }

    // Try to get owner_id and load_id
    let owner_id = null;
    let actualLoadId = load_id || null;
    
    // 1. Check if lead was created in this call
    if (lead_id) {
      const { data: lead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (lead) {
        owner_id = lead.owner_id;
        actualLoadId = actualLoadId || lead.load_id;
        console.log('Found lead:', lead_id);
      }
    }
    
    // 2. Look for recently created lead from this caller
    if (!owner_id && callerPhone) {
      const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
      const { data: recentLead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id, id')
        .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (recentLead) {
        owner_id = recentLead.owner_id;
        actualLoadId = actualLoadId || recentLead.load_id;
        console.log('Found recent lead for caller:', recentLead.id);
      }
    }

    // 3. If still no owner, get default
    if (!owner_id) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      
      if (anyOwner) {
        owner_id = anyOwner.owner_id;
        console.log('Using default owner_id:', owner_id);
      }
    }

    // Build notes with partial lead data if lead creation failed
    let callNotes = notes || '';
    if (lead_status === 'failed' || lead_error) {
      callNotes += `\n[Lead creation failed: ${lead_error || 'unknown error'}]`;
      if (company_name) callNotes += `\nCompany: ${company_name}`;
      if (mc_number) callNotes += `\nMC: ${mc_number}`;
      if (callerPhone) callNotes += `\nCallback: ${callerPhone}`;
    }

    // Build call log entry - THIS ALWAYS GETS CREATED
    const callLogData = {
      owner_id,
      load_id: actualLoadId,
      caller_number: callerPhone,
      call_started_at: started_at || new Date().toISOString(),
      call_ended_at: ended_at || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: callOutcome,
      transcript: transcript || null,
      ai_summary: summary || callNotes || null,
      elevenlabs_conversation_id: conversation_id || call_id || null,
      is_demo: false,
      total_characters: transcript ? transcript.length : null,
      estimated_cost_usd: null,
      confirmed_load_number: confirmed_load_number || null,
      final_rate: final_rate ? parseFloat(String(final_rate).replace(/[^0-9.]/g, '')) : null,
      phone_captured: !!callerPhone,
      lead_created: lead_status === 'created' || !!lead_id
    };

    console.log('Creating call log:', JSON.stringify(callLogData, null, 2));

    const { data: callLog, error } = await supabase
      .from('trucking_call_logs')
      .insert(callLogData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Database error creating call log:', error);
      logError = error.message;
    } else if (callLog) {
      callLogId = callLog.id;
      console.log('Call logged successfully:', callLog.id);

      // Update the lead with the call_log_id if we found one
      if (actualLoadId && callerPhone) {
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

  // ALWAYS return 200 with ok: true/false
  return new Response(JSON.stringify({
    ok: !logError,
    success: !logError,
    message: logError ? `Call logged with error: ${logError}` : "Call logged successfully",
    call_log_id: callLogId,
    error: logError
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
