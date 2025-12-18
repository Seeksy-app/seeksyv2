import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, elevenlabs-signature, x-elevenlabs-signature',
};

/**
 * RELIABLE WEBHOOK INGESTION
 * 
 * This function:
 * 1. Stores raw payload IMMEDIATELY
 * 2. Returns HTTP 200 fast
 * 3. Processes asynchronously (waitUntil)
 * 4. Uses upsert with conversation_id as unique key
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let rawPayload: string = '';
  let conversationId: string | null = null;

  try {
    // Get raw body
    rawPayload = await req.text();
    const body = JSON.parse(rawPayload);
    
    console.log('=== WEBHOOK INGEST RECEIVED ===');
    
    // Extract conversation_id from multiple possible locations
    const params = body.parameters || body;
    const callData = body.call || params.call || {};
    
    conversationId = body.conversation_id || 
                     params.conversation_id || 
                     callData.conversation_id ||
                     body.call_id || 
                     params.call_id ||
                     callData.call_id ||
                     null;
    
    // Extract caller phone - CRITICAL: always persist this
    const callerPhone = body.caller_number || params.caller_number || params.callback_phone || 
                        params.contact_number || params.phone || callData.from_number || 
                        callData.caller_id || callData.phone_number || null;
    
    console.log('Conversation ID:', conversationId);
    console.log('Caller Phone:', callerPhone);
    
    if (!conversationId) {
      // Generate a fallback ID to avoid losing data
      conversationId = `unknown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated fallback conversation ID:', conversationId);
    }

    // STEP 1: Store raw payload IMMEDIATELY using upsert
    const { data: webhookEvent, error: insertError } = await supabase
      .from('trucking_webhook_events')
      .upsert({
        elevenlabs_conversation_id: conversationId,
        event_type: 'post_call',
        raw_payload: body,
        received_at: new Date().toISOString(),
        processing_status: 'pending',
        processing_attempts: 0,
      }, {
        onConflict: 'elevenlabs_conversation_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store webhook event:', insertError);
      // Even on error, return 200 to prevent ElevenLabs from retrying
      return new Response(JSON.stringify({ 
        received: true, 
        stored: false, 
        error: insertError.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook event stored:', webhookEvent.id);

    // STEP 2: Return 200 immediately
    const response = new Response(JSON.stringify({ 
      received: true, 
      stored: true,
      event_id: webhookEvent.id,
      conversation_id: conversationId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // STEP 3: Process asynchronously using waitUntil
    const processAsync = async () => {
      try {
        console.log('Starting async processing for:', conversationId);
        
        // Call the existing ai-trucking-call-complete function
        const processResult = await fetch(`${supabaseUrl}/functions/v1/ai-trucking-call-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: rawPayload,
        });

        const processData = await processResult.json();
        console.log('Process result:', JSON.stringify(processData, null, 2));

        // Update webhook event with processing result
        const updateData: Record<string, unknown> = {
          processed_at: new Date().toISOString(),
          processing_status: processData.ok ? 'success' : 'failed',
          processing_attempts: webhookEvent.processing_attempts + 1,
          last_attempt_at: new Date().toISOString(),
        };

        if (processData.call_log_id) {
          updateData.call_log_id = processData.call_log_id;
        }
        if (processData.error) {
          updateData.last_error = processData.error;
        }

        await supabase
          .from('trucking_webhook_events')
          .update(updateData)
          .eq('id', webhookEvent.id);

        // Also update the call log with webhook status
        if (processData.call_log_id) {
          await supabase
            .from('trucking_call_logs')
            .update({
              webhook_event_id: webhookEvent.id,
              post_call_webhook_status: 'success',
            })
            .eq('id', processData.call_log_id);
        }

        console.log('Async processing complete for:', conversationId);

      } catch (processError) {
        console.error('Async processing error:', processError);
        
        // Update webhook event with error
        await supabase
          .from('trucking_webhook_events')
          .update({
            processing_status: 'failed',
            processing_attempts: webhookEvent.processing_attempts + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: processError instanceof Error ? processError.message : 'Unknown error',
          })
          .eq('id', webhookEvent.id);
      }
    };

    // Use waitUntil if available (Supabase Edge Runtime)
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processAsync());
    } else {
      // Fallback: fire and forget
      processAsync().catch(console.error);
    }

    return response;

  } catch (error) {
    console.error('Webhook ingest error:', error);
    
    // Try to store even failed payloads
    try {
      await supabase
        .from('trucking_webhook_events')
        .insert({
          elevenlabs_conversation_id: conversationId || `error_${Date.now()}`,
          event_type: 'post_call_error',
          raw_payload: { raw_text: rawPayload, parse_error: error instanceof Error ? error.message : 'Unknown' },
          received_at: new Date().toISOString(),
          processing_status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        });
    } catch (storeError) {
      console.error('Failed to store error event:', storeError);
    }

    // Always return 200 to prevent retries
    return new Response(JSON.stringify({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
} | undefined;
