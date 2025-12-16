import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[ai-trucking-call-router] Received request:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle ElevenLabs webhook tool calls
    const action = body.action;

    if (action === "lookup_load") {
      return await handleLookupLoad(supabase, body);
    } else if (action === "create_lead") {
      return await handleCreateLead(supabase, body);
    } else if (action === "negotiate_rate") {
      return await handleNegotiateRate(supabase, body);
    } else {
      // Legacy format or unknown action
      console.log("[ai-trucking-call-router] Unknown action:", action);
      return new Response(
        JSON.stringify({ 
          error: "Unknown action", 
          available_actions: ["lookup_load", "create_lead", "negotiate_rate"] 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[ai-trucking-call-router] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleLookupLoad(supabase: any, body: any) {
  const { load_number, origin_city, destination_city } = body;
  
  console.log("[lookup_load] Searching for load:", { load_number, origin_city, destination_city });

  // IMPORTANT: Many drivers don't speak English well and may not know the load number.
  // They often only know the destination city. Be flexible in matching.
  
  let query = supabase
    .from('trucking_loads')
    .select('*')
    .eq('is_active', true);

  // Search by load number first (if provided)
  if (load_number) {
    // Try exact match first, then partial
    query = query.ilike('load_number', `%${load_number}%`);
  } else if (destination_city) {
    // Destination-only search is common for drivers shopping rates
    query = query.ilike('destination_city', `%${destination_city}%`);
    if (origin_city) {
      query = query.ilike('origin_city', `%${origin_city}%`);
    }
  } else if (origin_city) {
    // Origin-only search
    query = query.ilike('origin_city', `%${origin_city}%`);
  } else {
    // No search criteria - list available loads to help driver find what they need
    // This helps non-English speakers who might struggle to explain what they're looking for
    const { data: availableLoads, error: listError } = await supabase
      .from('trucking_loads')
      .select('id, load_number, origin_city, origin_state, destination_city, destination_state, target_rate, pickup_date')
      .eq('is_active', true)
      .limit(5);
    
    if (listError || !availableLoads || availableLoads.length === 0) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: "I don't have any loads available right now. Can I help you with something else?" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format available loads as options for the driver
    const loadOptions = availableLoads.map((l: any) => 
      `${l.origin_city} to ${l.destination_city} - $${Math.round(l.target_rate || 0)}`
    ).join('; ');
    
    return new Response(
      JSON.stringify({ 
        found: false,
        available_loads: availableLoads.map((l: any) => ({
          load_id: l.id,
          load_number: l.load_number,
          lane: `${l.origin_city}, ${l.origin_state} to ${l.destination_city}, ${l.destination_state}`,
          rate: Math.round(l.target_rate || 0),
          pickup_date: l.pickup_date
        })),
        message: `I have a few loads available. Where are you trying to go? I have: ${loadOptions}. Just tell me the city you're heading to.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: loads, error } = await query.limit(5);

  if (error) {
    console.error("[lookup_load] Database error:", error);
    return new Response(
      JSON.stringify({ found: false, message: "I'm having trouble searching right now. Can you try again?" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!loads || loads.length === 0) {
    console.log("[lookup_load] No loads found");
    return new Response(
      JSON.stringify({ 
        found: false, 
        message: "I don't have any loads going there right now. What other cities are you interested in? Or do you have a load number?" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If multiple loads found, list them as options
  if (loads.length > 1) {
    const loadOptions = loads.map((l: any) => ({
      load_id: l.id,
      load_number: l.load_number,
      lane: `${l.origin_city}, ${l.origin_state} to ${l.destination_city}, ${l.destination_state}`,
      rate: Math.round(l.target_rate || 0),
      pickup_date: l.pickup_date,
      miles: l.miles
    }));
    
    const optionsText = loads.map((l: any) => 
      `Load ${l.load_number}: ${l.origin_city} to ${l.destination_city}, $${Math.round(l.target_rate || 0)}, pickup ${l.pickup_date || 'TBD'}`
    ).join('. ');
    
    return new Response(
      JSON.stringify({
        found: true,
        multiple_loads: true,
        loads: loadOptions,
        message: `I found ${loads.length} loads. ${optionsText}. Which one are you interested in? Just tell me the load number or the cities.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Single load found - provide full details
  const load = loads[0];
  const rateText = formatRate(load);
  
  // Calculate rate per mile if we have both values - round to nearest dollar
  const distanceMiles = load.miles ? Math.round(load.miles) : null;
  const targetRate = load.target_rate ? Math.round(load.target_rate) : null;
  let ratePerMile: number | null = null;
  if (distanceMiles && distanceMiles > 0 && targetRate && targetRate > 0) {
    ratePerMile = targetRate / distanceMiles;
  }

  console.log("[lookup_load] Found load:", load.load_number, "Miles:", distanceMiles, "Rate/mi:", ratePerMile);

  return new Response(
    JSON.stringify({
      found: true,
      load_id: load.id,
      load_number: load.load_number,
      origin: `${load.origin_city}, ${load.origin_state}`,
      destination: `${load.destination_city}, ${load.destination_state}`,
      pickup_date: load.pickup_date,
      pickup_window: `${load.pickup_window_start || 'TBD'} - ${load.pickup_window_end || 'TBD'}`,
      delivery_date: load.delivery_date,
      delivery_window: `${load.delivery_window_start || 'TBD'} - ${load.delivery_window_end || 'TBD'}`,
      equipment_type: load.equipment_type || 'Dry Van',
      weight_lbs: load.weight_lbs,
      miles: distanceMiles,
      rate: rateText,
      target_rate: targetRate,
      floor_rate: load.floor_rate ? Math.round(load.floor_rate) : null,
      rate_per_mile: ratePerMile ? Math.round(ratePerMile * 100) / 100 : null,
      notes: load.notes,
      message: buildLoadMessage(load, distanceMiles, targetRate, ratePerMile)
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleNegotiateRate(supabase: any, body: any) {
  const { load_id, carrier_offer } = body;
  
  console.log("[negotiate_rate] Negotiating rate:", { load_id, carrier_offer });

  if (!load_id) {
    return new Response(
      JSON.stringify({ success: false, message: "Load ID is required for negotiation." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get load details with target and ceiling rates
  const { data: load, error: loadError } = await supabase
    .from('trucking_loads')
    .select('*')
    .eq('id', load_id)
    .single();

  if (loadError || !load) {
    console.error("[negotiate_rate] Load not found:", loadError);
    return new Response(
      JSON.stringify({ success: false, message: "Could not find the specified load." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Round all rates to nearest dollar - never show decimals
  const targetRate = Math.round(load.target_rate || 0);
  const ceilingRate = Math.round(load.floor_rate || targetRate); // floor_rate is the ceiling in DB
  const INCREMENT = 25; // Always offer $25 more when driver wants more

  // Parse carrier's offer and round to nearest dollar
  const offerAmount = Math.round(parseFloat(carrier_offer) || 0);
  
  // NEGOTIATION LOGIC:
  // 1. Start at target rate (our goal - maximize profit)
  // 2. Counter with +$25 increments when driver wants more
  // 3. Never go above ceiling rate
  // 4. Accept immediately if driver accepts anything at or below ceiling
  
  let counterOffer = targetRate;
  let shouldAccept = false;
  let message = "";
  let negotiationGuidance = "";

  if (offerAmount > 0 && offerAmount <= ceilingRate) {
    // ACCEPT - Driver accepted at or below our ceiling (any offer under ceiling is good!)
    shouldAccept = true;
    counterOffer = offerAmount;
    message = `$${offerAmount} works for us! Let's book this load right now.`;
    negotiationGuidance = "ACCEPT - Carrier accepted at or below ceiling. Book immediately!";
  } else if (offerAmount > ceilingRate && offerAmount <= targetRate) {
    // ACCEPT - Driver accepted between ceiling and target (great deal for us!)
    shouldAccept = true;
    counterOffer = offerAmount;
    message = `That rate of $${offerAmount} works for us. Let's get this load booked!`;
    negotiationGuidance = "ACCEPT - Carrier accepted between ceiling and target. Good profit margin!";
  } else if (offerAmount > targetRate) {
    // Driver wants MORE than our target - counter down toward target
    // Offer $25 less than their ask, but don't go below target
    counterOffer = Math.max(offerAmount - INCREMENT, targetRate);
    shouldAccept = false;
    message = `I can do $${counterOffer}. That's a fair rate for this lane.`;
    negotiationGuidance = `COUNTER DOWN at $${counterOffer}. Driver asking above target. Stay firm near target rate.`;
  } else if (offerAmount === 0) {
    // No offer yet - quote target rate (start high to maximize profit)
    counterOffer = targetRate;
    message = `The all-in rate for this load is $${targetRate}.`;
    negotiationGuidance = "INITIAL QUOTE - Start at target rate to maximize profit margin.";
  } else {
    // This shouldn't happen but handle gracefully
    counterOffer = targetRate;
    message = `Our rate for this load is $${targetRate}.`;
    negotiationGuidance = "RESTATE target rate.";
  }

  console.log("[negotiate_rate] Result:", { 
    carrier_offer: offerAmount, 
    counter_offer: counterOffer, 
    should_accept: shouldAccept,
    target: targetRate,
    ceiling: ceilingRate
  });

  return new Response(
    JSON.stringify({
      success: true,
      load_id: load.id,
      load_number: load.load_number,
      carrier_offer: offerAmount,
      counter_offer: counterOffer,
      target_rate: targetRate,
      ceiling_rate: ceilingRate,
      should_accept: shouldAccept,
      room_to_negotiate: ceilingRate - counterOffer, // How much we can still come up if needed
      increment_amount: INCREMENT,
      message: message,
      negotiation_guidance: negotiationGuidance
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCreateLead(supabase: any, body: any) {
  const { 
    load_id, 
    company_name, 
    mc_number, 
    contact_name, 
    phone, 
    rate_offered 
  } = body;

  console.log("[create_lead] Creating lead:", { load_id, company_name, mc_number, contact_name, phone, rate_offered });

  if (!load_id) {
    return new Response(
      JSON.stringify({ success: false, message: "Load ID is required to book a load." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get load details and owner info
  const { data: load, error: loadError } = await supabase
    .from('trucking_loads')
    .select('*, trucking_profiles!trucking_loads_owner_id_fkey(auto_notify_email, contact_name, company_name)')
    .eq('id', load_id)
    .single();

  if (loadError || !load) {
    console.error("[create_lead] Load not found:", loadError);
    return new Response(
      JSON.stringify({ success: false, message: "Could not find the specified load." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create the carrier lead
  const { data: lead, error: leadError } = await supabase
    .from('trucking_carrier_leads')
    .insert({
      owner_id: load.owner_id,
      load_id: load_id,
      company_name: company_name || 'Unknown Company',
      mc_number: mc_number,
      contact_name: contact_name,
      phone: phone,
      rate_offered: rate_offered || load.target_rate,
      status: 'interested',
      source: 'ai_call',
      notes: `AI agent booking. Rate offered: $${rate_offered || load.target_rate}`,
    })
    .select()
    .single();

  if (leadError) {
    console.error("[create_lead] Error creating lead:", leadError);
    return new Response(
      JSON.stringify({ success: false, message: "Error creating lead. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("[create_lead] Lead created:", lead.id);

  // Calculate estimated cost based on summary text
  const summaryText = `Carrier ${company_name} interested in load ${load.load_number}. MC: ${mc_number || 'N/A'}. Rate: $${rate_offered || load.target_rate}`;
  const totalCharacters = summaryText.length;
  
  // Get pricing from settings or use default
  const { data: settings } = await supabase
    .from('trucking_settings')
    .select('ai_price_per_million_chars_usd, demo_mode_enabled')
    .eq('owner_id', load.owner_id)
    .single();
  
  const pricePerMillion = settings?.ai_price_per_million_chars_usd ?? 50;
  const isDemo = settings?.demo_mode_enabled ?? false;
  const estimatedCostUsd = (totalCharacters / 1_000_000) * pricePerMillion;

  // Log the call with cost tracking
  await supabase.from('trucking_call_logs').insert({
    owner_id: load.owner_id,
    carrier_phone: phone,
    load_id: load_id,
    call_direction: 'inbound',
    summary: summaryText,
    call_started_at: new Date().toISOString(),
    call_ended_at: new Date().toISOString(),
    total_characters: totalCharacters,
    estimated_cost_usd: estimatedCostUsd,
    is_demo: isDemo,
  });

  // Send email notification to broker
  await sendBrokerNotification(load, lead, company_name, mc_number, contact_name, phone, rate_offered);

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: lead.id,
      message: `Great! I've notified our broker about your interest in load ${load.load_number}. They will call you right back at ${phone} to confirm the booking. Is there anything else I can help you with?`
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendBrokerNotification(
  load: any, 
  lead: any, 
  companyName: string, 
  mcNumber: string, 
  contactName: string, 
  phone: string, 
  rateOffered: number
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  // Always send to D&L Transport broker email
  const brokerEmail = "stephen@dltransport.com";

  if (!resendApiKey) {
    console.log("[sendBrokerNotification] RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🚚 New Load Booking Request
        </h1>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1f2937;">Load Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Load Number:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.load_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Origin:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.origin_city}, ${load.origin_state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Destination:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.destination_city}, ${load.destination_state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Pickup Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.pickup_date || 'TBD'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Target Rate:</td>
              <td style="padding: 8px 0; color: #1f2937;">$${load.target_rate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #166534;">Carrier Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Company:</td>
              <td style="padding: 8px 0; color: #1f2937;">${companyName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">MC Number:</td>
              <td style="padding: 8px 0; color: #1f2937;">${mcNumber || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Contact:</td>
              <td style="padding: 8px 0; color: #1f2937;">${contactName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Phone:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                <a href="tel:${phone}" style="color: #2563eb;">${phone || 'Not provided'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Rate Offered:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">$${rateOffered || load.target_rate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⏰ Action Required:</strong> The carrier is expecting a call back to confirm this booking.
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This notification was sent by the D&L AI Trucking Agent.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "D&L Trucking AI <onboarding@resend.dev>",
      to: [brokerEmail],
      subject: `🚚 New Booking Request - Load ${load.load_number} - ${companyName || 'Carrier'}`,
      html: emailHtml,
    });

    if (error) {
      console.error("[sendBrokerNotification] Email error:", error);
    } else {
      console.log("[sendBrokerNotification] Email sent successfully:", data);
    }
  } catch (error) {
    console.error("[sendBrokerNotification] Error sending email:", error);
  }
}

function formatRate(load: any): string {
  // Never show decimals - round to nearest dollar
  if (load.rate_unit === 'per_mile' && load.miles) {
    const flatRate = Math.round(load.target_rate * load.miles);
    const perMile = Math.round(load.target_rate);
    return `$${flatRate} flat ($${perMile}/mile)`;
  }
  return `$${Math.round(load.target_rate || 0)} flat`;
}

function buildLoadMessage(load: any, distanceMiles: number | null, targetRate: number | null, ratePerMile: number | null): string {
  // Build a conversational message that helps non-English speakers identify the load
  // Offer multiple ways to confirm: load number, cities, dates
  let msg = `I found load ${load.load_number}. `;
  msg += `It goes from ${load.origin_city}, ${load.origin_state} to ${load.destination_city}, ${load.destination_state}. `;
  
  if (distanceMiles) {
    msg += `About ${Math.round(distanceMiles)} miles. `;
  }
  
  msg += `Pickup is ${load.pickup_date || 'TBD'}`;
  if (load.pickup_window_start) {
    msg += ` between ${load.pickup_window_start} and ${load.pickup_window_end || 'TBD'}`;
  }
  msg += `. `;
  
  if (load.delivery_date) {
    msg += `Delivery ${load.delivery_date}. `;
  }
  
  if (load.weight_lbs) {
    msg += `Weight is ${load.weight_lbs.toLocaleString()} pounds. `;
  }
  
  msg += `${load.equipment_type || 'Dry Van'}. `;
  
  if (targetRate) {
    // Round to nearest dollar - never show decimals
    const roundedRate = Math.round(targetRate);
    msg += `The all-in rate is $${roundedRate}. `;
    if (ratePerMile && distanceMiles) {
      const roundedRpm = Math.round(ratePerMile * 100) / 100;
      msg += `That's about $${roundedRpm.toFixed(2)} per mile. `;
    }
  }
  
  // Help non-English speakers confirm - offer multiple confirmation options
  msg += `Does this sound like the load you're looking for? You can confirm by the cities or the load number.`;
  
  return msg;
}
