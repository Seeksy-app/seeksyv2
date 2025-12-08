import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScenarioConfig {
  scenario_key: string;
  label: string;
  revenue_growth_multiplier: number;
  market_adoption_multiplier: number;
  churn_multiplier: number;
  cac_multiplier: number;
  impressions_multiplier: number;
  cpm_multiplier: number;
  fill_rate_multiplier: number;
  platform_revshare_adjustment: number;
}

interface Benchmark {
  metric_key: string;
  value: number;
  unit: string;
  confidence: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { scenarioKey, years = [2025, 2026, 2027], cfoOverrides = {} } = await req.json();

    // Fetch scenario config
    const { data: scenarioConfig, error: scenarioError } = await supabase
      .from('scenario_configs')
      .select('*')
      .eq('scenario_key', scenarioKey)
      .single();

    if (scenarioError || !scenarioConfig) {
      throw new Error(`Scenario not found: ${scenarioKey}`);
    }

    // Fetch all benchmarks
    const { data: benchmarks, error: benchmarksError } = await supabase
      .from('rd_benchmarks')
      .select('metric_key, value, unit, confidence');

    if (benchmarksError) {
      throw new Error(`Failed to fetch benchmarks: ${benchmarksError.message}`);
    }

    // Convert benchmarks to a lookup map
    const benchmarkMap: Record<string, number> = {};
    benchmarks?.forEach((b: Benchmark) => {
      benchmarkMap[b.metric_key] = Number(b.value);
    });

    // Apply CFO overrides
    Object.entries(cfoOverrides).forEach(([key, value]) => {
      if (typeof value === 'number') {
        benchmarkMap[key] = value;
      }
    });

    // Fetch market data
    const { data: marketData } = await supabase
      .from('rd_market_data')
      .select('*')
      .in('year', years);

    // Build prompt for AI
    const systemPrompt = `You are a CFO AI assistant for Seeksy, a creator economy platform. Generate detailed financial projections based on the provided benchmarks and scenario multipliers.

IMPORTANT: You must return ONLY valid JSON, no markdown, no explanations. The JSON must follow this exact structure:
{
  "years": [
    {
      "year": 2025,
      "revenue": {
        "subscriptions": { "free": 0, "pro": X, "business": X, "enterprise": X, "total": X },
        "aiCredits": { "clips": X, "postProduction": X, "transcription": X, "total": X },
        "podcastHosting": { "hosting": X, "storage": X, "total": X },
        "advertising": {
          "hostReadAudio": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "programmaticAudio": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "videoPreroll": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "videoMidroll": { "impressions": X, "cpm": X, "fillRate": X, "revenue": X, "platformShare": X },
          "brandDeals": { "deals": X, "avgValue": X, "revenue": X, "platformShare": X },
          "newsletter": { "impressions": X, "cpm": X, "revenue": X, "platformShare": X },
          "display": { "impressions": X, "cpm": X, "revenue": X, "platformShare": X },
          "total": X,
          "totalPlatformRevenue": X
        },
        "events": { "tickets": X, "sponsorships": X, "livestream": X, "total": X },
        "licensing": { "whiteLabel": X, "enterprise": X, "total": X },
        "totalRevenue": X
      },
      "expenses": {
        "cogs": X,
        "salesMarketing": X,
        "rd": X,
        "ga": X,
        "total": X
      },
      "ebitda": X,
      "ebitdaMargin": X,
      "creatorCount": X,
      "subscriberCount": X,
      "churnRate": X,
      "cac": X,
      "ltv": X
    }
  ],
  "breakEvenYear": X,
  "commentary": "Brief 2-3 sentence analysis of the projections"
}`;

