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
    
    // ElevenLabs sends analysis data nested - extract it
    const analysis = body.analysis || params.analysis || {};
    console.log('Analysis object:', JSON.stringify(analysis, null, 2));
    
    const {
      // OWNER ID - can be passed directly from ElevenLabs agent config
      owner_id: direct_owner_id,
      user_id,
      account_id,
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
    
    // Extract duration from ElevenLabs analysis object (where they actually send it)
    const elevenLabsDuration = analysis.call_duration || analysis.duration || 
                               body.call_duration || body.duration;

    // Normalize call outcome - use call_outcome first, then outcome, then status
    const callOutcome = call_outcome || outcome || status || 'completed';

    // Extract phone from various possible fields
    const callerPhone = callback_phone || contact_number || phone || 
                        caller_number || phone_number || from_number || caller_id || null;
    
    // Calculate duration from various possible sources (including ElevenLabs analysis)
    let callDuration = elevenLabsDuration || duration_seconds || duration || call_duration;
    if (!callDuration && started_at && ended_at) {
      const start = new Date(started_at);
      const end = new Date(ended_at);
      callDuration = Math.round((end.getTime() - start.getTime()) / 1000);
    }
    // ElevenLabs may send duration in seconds as a float, round it
    if (callDuration && typeof callDuration === 'number') {
      callDuration = Math.round(callDuration);
    }
    console.log('Calculated call duration:', callDuration);

    // Try to get owner_id and load_id
    // Priority: 1) Direct param, 2) From lead, 3) From recent lead by phone, 4) Fallback from loads
    let owner_id = direct_owner_id || user_id || account_id || null;
    let actualLoadId = load_id || null;
    
    console.log('Direct owner_id from params:', owner_id);
    
    // 1. Check if lead was created in this call (also use to get owner if not passed)
    if (lead_id) {
      const { data: lead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (lead) {
        owner_id = owner_id || lead.owner_id;
        actualLoadId = actualLoadId || lead.load_id;
        console.log('Found lead:', lead_id, 'owner:', lead.owner_id);
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
    // Using actual schema columns: id, owner_id, carrier_phone, load_id, call_direction, 
    // summary, transcript_url, recording_url, call_started_at, call_ended_at, created_at,
    // language, outcome, lead_id, duration_seconds, failure_reason, total_characters,
    // estimated_cost_usd, is_demo, call_outcome, routed_to_voicemail, voicemail_transcript
    const callLogData: Record<string, unknown> = {
      owner_id,
      load_id: actualLoadId,
      carrier_phone: callerPhone,
      call_started_at: started_at || new Date().toISOString(),
      call_ended_at: ended_at || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: callOutcome,
      call_outcome: callOutcome,
      summary: summary || callNotes || null,
      is_demo: false,
      total_characters: transcript ? transcript.length : null,
      call_direction: 'inbound'
    };

    // Only add lead_id if we have one
    if (lead_id) {
      callLogData.lead_id = lead_id;
    }

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

      // Update the lead with the call_log_id if we have a lead_id
      if (lead_id) {
        await supabase
          .from('trucking_carrier_leads')
          .update({ call_log_id: callLog.id })
          .eq('id', lead_id);
      }

      // Send SMS notification to admin
      try {
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
        const adminPhone = '+12026695354'; // Admin phone number

        if (accountSid && authToken && fromNumber) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const credentials = btoa(`${accountSid}:${authToken}`);

          // Build SMS message with call details
          let smsMessage = `🚚 Trucking AI Call\n`;
          smsMessage += `Outcome: ${callOutcome}\n`;
          if (callerPhone) smsMessage += `From: ${callerPhone}\n`;
          if (callDuration) smsMessage += `Duration: ${Math.round(callDuration / 60)}m ${callDuration % 60}s\n`;
          if (company_name) smsMessage += `Company: ${company_name}\n`;
          if (lead_id) smsMessage += `Lead created ✓`;

          const smsResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: adminPhone,
              From: fromNumber,
              Body: smsMessage,
            }),
          });

          if (smsResponse.ok) {
            console.log('SMS notification sent to admin');
          } else {
            console.log('SMS send failed:', await smsResponse.text());
          }
        } else {
          console.log('Twilio credentials not configured, skipping SMS');
        }
      } catch (smsError) {
        console.log('SMS notification error (non-blocking):', smsError);
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
