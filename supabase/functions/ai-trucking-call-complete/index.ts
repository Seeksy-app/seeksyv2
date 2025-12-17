import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CEI Scoring Rules
const CEI_BASE_SCORE = 100;
const CEI_PENALTIES: Record<string, number> = {
  dispatch_requested: -30,
  human_requested: -30,
  impatience_phrase_detected: -10,
  confusion_correction_detected: -10,
  hard_frustration_detected: -40,
  load_lookup_failed: -15,
};
const CEI_BONUSES: Record<string, number> = {
  caller_thanked: 5,
  booking_interest_confirmed: 10,
  call_resolved_without_handoff: 25,
  alternate_load_provided: 10,
};

// Phrase detection lists
const PHRASE_LISTS = {
  dispatch_or_human_request: [
    'talk to dispatch', 'dispatch', 'real person', 'human', 'transfer me',
    'operator', 'dispatcher', 'let me talk to someone', 'speak to someone',
    'talk to a person', 'real agent'
  ],
  impatience: [
    'just tell me', 'get to the point', 'quick question', 'skip the details',
    "don't have time", 'hurry up', 'make it quick', 'come on'
  ],
  confusion_correction: [
    "that's not right", 'wrong', 'no i said', 'i already told you', 'not that',
    "that's incorrect", 'no no no', 'listen to me'
  ],
  hard_frustration: [
    'this is annoying', 'this is frustrating', 'forget it', 'waste of time',
    'never mind', 'ridiculous', 'useless', 'terrible'
  ],
  thanks: [
    'thank you', 'thanks', 'appreciate it', 'great', 'perfect', 'awesome'
  ],
  booking_interest: [
    "i'll take it", 'book it', 'confirm', 'sounds good', 'let\'s do it',
    'i want it', 'i\'m interested', 'sign me up'
  ]
};

function getCEIBand(score: number): string {
  if (score >= 90) return '90-100';
  if (score >= 75) return '75-89';
  if (score >= 50) return '50-74';
  if (score >= 25) return '25-49';
  return '0-24';
}

