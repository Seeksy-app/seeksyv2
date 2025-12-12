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
    console.log('Received lookup_load request:', JSON.stringify(body));

    // ElevenLabs sends parameters in different possible structures
    const params = body.parameters || body;
    const { load_number, origin_city, destination_city, pickup_date } = params;

    console.log('Parsed params:', { load_number, origin_city, destination_city, pickup_date });

    let query = supabase
      .from('trucking_loads')
      .select('*')
      .eq('status', 'open');

    // Filter by load number if provided
    if (load_number) {
      query = supabase
        .from('trucking_loads')
        .select('*')
        .ilike('load_number', `%${load_number}%`);
    }

    // Filter by origin city if provided
    if (origin_city) {
      query = query.ilike('origin_city', `%${origin_city}%`);
    }

    // Filter by destination city if provided
    if (destination_city) {
      query = query.ilike('destination_city', `%${destination_city}%`);
    }

    // Filter by pickup date if provided
    if (pickup_date) {
      query = query.eq('pickup_date', pickup_date);
    }

    // Limit results
    query = query.limit(10);

    const { data: loads, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: "Error looking up loads",
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${loads?.length || 0} loads`);

    if (!loads || loads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No loads found matching your criteria. Please try different search parameters.",
        loads: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format loads for voice agent to read
    const formattedLoads = loads.map(load => ({
      load_number: load.load_number,
      origin: `${load.origin_city}, ${load.origin_state}`,
      destination: `${load.destination_city}, ${load.destination_state}`,
      pickup_date: load.pickup_date,
      rate: load.rate ? `$${load.rate}` : 'Rate negotiable',
      miles: load.miles,
      weight: load.weight ? `${load.weight} lbs` : 'Weight TBD',
      equipment_type: load.equipment_type || 'Dry Van',
      commodity: load.commodity || 'General freight',
      status: load.status
    }));

    return new Response(JSON.stringify({
      success: true,
      message: `Found ${formattedLoads.length} load(s) matching your search.`,
      loads: formattedLoads
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-lookup-load:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred while looking up loads",
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
