import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs pricing (approximate, per minute of conversation)
const COST_PER_MINUTE = 0.07; // $0.07 per minute for conversational AI

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current usage from ElevenLabs
    const usageResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    let elevenLabsUsage = null;
    if (usageResponse.ok) {
      elevenLabsUsage = await usageResponse.json();
    }

    // Calculate usage from our database (trucking_calls table)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Get monthly call stats
    const { data: monthlyCalls, error: monthlyError } = await supabase
      .from('trucking_calls')
      .select('call_duration_seconds')
      .gte('created_at', startOfMonth);

    // Get today's call stats
    const { data: todayCalls, error: todayError } = await supabase
      .from('trucking_calls')
      .select('call_duration_seconds')
      .gte('created_at', startOfDay);

    // Calculate totals
    const monthlyTotalSeconds = (monthlyCalls || []).reduce(
      (sum, c) => sum + (c.call_duration_seconds || 0), 
      0
    );
    const todayTotalSeconds = (todayCalls || []).reduce(
      (sum, c) => sum + (c.call_duration_seconds || 0), 
      0
    );

    const monthlyMinutes = monthlyTotalSeconds / 60;
    const todayMinutes = todayTotalSeconds / 60;

    // Calculate estimated costs
    const estimatedMonthlySpend = monthlyMinutes * COST_PER_MINUTE;
    const estimatedTodaySpend = todayMinutes * COST_PER_MINUTE;

    // Project monthly spend based on current rate
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthlySpend = (estimatedMonthlySpend / dayOfMonth) * daysInMonth;

    return new Response(JSON.stringify({
      success: true,
      usage: {
        monthly: {
          calls: monthlyCalls?.length || 0,
          total_seconds: monthlyTotalSeconds,
          total_minutes: Math.round(monthlyMinutes * 10) / 10,
          estimated_cost: Math.round(estimatedMonthlySpend * 100) / 100,
          projected_cost: Math.round(projectedMonthlySpend * 100) / 100,
        },
        today: {
          calls: todayCalls?.length || 0,
          total_seconds: todayTotalSeconds,
          total_minutes: Math.round(todayMinutes * 10) / 10,
          estimated_cost: Math.round(estimatedTodaySpend * 100) / 100,
        },
        pricing: {
          per_minute: COST_PER_MINUTE,
          currency: 'USD',
        },
        elevenlabs_subscription: elevenLabsUsage ? {
          tier: elevenLabsUsage.tier,
          character_count: elevenLabsUsage.character_count,
          character_limit: elevenLabsUsage.character_limit,
          next_character_count_reset_unix: elevenLabsUsage.next_character_count_reset_unix,
        } : null,
        last_updated: now.toISOString(),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Usage fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