function analyzeTranscript(transcript: string | null): {
  events: Array<{ event_type: string; severity: string; source: string; phrase?: string; cei_delta: number }>;
  handoff_requested: boolean;
  handoff_reason: string | null;
  cei_score: number;
  cei_reasons: string[];
} {
  const events: Array<{ event_type: string; severity: string; source: string; phrase?: string; cei_delta: number }> = [];
  const cei_reasons: string[] = [];
  let cei_score = CEI_BASE_SCORE;
  let handoff_requested = false;
  let handoff_reason: string | null = null;

  if (!transcript) {
    return { events, handoff_requested, handoff_reason, cei_score, cei_reasons };
  }

  const lowerTranscript = transcript.toLowerCase();

  // Check for dispatch/human requests
  for (const phrase of PHRASE_LISTS.dispatch_or_human_request) {
    if (lowerTranscript.includes(phrase)) {
      handoff_requested = true;
      handoff_reason = phrase;
      events.push({
        event_type: phrase.includes('dispatch') ? 'dispatch_requested' : 'human_requested',
        severity: 'error',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.dispatch_requested,
      });
      cei_score += CEI_PENALTIES.dispatch_requested;
      cei_reasons.push(phrase.includes('dispatch') ? 'dispatch_requested' : 'human_requested');
      break; // Only count once
    }
  }

  // Check for impatience
  for (const phrase of PHRASE_LISTS.impatience) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'impatience_phrase_detected',
        severity: 'warn',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.impatience_phrase_detected,
      });
      cei_score += CEI_PENALTIES.impatience_phrase_detected;
      cei_reasons.push('impatience_phrase_detected');
      break;
    }
  }

  // Check for confusion/correction
  for (const phrase of PHRASE_LISTS.confusion_correction) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'confusion_correction_detected',
        severity: 'warn',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.confusion_correction_detected,
      });
      cei_score += CEI_PENALTIES.confusion_correction_detected;
      cei_reasons.push('confusion_correction_detected');
      break;
    }
  }

  // Check for hard frustration
  for (const phrase of PHRASE_LISTS.hard_frustration) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'hard_frustration_detected',
        severity: 'error',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.hard_frustration_detected,
      });
      cei_score += CEI_PENALTIES.hard_frustration_detected;
      cei_reasons.push('hard_frustration_detected');
      break;
    }
  }

  // Check for thanks (positive)
  for (const phrase of PHRASE_LISTS.thanks) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'caller_thanked',
        severity: 'info',
        source: 'classifier',
        phrase,
        cei_delta: CEI_BONUSES.caller_thanked,
      });
      cei_score += CEI_BONUSES.caller_thanked;
      cei_reasons.push('caller_thanked');
      break;
    }
  }

  // Check for booking interest (positive)
  for (const phrase of PHRASE_LISTS.booking_interest) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'booking_interest_confirmed',
        severity: 'info',
        source: 'classifier',
        phrase,
        cei_delta: CEI_BONUSES.booking_interest_confirmed,
      });
      cei_score += CEI_BONUSES.booking_interest_confirmed;
      cei_reasons.push('booking_interest_confirmed');
      break;
    }
  }

  // Bonus for resolved without handoff
  if (!handoff_requested) {
    events.push({
      event_type: 'call_resolved_without_handoff',
      severity: 'info',
      source: 'system',
      cei_delta: CEI_BONUSES.call_resolved_without_handoff,
    });
    cei_score += CEI_BONUSES.call_resolved_without_handoff;
    cei_reasons.push('call_resolved_without_handoff');
  }

  // Clamp score to 0-100
  cei_score = Math.max(0, Math.min(100, cei_score));

  return { events, handoff_requested, handoff_reason, cei_score, cei_reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let callLogId: string | null = null;
  let ceiCallId: string | null = null;
  let logError: string | null = null;

  try {
    console.log('=== POST CALL WEBHOOK (CEI) ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Raw body:', JSON.stringify(body, null, 2));

    const params = body.parameters || body;
    const analysis = body.analysis || params.analysis || {};
    const callData = body.call || params.call || {};
    
    console.log('Analysis object:', JSON.stringify(analysis, null, 2));
    console.log('Call object:', JSON.stringify(callData, null, 2));
    
    const {
      owner_id: direct_owner_id, user_id, account_id,
      call_outcome, outcome, status,
      company_name, mc_number, callback_phone, contact_number, phone, load_id, notes,
      conversation_id, call_id, agent_id, caller_id, caller_number, phone_number, from_number,
      duration, duration_seconds, call_duration, transcript, summary, started_at, ended_at,
      lead_id, lead_status, lead_error, confirmed_load_number, final_rate
    } = params;
    
    // Extract duration
    const elevenLabsDuration = 
      callData.call_duration_secs || callData.call_duration || callData.duration ||
      analysis.call_duration || analysis.duration || 
      body.call_duration_secs || body.call_duration || body.duration;

    const callOutcome = call_outcome || outcome || status || 'completed';

    const callerPhone = callback_phone || contact_number || phone || 
                        caller_number || phone_number || from_number || caller_id ||
                        callData.from_number || callData.caller_id || callData.phone_number || null;
    
    let callDuration = elevenLabsDuration || duration_seconds || duration || call_duration;
    const callStarted = started_at || callData.started_at || callData.start_time;
    const callEnded = ended_at || callData.ended_at || callData.end_time;
    
    if (!callDuration && callStarted && callEnded) {
      const start = new Date(callStarted);
      const end = new Date(callEnded);
      callDuration = Math.round((end.getTime() - start.getTime()) / 1000);
    }
    if (callDuration && typeof callDuration === 'number') {
      callDuration = Math.round(callDuration);
    }
    console.log('Calculated call duration:', callDuration);

    // Get owner_id
    let owner_id = direct_owner_id || user_id || account_id || null;
    let actualLoadId = load_id || null;
    
    if (lead_id) {
      const { data: lead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (lead) {
        owner_id = owner_id || lead.owner_id;
        actualLoadId = actualLoadId || lead.load_id;
      }
    }
    
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
      }
    }

    if (!owner_id) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      
      if (anyOwner) {
        owner_id = anyOwner.owner_id;
      }
    }

    // Extract transcript
    let callTranscript = transcript || analysis.transcript || body.transcript || null;
    if (Array.isArray(callTranscript)) {
      callTranscript = callTranscript
        .map((msg: { role?: string; message?: string; text?: string; content?: string }) => {
          const role = msg.role || 'unknown';
          const text = msg.message || msg.text || msg.content || '';
          return `${role}: ${text}`;
        })
        .join('\n');
    }
    
    console.log('Transcript available:', !!callTranscript, callTranscript ? `(${String(callTranscript).length} chars)` : '');

    // Analyze transcript for CEI scoring
    const transcriptAnalysis = analyzeTranscript(callTranscript);
    console.log('CEI Analysis:', JSON.stringify({
      cei_score: transcriptAnalysis.cei_score,
      cei_band: getCEIBand(transcriptAnalysis.cei_score),
      handoff_requested: transcriptAnalysis.handoff_requested,
      events_count: transcriptAnalysis.events.length,
    }, null, 2));

    // Map call outcome to CEI outcome
    let ceiOutcome: string = 'incomplete';
    if (callOutcome === 'confirmed' || callOutcome === 'booked') {
      ceiOutcome = 'confirmed';
    } else if (callOutcome === 'declined' || callOutcome === 'rejected') {
      ceiOutcome = 'declined';
    } else if (callOutcome === 'callback' || callOutcome === 'callback_requested') {
      ceiOutcome = 'callback_requested';
    } else if (callOutcome === 'error' || callOutcome === 'failed') {
      ceiOutcome = 'error';
    } else if (callOutcome === 'completed' || callOutcome === 'success') {
      ceiOutcome = lead_id ? 'confirmed' : 'incomplete';
    }

    // Create CEI call record
    const ceiCallData = {
      call_provider: 'elevenlabs',
      call_external_id: conversation_id || call_id || null,
      agent_name: 'Jess',
      caller_phone: callerPhone,
      mc_number: mc_number || null,
      company_name: company_name || null,
      primary_load_id: actualLoadId,
      load_ids_discussed: actualLoadId ? [actualLoadId] : [],
      transcript_text: callTranscript,
      call_outcome: ceiOutcome,
      handoff_requested: transcriptAnalysis.handoff_requested,
      handoff_reason: transcriptAnalysis.handoff_reason,
      lead_created: !!lead_id,
      lead_create_error: lead_error || null,
      cei_score: transcriptAnalysis.cei_score,
      cei_band: getCEIBand(transcriptAnalysis.cei_score),
      cei_reasons: transcriptAnalysis.cei_reasons,
      owner_id,
    };

    console.log('Creating CEI call:', JSON.stringify(ceiCallData, null, 2));

    const { data: ceiCall, error: ceiError } = await supabase
      .from('trucking_calls')
      .insert(ceiCallData)
      .select()
      .maybeSingle();

    if (ceiError) {
      console.error('Error creating CEI call:', ceiError);
    } else if (ceiCall) {
      ceiCallId = ceiCall.id;
      console.log('CEI call created:', ceiCall.id);

      // Insert CEI events
      if (transcriptAnalysis.events.length > 0) {
        const eventRecords = transcriptAnalysis.events.map(event => ({
          call_id: ceiCall.id,
          event_type: event.event_type,
          severity: event.severity,
          source: event.source,
          phrase: event.phrase || null,
          cei_delta: event.cei_delta,
        }));

        const { error: eventsError } = await supabase
          .from('trucking_call_events')
          .insert(eventRecords);

        if (eventsError) {
          console.error('Error inserting CEI events:', eventsError);
        } else {
          console.log(`Inserted ${eventRecords.length} CEI events`);
        }
      }
    }

    // Also create legacy call log for backward compatibility
    let callNotes = notes || '';
    if (lead_status === 'failed' || lead_error) {
      callNotes += `\n[Lead creation failed: ${lead_error || 'unknown error'}]`;
      if (company_name) callNotes += `\nCompany: ${company_name}`;
      if (mc_number) callNotes += `\nMC: ${mc_number}`;
      if (callerPhone) callNotes += `\nCallback: ${callerPhone}`;
    }

    const callLogData: Record<string, unknown> = {
      owner_id,
      load_id: actualLoadId,
      carrier_phone: callerPhone,
      call_started_at: callStarted || new Date().toISOString(),
      call_ended_at: callEnded || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: callOutcome,
      call_outcome: callOutcome,
      summary: summary || callNotes || null,
      transcript: callTranscript,
      is_demo: false,
      total_characters: callTranscript ? callTranscript.length : null,
      call_direction: 'inbound'
    };

    if (lead_id) {
      callLogData.lead_id = lead_id;
    }

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

      if (lead_id) {
        await supabase
          .from('trucking_carrier_leads')
          .update({ call_log_id: callLog.id })
          .eq('id', lead_id);
      }

      // Send SMS notification
      try {
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
        const adminPhone = '+12026695354';

        if (accountSid && authToken && fromNumber) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const credentials = btoa(`${accountSid}:${authToken}`);

          let smsMessage = `🚚 AI Call | CEI: ${transcriptAnalysis.cei_score}\n`;
          smsMessage += `Outcome: ${ceiOutcome}\n`;
          if (callerPhone) smsMessage += `From: ${callerPhone}\n`;
          if (callDuration) smsMessage += `Duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s\n`;
          if (transcriptAnalysis.handoff_requested) smsMessage += `⚠️ Handoff requested`;
          if (lead_id) smsMessage += `\n✓ Lead created`;

          await fetch(twilioUrl, {
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
          console.log('SMS notification sent');
        }
      } catch (smsError) {
        console.log('SMS notification error (non-blocking):', smsError);
      }
    }

  } catch (error: unknown) {
    console.error('Error in ai-trucking-call-complete:', error);
    logError = error instanceof Error ? error.message : 'Unknown error';
  }

  return new Response(JSON.stringify({
    ok: !logError,
    success: !logError,
    message: logError ? `Call logged with error: ${logError}` : "Call logged successfully with CEI scoring",
    call_log_id: callLogId,
    cei_call_id: ceiCallId,
    error: logError
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