    const userPrompt = `Generate a ${scenarioConfig.label} scenario financial projection for Seeksy for years ${years.join(', ')}.

SCENARIO MULTIPLIERS:
- Revenue Growth: ${scenarioConfig.revenue_growth_multiplier}x
- Market Adoption: ${scenarioConfig.market_adoption_multiplier}x
- Churn: ${scenarioConfig.churn_multiplier}x (higher = worse)
- CAC: ${scenarioConfig.cac_multiplier}x (higher = worse)
- Impressions: ${scenarioConfig.impressions_multiplier}x
- CPM: ${scenarioConfig.cpm_multiplier}x
- Fill Rate: ${scenarioConfig.fill_rate_multiplier}x
- Platform RevShare Adjustment: ${scenarioConfig.platform_revshare_adjustment}

KEY BENCHMARKS:
- Creator TAM 2027: $${(benchmarkMap['creator_TAM_2027'] / 1e9).toFixed(1)}B
- Podcast Ad CAGR: ${(benchmarkMap['podcast_ad_CAGR'] * 100).toFixed(1)}%
- Host-Read CPM Range: $${benchmarkMap['audio_hostread_CPM_low']}-$${benchmarkMap['audio_hostread_CPM_high']}
- Programmatic CPM Range: $${benchmarkMap['audio_programmatic_CPM_low']}-$${benchmarkMap['audio_programmatic_CPM_high']}
- Video CPM Range: $${benchmarkMap['video_preroll_CPM_low']}-$${benchmarkMap['video_preroll_CPM_high']}
- Audio Fill Rate: ${(benchmarkMap['ad_fill_rate_audio'] * 100).toFixed(0)}%
- Video Fill Rate: ${(benchmarkMap['ad_fill_rate_video'] * 100).toFixed(0)}%
- Ad Slots per Episode: ${benchmarkMap['ad_load_per_episode']}
- Host-Read Creator Share: ${(benchmarkMap['hostread_revshare_creator'] * 100).toFixed(0)}%
- Programmatic Creator Share: ${(benchmarkMap['programmatic_revshare_creator'] * 100).toFixed(0)}%
- Brand Deal Platform Fee: ${(benchmarkMap['brand_deal_revshare_platform'] * 100).toFixed(0)}%
- Pro Subscription ARPU: $${benchmarkMap['subscription_pro_arpu']}
- Business Subscription ARPU: $${benchmarkMap['subscription_business_arpu']}
- Enterprise ARPU: $${benchmarkMap['subscription_enterprise_arpu']}
- Monthly Churn: ${(benchmarkMap['monthly_churn_rate'] * 100).toFixed(1)}%
- CAC: $${benchmarkMap['customer_acquisition_cost']}
- LTV: $${benchmarkMap['customer_lifetime_value']}
- Avg Creator Monthly Listens: ${benchmarkMap['avg_creator_monthly_listens_low']}-${benchmarkMap['avg_creator_monthly_listens_high']}
- Avg Video Views: ${benchmarkMap['avg_video_views_low']}-${benchmarkMap['avg_video_views_high']}
- Newsletter CPM: $${benchmarkMap['newsletter_CPM_avg']}
- Display CPM: $${benchmarkMap['display_CPM_avg']}
- Brand Deal Range: $${benchmarkMap['brand_deal_flat_fee_low']}-$${benchmarkMap['brand_deal_flat_fee_high']}

STARTING ASSUMPTIONS (Year 1):
- Starting Creators: 5,000
- Starting Paid Subscribers: 500
- Starting Ad-Enabled Creators: 250
- Average Episodes/Month: 4

Apply the scenario multipliers to generate realistic projections. For advertising revenue, calculate:
1. Total Impressions = Creator Count × Monthly Listens × Episodes × Ad Slots
2. Monetized Impressions = Total Impressions × Fill Rate
3. Revenue = (Monetized Impressions / 1000) × CPM
4. Platform Share = Revenue × Platform RevShare

Show year-over-year growth aligned with the scenario type. Return ONLY the JSON object.`;

    // Call AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let forecast;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      forecast = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI forecast response');
    }

    // Store forecast in database
    for (const yearData of forecast.years || []) {
      await supabase.from('proforma_forecasts').upsert({
        scenario_key: scenarioKey,
        forecast_year: yearData.year,
        revenue_data: yearData.revenue,
        expense_data: yearData.expenses,
        ad_revenue_breakdown: yearData.revenue?.advertising || {},
        summary_metrics: {
          ebitda: yearData.ebitda,
          ebitdaMargin: yearData.ebitdaMargin,
          creatorCount: yearData.creatorCount,
          subscriberCount: yearData.subscriberCount,
          churnRate: yearData.churnRate,
          cac: yearData.cac,
          ltv: yearData.ltv,
        },
        benchmarks_used: Object.keys(benchmarkMap),
        ai_commentary: forecast.commentary,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'scenario_key,forecast_year',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        scenario: scenarioConfig.label,
        forecast,
        benchmarksUsed: benchmarks?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
