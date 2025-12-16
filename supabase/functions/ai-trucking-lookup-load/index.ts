import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize city names for flexible matching
function normalizeCity(city: string): string {
  if (!city) return '';
  return city
    .trim()
    .toLowerCase()
    .replace(/,/g, '')           // Remove commas
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .replace(/^ft\.?\s*/i, 'fort ')  // Ft. -> Fort
    .replace(/^st\.?\s*/i, 'saint ') // St. -> Saint
    .replace(/^mt\.?\s*/i, 'mount ') // Mt. -> Mount
    .trim();
}

// Build flexible city matching patterns
function getCityPatterns(city: string): string[] {
  const normalized = normalizeCity(city);
  const patterns = [normalized];
  
  // Add abbreviated versions
  if (normalized.startsWith('fort ')) {
    patterns.push(normalized.replace('fort ', 'ft '));
    patterns.push(normalized.replace('fort ', 'ft. '));
  }
  if (normalized.startsWith('saint ')) {
    patterns.push(normalized.replace('saint ', 'st '));
    patterns.push(normalized.replace('saint ', 'st. '));
  }
  if (normalized.startsWith('mount ')) {
    patterns.push(normalized.replace('mount ', 'mt '));
    patterns.push(normalized.replace('mount ', 'mt. '));
  }
  
  // Add the first word only (e.g., "Fort" from "Fort Lauderdale")
  const firstWord = normalized.split(' ')[0];
  if (firstWord.length > 2) {
    patterns.push(firstWord);
  }
  
  return patterns;
}

