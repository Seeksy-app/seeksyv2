import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Session storage (in production, use Redis or database)
const sessions: Map<string, {
  language: 'en' | 'es';
  status: 'language_selection' | 'load_inquiry' | 'rate_negotiation' | 'collecting_info' | 'complete';
  currentLoadId?: string;
  carrierProfile: {
    company?: string;
    mc?: string;
    dot?: string;
    contact?: string;
    phone?: string;
    email?: string;
    truckType?: string;
    eta?: string;
  };
  negotiationState: 'none' | 'counter' | 'escalated';
  callStartedAt: string;
}> = new Map();

// Prompts in both languages
const PROMPTS = {
  language_choice: {
    en: "Hi, this is Christy with AITrucking on behalf of dispatch. For English, stay on the line. Para español, diga 'español' ahora.",
  },
  greeting: {
    en: "Hi, this is Christy with AITrucking on behalf of dispatch. What load number are you calling about today?",
    es: "Hola, soy Christy de AITrucking, del despacho. ¿Sobre qué número de carga está llamando hoy?",
  },
  load_not_found: {
    en: "I couldn't find that load number. Could you repeat it or give me the origin and destination cities?",
    es: "No pude encontrar ese número de carga. ¿Podría repetirlo o darme las ciudades de origen y destino?",
  },
  confirm_load: {
    en: "I found load {load_number} from {origin_city}, {origin_state} to {destination_city}, {destination_state}. It picks up {pickup_date} between {pickup_window_start} and {pickup_window_end}, delivers {delivery_date} between {delivery_window_start} and {delivery_window_end}, about {weight_lbs} pounds, {equipment_type}. This pays {rate_text}. Are you interested at that rate?",
    es: "Encontré la carga {load_number} de {origin_city}, {origin_state} a {destination_city}, {destination_state}. Recoje el {pickup_date} entre {pickup_window_start} y {pickup_window_end}, y entrega el {delivery_date} entre {delivery_window_start} y {delivery_window_end}, con un peso aproximado de {weight_lbs} libras, {equipment_type}. Esta carga paga {rate_text}. ¿Le interesa a esa tarifa?",
  },
  collect_carrier: {
    en: "Great! To pass this to dispatch, I just need a few details. What is your company name and MC number?",
    es: "¡Perfecto! Para enviar esto al despacho, necesito algunos datos. ¿Cuál es el nombre de su compañía y su número MC?",
  },
  escalate: {
    en: "That's above what I'm allowed to approve. I'll send this offer to dispatch for review. What is the best rate you would need, and your best phone number for a call back?",
    es: "Esa cantidad está por encima de lo que tengo permitido aprobar. Voy a enviar esta oferta al despacho para que la revisen. ¿Cuál sería la mejor tarifa que usted necesitaría, y cuál es su mejor número de teléfono para devolverle la llamada?",
  },
  rate_accepted: {
    en: "I can approve that rate. Let me get your information to pass along to dispatch.",
    es: "Puedo aprobar esa tarifa. Déjeme obtener su información para pasarla al despacho.",
  },
  rate_declined: {
    en: "Unfortunately, that rate is too high for this load. Our best offer is {target_rate}. Would you like to reconsider?",
    es: "Desafortunadamente, esa tarifa es demasiado alta para esta carga. Nuestra mejor oferta es {target_rate}. ¿Le gustaría reconsiderar?",
  },
  lead_created: {
    en: "Thank you! I've passed your information to dispatch. Someone will reach out to you shortly to confirm the booking. Is there anything else I can help you with?",
    es: "¡Gracias! He pasado su información al despacho. Alguien se comunicará con usted pronto para confirmar la reserva. ¿Hay algo más en lo que pueda ayudarle?",
  },
  goodbye: {
    en: "Thank you for calling AITrucking. Have a great day!",
    es: "Gracias por llamar a AITrucking. ¡Que tenga un buen día!",
  },
};

async function generateTTS(text: string, language: 'en' | 'es'): Promise<ArrayBuffer | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  const voiceId = language === 'es' 
    ? Deno.env.get("ELEVENLABS_VOICE_ES") || "EXAVITQu4vr4xnSDxMaL"
    : Deno.env.get("ELEVENLABS_VOICE_EN") || "EXAVITQu4vr4xnSDxMaL";

  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    });

    if (!response.ok) {
      console.error("ElevenLabs TTS error:", await response.text());
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}

