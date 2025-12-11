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
    } else {
      // Legacy format or unknown action
      console.log("[ai-trucking-call-router] Unknown action:", action);
      return new Response(
        JSON.stringify({ 
          error: "Unknown action", 
          available_actions: ["lookup_load", "create_lead"] 
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

  let query = supabase
    .from('trucking_loads')
    .select('*')
    .eq('is_active', true);

  // Search by load number first
  if (load_number) {
    query = query.eq('load_number', load_number);
  } else if (origin_city || destination_city) {
    // Search by lane (origin/destination)
    if (origin_city) {
      query = query.ilike('origin_city', `%${origin_city}%`);
    }
    if (destination_city) {
      query = query.ilike('destination_city', `%${destination_city}%`);
    }
  } else {
    return new Response(
      JSON.stringify({ 
        found: false, 
        message: "Please provide a load number or origin/destination cities." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: loads, error } = await query.limit(5);

  if (error) {
    console.error("[lookup_load] Database error:", error);
    return new Response(
      JSON.stringify({ found: false, message: "Error searching for loads." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!loads || loads.length === 0) {
    console.log("[lookup_load] No loads found");
    return new Response(
      JSON.stringify({ 
        found: false, 
        message: "No loads found matching your criteria. Would you like to try a different search?" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Format load information for the agent
  const load = loads[0]; // Return first match
  const rateText = formatRate(load);

  console.log("[lookup_load] Found load:", load.load_number);

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
      miles: load.miles,
      rate: rateText,
      target_rate: load.target_rate,
      floor_rate: load.floor_rate,
      notes: load.notes,
      message: `Found load ${load.load_number} from ${load.origin_city}, ${load.origin_state} to ${load.destination_city}, ${load.destination_state}. Picks up ${load.pickup_date}, delivers ${load.delivery_date}. ${load.weight_lbs ? load.weight_lbs + ' lbs, ' : ''}${load.equipment_type || 'Dry Van'}. Rate: ${rateText}.`
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

  // Log the call
  await supabase.from('trucking_call_logs').insert({
    owner_id: load.owner_id,
    carrier_phone: phone,
    load_id: load_id,
    call_direction: 'inbound',
    summary: `Carrier ${company_name} interested in load ${load.load_number}. MC: ${mc_number || 'N/A'}. Rate: $${rate_offered || load.target_rate}`,
    call_started_at: new Date().toISOString(),
    call_ended_at: new Date().toISOString(),
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
  if (load.rate_unit === 'per_mile' && load.miles) {
    const flatRate = load.target_rate * load.miles;
    return `$${flatRate.toFixed(2)} flat ($${load.target_rate.toFixed(2)}/mile)`;
  }
  return `$${load.target_rate?.toFixed(2) || '0.00'} flat`;
}