serve(async (req) => {
  console.log('=== AI Trucking Lookup Load Called ===');
  
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
      console.log('No JSON body - returning all open loads');
    }
    
    console.log('Received lookup_load request:', JSON.stringify(body));

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
        .limit(5);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'load_number';
      }
    }

    // STRATEGY 2: Origin + Destination (full lane match) with flexible city matching
    if (loads.length === 0 && origin_city && destination_city) {
      console.log('Strategy 2: Full lane search:', origin_city, '->', destination_city);
      
      const originPatterns = getCityPatterns(origin_city);
      const destPatterns = getCityPatterns(destination_city);
      
      // Try each origin pattern with each dest pattern
      for (const op of originPatterns) {
        if (loads.length > 0) break;
        for (const dp of destPatterns) {
          const { data, error } = await supabase
            .from('trucking_loads')
            .select('*')
            .eq('status', 'open')
            .ilike('origin_city', `%${op}%`)
            .ilike('destination_city', `%${dp}%`)
            .limit(5);
          
          if (!error && data && data.length > 0) {
            loads = data;
            searchStrategy = 'full_lane';
            break;
          }
        }
      }
    }

    // STRATEGY 3: Destination-only search with flexible matching
    if (loads.length === 0 && destination_city) {
      console.log('Strategy 3: Destination-only search:', destination_city);
      
      const destPatterns = getCityPatterns(destination_city);
      
      for (const dp of destPatterns) {
        const { data, error } = await supabase
          .from('trucking_loads')
          .select('*')
          .eq('status', 'open')
          .ilike('destination_city', `%${dp}%`)
          .limit(5);
        
        if (!error && data && data.length > 0) {
          loads = data;
          searchStrategy = 'destination_only';
          break;
        }
      }
    }

    // STRATEGY 4: Origin-only search with flexible matching
    if (loads.length === 0 && origin_city) {
      console.log('Strategy 4: Origin-only search:', origin_city);
      
      const originPatterns = getCityPatterns(origin_city);
      
      for (const op of originPatterns) {
        const { data, error } = await supabase
          .from('trucking_loads')
          .select('*')
          .eq('status', 'open')
          .ilike('origin_city', `%${op}%`)
          .limit(5);
        
        if (!error && data && data.length > 0) {
          loads = data;
          searchStrategy = 'origin_only';
          break;
        }
      }
    }

    // STRATEGY 5: State-level matching
    if (loads.length === 0 && (origin_city || destination_city)) {
      console.log('Strategy 5: State-level matching');
      
      let stateQuery = supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open');
      
      if (destination_city) {
        const normalized = normalizeCity(destination_city);
        stateQuery = stateQuery.or(`destination_city.ilike.%${normalized}%,destination_state.ilike.%${normalized}%`);
      }
      if (origin_city) {
        const normalized = normalizeCity(origin_city);
        stateQuery = stateQuery.or(`origin_city.ilike.%${normalized}%,origin_state.ilike.%${normalized}%`);
      }
      
      const { data, error } = await stateQuery.limit(5);
      
      if (!error && data && data.length > 0) {
        loads = data;
        searchStrategy = 'state_level';
      }
    }

    // STRATEGY 6: Pickup date filter
    if (pickup_date && loads.length > 0) {
      loads = loads.filter(l => l.pickup_date === pickup_date);
      searchStrategy += '_with_date';
    }

    // STRATEGY 7: List all available loads
    if (loads.length === 0) {
      console.log('Strategy 7: Listing all available loads');
      
      const { data, error } = await supabase
        .from('trucking_loads')
        .select('*')
        .eq('status', 'open')
        .order('pickup_date', { ascending: true })
        .limit(5);
      
      if (!error && data) {
        loads = data;
        searchStrategy = 'all_available';
      }
    }

    console.log(`Found ${loads.length} loads using strategy: ${searchStrategy}`);

    if (loads.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        success: true,
        found: false,
        message: "I don't have any loads available right now. What cities are you interested in?",
        loads: [],
        search_strategy: searchStrategy
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format loads with ALL rate fields for voice agent
    const formattedLoads = loads.slice(0, 3).map(load => {
      const rateType = load.rate_type || 'flat';
      let rateDisplay = 'Rate negotiable';
      
      // Always use target_rate for quoting
      const targetRate = load.target_rate ? Math.round(load.target_rate) : null;
      const ceilingRate = load.floor_rate ? Math.round(load.floor_rate) : null; // floor_rate in DB = ceiling for agent
      const floorRate = load.desired_rate ? Math.round(load.desired_rate) : targetRate; // desired_rate in DB = floor
      
      if (rateType === 'per_ton') {
        const tons = load.tons || (load.weight_lbs ? load.weight_lbs / 2000 : 0);
        if (load.desired_rate_per_ton) {
          const totalEstimate = tons ? load.desired_rate_per_ton * tons : null;
          rateDisplay = `$${load.desired_rate_per_ton} per ton`;
          if (totalEstimate) {
            rateDisplay += `, estimated $${Math.round(totalEstimate)} total`;
          }
        }
      } else if (targetRate) {
        rateDisplay = `$${targetRate}`;
      }

      return {
        load_id: load.id,
        load_number: load.load_number,
        origin: `${load.origin_city}, ${load.origin_state}`,
        origin_city: load.origin_city,
        origin_state: load.origin_state,
        destination: `${load.destination_city}, ${load.destination_state}`,
        destination_city: load.destination_city,
        destination_state: load.destination_state,
        pickup_date: load.pickup_date,
        // Rate fields - agent quotes target_rate, never exceeds ceiling_rate
        rate_type: rateType,
        rate: rateDisplay,
        target_rate: targetRate,        // Starting offer / quote this first
        ceiling_rate: ceilingRate,      // Never go above this
        floor_rate: floorRate,          // Minimum acceptable (for reference)
        // Load details
        miles: load.miles,
        weight: load.weight_lbs ? `${load.weight_lbs} lbs` : null,
        weight_lbs: load.weight_lbs,
        equipment_type: load.equipment_type || 'Dry Van',
        commodity: load.commodity || 'General freight',
        status: load.status
      };
    });

    // Build message - shorter for voice
    let message = '';
    if (formattedLoads.length === 1) {
      const l = formattedLoads[0];
      message = `I have load ${l.load_number} from ${l.origin} to ${l.destination}. Rate is ${l.rate}. Pickup ${l.pickup_date || 'TBD'}. Interested?`;
    } else {
      message = `I found ${formattedLoads.length} loads. `;
      const topLoads = formattedLoads.map(l => 
        `${l.origin_city} to ${l.destination_city} at ${l.rate}`
      ).join('; ');
      message += topLoads + '. Which one?';
    }

    return new Response(JSON.stringify({
      ok: true,
      success: true,
      found: true,
      message,
      loads: formattedLoads,
      search_strategy: searchStrategy,
      multiple_loads: formattedLoads.length > 1
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-lookup-load:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Always return 200 with ok: false
    return new Response(JSON.stringify({
      ok: false,
      success: false,
      found: false,
      message: "Let me check that. What city are you heading to?",
      error: errorMessage,
      loads: []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