function formatRate(load: any): string {
  if (load.rate_unit === 'per_mile' && load.miles) {
    const flatRate = load.target_rate * load.miles;
    return `$${flatRate.toFixed(2)} flat, which is $${load.target_rate.toFixed(2)} per mile`;
  }
  return `$${load.target_rate?.toFixed(2) || '0.00'} flat`;
}

function calculateFloorRate(load: any): number {
  if (load.rate_unit === 'per_mile' && load.miles) {
    return (load.floor_rate || load.target_rate * 0.9) * load.miles;
  }
  return load.floor_rate || load.target_rate * 0.9;
}

function calculateTargetRate(load: any): number {
  if (load.rate_unit === 'per_mile' && load.miles) {
    return load.target_rate * load.miles;
  }
  return load.target_rate;
}

function interpolatePrompt(prompt: string, data: Record<string, any>): string {
  let result = prompt;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value || ''));
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      call_sid, 
      from: callerPhone, 
      to: dialedNumber,
      transcript,
      action 
    } = await req.json();

    console.log(`[ai-trucking-call-router] Call ${call_sid} from ${callerPhone}, action: ${action}`);
    console.log(`[ai-trucking-call-router] Transcript: ${transcript}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize or get session
    let session = sessions.get(call_sid);
    if (!session) {
      session = {
        language: 'en',
        status: 'language_selection',
        carrierProfile: {},
        negotiationState: 'none',
        callStartedAt: new Date().toISOString(),
      };
      sessions.set(call_sid, session);
    }

    let responseText = "";
    let shouldEndCall = false;

    // Handle language selection
    if (session.status === 'language_selection') {
      if (transcript?.toLowerCase().includes('español')) {
        session.language = 'es';
        console.log(`[ai-trucking-call-router] Language set to Spanish`);
      }
      session.status = 'load_inquiry';
      responseText = PROMPTS.greeting[session.language];
    }
    // Handle load inquiry
    else if (session.status === 'load_inquiry') {
      // Extract load number from transcript
      const loadNumberMatch = transcript?.match(/\b(\d{4,10})\b/);
      const loadNumber = loadNumberMatch?.[1];

      if (loadNumber) {
        // Look up load
        const { data: load, error } = await supabase
          .from('trucking_loads')
          .select('*')
          .eq('load_number', loadNumber)
          .eq('is_active', true)
          .single();

        if (load) {
          session.currentLoadId = load.id;
          session.status = 'rate_negotiation';
          
          const rateText = formatRate(load);
          responseText = interpolatePrompt(PROMPTS.confirm_load[session.language], {
            ...load,
            rate_text: rateText,
          });
        } else {
          responseText = PROMPTS.load_not_found[session.language];
        }
      } else {
        responseText = PROMPTS.load_not_found[session.language];
      }
    }
    // Handle rate negotiation
    else if (session.status === 'rate_negotiation') {
      const yesPatterns = session.language === 'es' 
        ? ['sí', 'si', 'claro', 'correcto', 'acepto', 'me interesa']
        : ['yes', 'yeah', 'yep', 'sure', 'interested', 'sounds good', 'i\'ll take it'];
      
      const noPatterns = session.language === 'es'
        ? ['no', 'necesito más', 'muy bajo', 'puedo obtener']
        : ['no', 'need more', 'too low', 'can you do', 'what about', 'counter'];

      const lowerTranscript = transcript?.toLowerCase() || '';
      const isYes = yesPatterns.some(p => lowerTranscript.includes(p));
      const isNo = noPatterns.some(p => lowerTranscript.includes(p));

      if (isYes && !isNo) {
        session.status = 'collecting_info';
        responseText = PROMPTS.collect_carrier[session.language];
      } else if (isNo) {
        // Extract requested rate
        const rateMatch = lowerTranscript.match(/\$?(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/);
        const requestedRate = rateMatch ? parseFloat(rateMatch[1].replace(',', '')) : null;

        if (requestedRate && session.currentLoadId) {
          const { data: load } = await supabase
            .from('trucking_loads')
            .select('*')
            .eq('id', session.currentLoadId)
            .single();

          if (load) {
            const targetRate = calculateTargetRate(load);
            const floorRate = calculateFloorRate(load);
            const autoApproveBand = load.auto_approve_band_flat || (targetRate * 0.05);
            const escalateThreshold = load.escalate_threshold || (targetRate * 1.15);

            if (requestedRate <= targetRate + autoApproveBand) {
              // Auto-approve
              session.status = 'collecting_info';
              responseText = PROMPTS.rate_accepted[session.language];
            } else if (requestedRate <= escalateThreshold) {
              // Escalate for human review
              session.negotiationState = 'escalated';
              session.status = 'collecting_info';
              responseText = PROMPTS.escalate[session.language];
            } else {
              // Decline
              responseText = interpolatePrompt(PROMPTS.rate_declined[session.language], {
                target_rate: `$${targetRate.toFixed(2)}`,
              });
            }
          }
        } else {
          responseText = PROMPTS.escalate[session.language];
          session.negotiationState = 'counter';
          session.status = 'collecting_info';
        }
      } else {
        // Repeat the question
        responseText = session.language === 'es' 
          ? "¿Le interesa esta carga a la tarifa mencionada?"
          : "Are you interested in this load at the rate I quoted?";
      }
    }
    // Collect carrier info
    else if (session.status === 'collecting_info') {
      // Simple extraction - in production use LLM for better parsing
      const mcMatch = transcript?.match(/\b(mc|m\.c\.?)\s*(\d{5,7})\b/i);
      const dotMatch = transcript?.match(/\b(dot|d\.o\.t\.?)\s*(\d{5,8})\b/i);
      
      if (mcMatch) session.carrierProfile.mc = mcMatch[2];
      if (dotMatch) session.carrierProfile.dot = dotMatch[2];
      
      // Extract company name (basic)
      if (!session.carrierProfile.company && transcript) {
        session.carrierProfile.company = transcript.split(/[,.]|my company|we are|i'm with/i)[0]?.trim();
      }

      // If we have enough info, create lead
      if (session.carrierProfile.mc || session.carrierProfile.company) {
        if (session.currentLoadId) {
          const { data: load } = await supabase
            .from('trucking_loads')
            .select('owner_id, target_rate, rate_unit, miles')
            .eq('id', session.currentLoadId)
            .single();

          if (load) {
            const rateOffered = calculateTargetRate(load);
            
            // Create carrier lead
            await supabase.from('trucking_carrier_leads').insert({
              owner_id: load.owner_id,
              load_id: session.currentLoadId,
              company_name: session.carrierProfile.company || 'Unknown',
              mc_number: session.carrierProfile.mc,
              dot_number: session.carrierProfile.dot,
              contact_name: session.carrierProfile.contact,
              phone: callerPhone,
              email: session.carrierProfile.email,
              truck_type: session.carrierProfile.truckType,
              rate_offered: rateOffered,
              status: session.negotiationState === 'escalated' ? 'countered' : 'interested',
              source: 'ai_call',
              notes: `AI call from ${callerPhone}. Negotiation: ${session.negotiationState}`,
            });

            // Log the call
            await supabase.from('trucking_call_logs').insert({
              owner_id: load.owner_id,
              carrier_phone: callerPhone,
              load_id: session.currentLoadId,
              call_direction: 'inbound',
              summary: `Carrier ${session.carrierProfile.company} interested in load. Status: ${session.negotiationState === 'escalated' ? 'needs review' : 'interested'}`,
              call_started_at: session.callStartedAt,
              call_ended_at: new Date().toISOString(),
            });
          }
        }

        session.status = 'complete';
        responseText = PROMPTS.lead_created[session.language];
      } else {
        responseText = session.language === 'es'
          ? "¿Podría darme el nombre de su compañía y su número MC?"
          : "Could you give me your company name and MC number?";
      }
    }
    // Call complete
    else if (session.status === 'complete') {
      responseText = PROMPTS.goodbye[session.language];
      shouldEndCall = true;
      sessions.delete(call_sid);
    }

    // Generate TTS audio
    const audioBuffer = await generateTTS(responseText, session.language);
    
    // Return response with audio or just text for Twilio to handle
    return new Response(
      JSON.stringify({
        success: true,
        response_text: responseText,
        language: session.language,
        status: session.status,
        should_end_call: shouldEndCall,
        audio_base64: audioBuffer ? btoa(String.fromCharCode(...new Uint8Array(audioBuffer))) : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ai-trucking-call-router] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
