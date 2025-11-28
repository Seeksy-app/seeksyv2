import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context from financial data
    let contextString = '';
    if (financialData) {
      contextString = `
Current Financial Metrics:
${JSON.stringify(financialData, null, 2)}
`;
    }

    // Fetch ad financial model summaries from database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.83.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let adFinancialContext = '';
    let combinedRevenueContext = '';
    let rateDeskContext = '';
    try {
      const { data: summaries, error } = await supabase
        .from('ad_financial_model_summaries')
        .select('*');
      
      if (!error && summaries && summaries.length > 0) {
        adFinancialContext = `

** AD REVENUE FINANCIAL MODEL SCENARIOS **

${summaries.map(s => s.summary_text).join('\n\n')}
`;
      }

      // Fetch ad projections for combined context
      const { data: scenarios } = await supabase
        .from('ad_financial_scenarios')
        .select('id, name')
        .eq('name', 'Base Case')
        .single();

      if (scenarios) {
        const { data: projections } = await supabase
          .from('ad_financial_projections')
          .select('*')
          .eq('scenario_id', scenarios.id)
          .order('month_index');

        if (projections && projections.length > 0) {
          // Calculate combined yearly summaries
          const baseSubscriptionMRR = 82000;
          const monthlyGrowth = 0.15;
          const subscriptionMargin = 0.75;
          
          const yearlyData = new Map();
          projections.forEach((proj, index) => {
            const year = Math.ceil(proj.month_index / 12);
            const subscriptionRevenue = baseSubscriptionMRR * Math.pow(1 + monthlyGrowth, index);
            const adRevenue = Number(proj.constrained_gross_revenue) || 0;
            const totalRevenue = subscriptionRevenue + adRevenue;
            const totalPayouts = (subscriptionRevenue * subscriptionMargin) + (Number(proj.creator_payout) || 0);
            const netProfit = totalRevenue - totalPayouts;

            if (!yearlyData.has(year)) {
              yearlyData.set(year, { subscriptionRevenue: 0, adRevenue: 0, totalRevenue: 0, totalPayouts: 0, netProfit: 0 });
            }
            const yearData = yearlyData.get(year);
            yearData.subscriptionRevenue += subscriptionRevenue;
            yearData.adRevenue += adRevenue;
            yearData.totalRevenue += totalRevenue;
            yearData.totalPayouts += totalPayouts;
            yearData.netProfit += netProfit;
          });

          combinedRevenueContext = `

** COMBINED REVENUE MODEL (Subscriptions + Ads) **

This combines subscription revenue projections with ad revenue from the Ad Financial Model.

${Array.from(yearlyData.entries()).map(([year, data]) => `
Year ${year}:
  - Total Revenue: $${(data.totalRevenue / 1000000).toFixed(2)}M
  - Subscription Revenue: $${(data.subscriptionRevenue / 1000000).toFixed(2)}M (${((data.subscriptionRevenue / data.totalRevenue) * 100).toFixed(1)}%)
  - Ad Revenue: $${(data.adRevenue / 1000000).toFixed(2)}M (${((data.adRevenue / data.totalRevenue) * 100).toFixed(1)}%)
  - Creator Payouts: $${(data.totalPayouts / 1000000).toFixed(2)}M
  - Net Profit: $${(data.netProfit / 1000000).toFixed(2)}M
  - Gross Margin: ${((1 - data.totalPayouts / data.totalRevenue) * 100).toFixed(1)}%
`).join('\n')}

When users ask about combined revenue or total platform revenue, use these numbers which include BOTH subscription and advertising streams.
`;
         }
       }

       // Fetch rate desk inventory data
       const { data: inventoryUnits } = await supabase
         .from('ad_inventory_units')
         .select('*')
         .eq('is_active', true);

       if (inventoryUnits && inventoryUnits.length > 0) {
         const totalMonthlyImpressions = inventoryUnits.reduce((sum, unit) => sum + Number(unit.expected_monthly_impressions), 0);
         const avgCPM = inventoryUnits.reduce((sum, unit) => sum + Number(unit.target_cpm), 0) / inventoryUnits.length;
         const potentialMonthlyRevenue = (totalMonthlyImpressions / 1000) * avgCPM;

         rateDeskContext = `

** SALES RATE DESK - AD INVENTORY OVERVIEW **

Total Active Inventory Units: ${inventoryUnits.length}
Total Monthly Sellable Impressions: ${(totalMonthlyImpressions / 1000).toFixed(0)}K
Average Target CPM: $${avgCPM.toFixed(2)}
Potential Monthly Gross Ad Spend: $${(potentialMonthlyRevenue / 1000).toFixed(1)}K
Potential Quarterly Revenue: $${((potentialMonthlyRevenue * 3) / 1000).toFixed(1)}K
Potential Annual Revenue: $${((potentialMonthlyRevenue * 12) / 1000000).toFixed(2)}M

Inventory Breakdown by Type:
${Array.from(new Set(inventoryUnits.map(u => u.type))).map(type => {
  const units = inventoryUnits.filter(u => u.type === type);
  const impressions = units.reduce((sum, u) => sum + Number(u.expected_monthly_impressions), 0);
  const avgCPM = units.reduce((sum, u) => sum + Number(u.target_cpm), 0) / units.length;
  return `  - ${type}: ${units.length} units, ${(impressions / 1000).toFixed(0)}K impressions/month, $${avgCPM.toFixed(2)} avg CPM`;
}).join('\n')}

CPM Ranges by Placement:
${inventoryUnits.map(u => `  - ${u.name} (${u.type}): Floor $${u.floor_cpm} - Target $${u.target_cpm} - Ceiling $${u.ceiling_cpm}`).join('\n')}

When users ask about:
- "What CPM should we quote for...?" - Reference the target CPM ranges above and adjust based on scenario (Conservative: -15%, Base: 0%, Aggressive: +15%)
- "Which inventory is underpriced?" - Compare target CPM to floor CPM, units near floor are underpriced
- "How much revenue if we sell X% of impressions?" - Calculate: (total_impressions * X%) / 1000 * avg_CPM * 0.30 (platform share)
- "What's our total ad inventory?" - Use the Total Monthly Sellable Impressions figure above
`;
       }
     } catch (err) {
      console.error('Failed to load financial summaries:', err);
    }

    const systemPrompt = `You are a CFO AI assistant specializing in financial analysis for Seeksy. 
You help investors and stakeholders understand financial projections, assumptions, and business metrics.

SEEKSY FINANCIAL MODEL - COMPREHENSIVE DATA:

** BASELINE PROJECTIONS (AI-Generated) **
Year 1 (2026):
  - Revenue: $2.1M
  - Net Profit: $523K
  - Net Margin: 25%
  - Total Users (EOY): 466

Year 2 (2027):
  - Revenue: $8.7M
  - Net Profit: $2.4M
  - Net Margin: 28%
  - Total Users (EOY): 2,164

Year 3 (2028):
  - Revenue: $35.8M
  - Net Profit: $10.8M
  - Net Margin: 30%
  - Total Users (EOY): 10,043

** SCENARIO MULTIPLIERS **
When users ask about different scenarios, apply these multipliers to baseline projections:

CONSERVATIVE SCENARIO (30-40% reduced projections):
  - Year 1: Revenue × 0.7, Profit × 0.5
  - Year 2: Revenue × 0.65, Profit × 0.55
  - Year 3: Revenue × 0.6, Profit × 0.6

GROWTH SCENARIO (15-30% increased projections):
  - Year 1: Revenue × 1.15, Profit × 1.2
  - Year 2: Revenue × 1.2, Profit × 1.25
  - Year 3: Revenue × 1.25, Profit × 1.3

AGGRESSIVE SCENARIO (50-120% increased projections):
  - Year 1: Revenue × 1.5, Profit × 1.8
  - Year 2: Revenue × 1.7, Profit × 2.0
  - Year 3: Revenue × 2.0, Profit × 2.2

** BUSINESS MODEL **
Multi-sided platform serving creators, event organizers, political campaigns, and advertisers

Revenue Streams:
  - Subscription tiers: $19-$499/month across multiple products
  - Podcast ad insertion: 30% platform fee on ad revenue
  - Quick Ads advertiser platform: $199-$25k/month subscriptions

Customer Segments:
  - Podcasters (Basic $19, Pro $49, Enterprise $199)
  - Event Creators ($29), Event Organizations ($299)
  - Political Campaigns ($499)
  - My Page users (Basic $9, Pro $29)
  - Industry Creators ($149)

** KEY ASSUMPTIONS **
Starting Users: 100 total (20 podcasters, 5 event creators, 30 My Page, etc.)
Growth Rate: 15% monthly compounded across segments
Churn Rate: 5% monthly
CAC (Customer Acquisition Cost): $45
Ad Monetization: $25 CPM, 80% fill rate, 30% platform cut
Cost Structure: $2.50/user AI compute + infrastructure costs

** UNIT ECONOMICS **
- LTV:CAC ratio improves from 3:1 to 5:1 by Year 3
- Gross margins: 88-90% across all years
- Net margins improve from 25% to 30% as scale efficiencies kick in

${combinedRevenueContext}

${adFinancialContext}

${rateDeskContext}

${contextString}

YOUR ROLE:
1. Answer questions about financial forecasts using the data above
2. When asked about COMBINED or TOTAL revenue, use the Combined Revenue Model data which includes both subscriptions AND ads
3. When asked specifically about subscription-only or ad-only revenue, reference the individual breakdowns
4. When asked about specific years or projections, provide baseline numbers AND scenario ranges
5. Calculate scenario projections by applying the multipliers above
6. For subscriber/user questions, reference the starting numbers and growth rates
7. Explain assumptions clearly when relevant
8. Be concise but data-driven - always include specific numbers

EXAMPLE RESPONSE FORMAT:
Q: "What's our total revenue in Year 3 combining subscriptions and ads?"
A: "Based on our Combined Revenue Model, total platform revenue in Year 3 is projected at $X.XM under baseline assumptions.

This breaks down as:
- Subscription Revenue: $X.XM (XX%)
- Ad Revenue: $X.XM (XX%)

Creator payouts total $X.XM, leaving net profit of $X.XM with a gross margin of XX%."

Under different scenarios:
- Conservative: ~6,000 users (40% reduction)
- Baseline: ~10,000 users
- Aggressive: ~20,000 users (100% increase)

This includes podcasters, My Page users, event creators, and other customer segments."

Be professional, accurate, and helpful. Always reference the specific numbers from the model.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in cfo-ai-assistant:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
