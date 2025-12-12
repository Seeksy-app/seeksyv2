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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('=== CALL COMPLETE WEBHOOK ===');
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
      // Tool call results that may have been collected
      collected_data,
      tool_results
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

    // Try to get owner_id from the most recent lead created in this call
    let owner_id = null;
    let load_id = null;
    
    // Look for recently created lead from this caller (within last 5 minutes)
    if (callerPhone) {
      const { data: recentLead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('phone', callerPhone.replace(/[^0-9]/g, ''))
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (recentLead) {
        owner_id = recentLead.owner_id;
        load_id = recentLead.load_id;
        console.log('Found recent lead for caller:', recentLead);
      }
    }

    // If no owner_id from lead, try to get from a recent load lookup
    if (!owner_id) {
      // Get any owner from the system (fallback for now)
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .single();
      
      if (anyOwner) {
        owner_id = anyOwner.owner_id;
      }
    }

    // Create call log entry
    const callLogData = {
      owner_id,
      load_id,
      caller_number: callerPhone,
      call_started_at: started_at || new Date().toISOString(),
      call_ended_at: ended_at || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: outcome || status || 'completed',
      transcript: transcript || null,
      ai_summary: summary || null,
      elevenlabs_conversation_id: conversation_id || call_id || null,
      is_demo: false,
      total_characters: null,
      estimated_cost_usd: null
    };

    console.log('Creating call log:', JSON.stringify(callLogData, null, 2));

    const { data: callLog, error } = await supabase
      .from('trucking_call_logs')
      .insert(callLogData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: "Error logging call",
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Call logged successfully:', callLog.id);

    // Update the lead with the call_log_id if we found one
    if (load_id && callerPhone) {
      await supabase
        .from('trucking_carrier_leads')
        .update({ call_log_id: callLog.id })
        .eq('phone', callerPhone.replace(/[^0-9]/g, ''))
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Call logged successfully",
      call_log_id: callLog.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-call-complete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred while logging the call",
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
