import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== AI Trucking Lookup Load Called ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      console.log('No JSON body or empty body - returning all open loads');
    }
    
    console.log('Received lookup_load request:', JSON.stringify(body));

    // ElevenLabs sends parameters in different possible structures
    const params = (body as any).parameters || body;
    const { load_number, origin_city, destination_city, pickup_date } = params as any;

    console.log('Parsed params:', { load_number, origin_city, destination_city, pickup_date });

    let loads: any[] = [];
    let searchStrategy = 'none';

    // STRATEGY 1: Search by load number first (most specific)
    if (load_number) {
      const normalizedLoadNumber = load_number.replace(/[^a-zA-Z0-9]/g, '');
      console.log('Strategy 1: Load number search:', normalizedLoadNumber);
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .ilike('load_number', `%${normalizedLoadNumber}%`)
        .limit(10);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'load_number';
      }
    }

    // STRATEGY 2: Origin + Destination (full lane match)
    if (loads.length === 0 && origin_city && destination_city) {
      console.log('Strategy 2: Full lane search:', origin_city, '->', destination_city);
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open')
        .ilike('origin_city', `%${origin_city}%`)
        .ilike('destination_city', `%${destination_city}%`)
        .limit(10);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'full_lane';
      }
    }

    // STRATEGY 3: Destination-only search (common for drivers shopping rates)
    if (loads.length === 0 && destination_city) {
      console.log('Strategy 3: Destination-only search:', destination_city);
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open')
        .ilike('destination_city', `%${destination_city}%`)
        .limit(10);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'destination_only';
      }
    }

    // STRATEGY 4: Origin-only search
    if (loads.length === 0 && origin_city) {
      console.log('Strategy 4: Origin-only search:', origin_city);
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open')
        .ilike('origin_city', `%${origin_city}%`)
        .limit(10);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'origin_only';
      }
    }

    // STRATEGY 5: Same-lane alternatives - broaden search with partial matches
    if (loads.length === 0 && (origin_city || destination_city)) {
      console.log('Strategy 5: Same-lane alternatives with state-level matching');
      
      // Try to match by state if city match failed
      let stateQuery = supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open');
      
      // Extract possible state abbreviations from city names
      if (destination_city) {
        // Try matching destination state
        stateQuery = stateQuery.or(`destination_city.ilike.%${destination_city}%,destination_state.ilike.%${destination_city}%`);
      }
      if (origin_city) {
        stateQuery = stateQuery.or(`origin_city.ilike.%${origin_city}%,origin_state.ilike.%${origin_city}%`);
      }
      
      const { data, error } = await stateQuery.limit(10);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'same_lane_alternatives';
      }
    }

    // STRATEGY 6: Pickup date filter (if provided with other criteria)
    if (pickup_date && loads.length > 0) {
      loads = loads.filter(l => l.pickup_date === pickup_date);
      searchStrategy += '_with_date';
    }

    // STRATEGY 7: List all available loads if no criteria matched
    if (loads.length === 0) {
      console.log('Strategy 7: Listing all available loads');
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open')
        .order('pickup_date', { ascending: true })
        .limit(10);
      
      if (!error && data) {
        loads = data;
        searchStrategy = 'all_available';
      }
    }

    console.log(`Found ${loads.length} loads using strategy: ${searchStrategy}`);

    if (loads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        found: false,
        message: "I don't have any loads available right now. What cities are you interested in? I can check for alternatives.",
        loads: [],
        search_strategy: searchStrategy
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format loads for voice agent to read
    const formattedLoads = loads.map(load => {
      const rateType = load.rate_type || 'flat';
      let rateDisplay = 'Rate negotiable';
      
      if (rateType === 'per_ton') {
        const tons = load.tons || (load.weight_lbs ? load.weight_lbs / 2000 : 0);
        if (load.desired_rate_per_ton) {
          const totalEstimate = tons ? load.desired_rate_per_ton * tons : null;
          rateDisplay = `$${load.desired_rate_per_ton} per ton`;
          if (totalEstimate) {
            rateDisplay += `. Estimated total is $${Math.round(totalEstimate)} based on ${tons.toFixed(1)} tons`;
          }
        }
      } else {
        // Flat rate
        if (load.target_rate) {
          rateDisplay = `$${Math.round(load.target_rate)}`;
        }
      }

      return {
        load_id: load.id,
        load_number: load.load_number,
        origin: `${load.origin_city}, ${load.origin_state}`,
        destination: `${load.destination_city}, ${load.destination_state}`,
        pickup_date: load.pickup_date,
        rate_type: rateType,
        rate: rateDisplay,
        target_rate: load.target_rate ? Math.round(load.target_rate) : null,
        miles: load.miles,
        weight: load.weight_lbs ? `${load.weight_lbs} lbs` : 'Weight TBD',
        equipment_type: load.equipment_type || 'Dry Van',
        commodity: load.commodity || 'General freight',
        status: load.status
      };
    });

    // Build helpful message based on search results
    let message = '';
    if (loads.length === 1) {
      const l = formattedLoads[0];
      message = `I found load ${l.load_number} from ${l.origin} to ${l.destination}. The rate is ${l.rate}. Pickup is ${l.pickup_date || 'TBD'}. Are you interested in this load?`;
    } else if (loads.length > 1) {
      message = `I found ${loads.length} loads. `;
      const topLoads = formattedLoads.slice(0, 3).map(l => 
        `${l.origin} to ${l.destination} at ${l.rate}`
      ).join('; ');
      message += topLoads + '. Which one interests you?';
    }

    // Add note about search strategy for non-exact matches
    if (searchStrategy === 'same_lane_alternatives' || searchStrategy === 'all_available') {
      message += ' These are the closest matches I have available.';
    }

    return new Response(JSON.stringify({
      success: true,
      found: true,
      message,
      loads: formattedLoads,
      search_strategy: searchStrategy,
      multiple_loads: loads.length > 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-lookup-load:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      found: false,
      message: "I'm having trouble looking that up. Let me try again. What city are you heading to?",
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
