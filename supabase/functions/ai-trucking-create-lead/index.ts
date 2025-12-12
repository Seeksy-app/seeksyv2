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
    console.log('Received create_lead request:', JSON.stringify(body));

    // ElevenLabs sends parameters in different possible structures
    const params = body.parameters || body;
    const { 
      load_number,
      load_id: provided_load_id, // ElevenLabs might send load_id directly
      company_name, 
      mc_number, 
      dot_number,
      contact_name, 
      phone, 
      email,
      truck_type,
      rate_requested,
      notes 
    } = params;

    // Use load_number OR load_id (some configs use one or the other)
    const searchLoadNumber = load_number || provided_load_id;
    console.log('Parsed params:', { searchLoadNumber, company_name, contact_name, phone, mc_number });

    // Find the load by load_number to get the load_id and owner_id
    let load_id = null;
    let owner_id = null;
    
    if (searchLoadNumber) {
      // Normalize the load number by removing dashes, spaces, and other non-alphanumeric chars
      const normalizedLoadNumber = String(searchLoadNumber).replace(/[^a-zA-Z0-9]/g, '');
      console.log('Searching for load with normalized number:', normalizedLoadNumber);
      
      const { data: loadData, error: loadError } = await supabase
        .from('trucking_loads')
        .select('id, owner_id, rate')
        .ilike('load_number', `%${normalizedLoadNumber}%`)
        .limit(1)
        .single();
      
      if (loadData) {
        load_id = loadData.id;
        owner_id = loadData.owner_id;
        console.log('Found load:', loadData);
      } else {
        console.log('Load not found for:', load_number, loadError);
      }
    }

    // Create the lead
    const leadData = {
      owner_id,
      load_id,
      company_name: company_name || null,
      mc_number: mc_number || null,
      dot_number: dot_number || null,
      contact_name: contact_name || null,
      phone: phone || null,
      email: email || null,
      truck_type: truck_type || null,
      rate_requested: rate_requested ? parseFloat(rate_requested) : null,
      notes: notes || null,
      source: 'ai_voice_agent',
      status: 'new',
      is_confirmed: false,
      requires_callback: true,
      call_source: 'inbound'
    };

    console.log('Creating lead with data:', leadData);

    const { data: lead, error } = await supabase
      .from('trucking_carrier_leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: "Error creating lead",
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead created successfully:', lead.id);

    return new Response(JSON.stringify({
      success: true,
      message: `Lead created successfully for ${company_name || contact_name || 'carrier'}. The broker will follow up shortly.`,
      lead_id: lead.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-create-lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred while creating the lead",
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
