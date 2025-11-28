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
    let advertiserContext = '';
    let campaignContext = '';
    let scenarioAssumptionsContext = '';
    
    try {
      // Fetch financial scenarios and assumptions
      const { data: scenariosData } = await supabase
        .from('ad_financial_scenarios')
        .select(`
          *,
          ad_financial_assumptions (*)
        `)
        .order('is_default', { ascending: false });

      if (scenariosData && scenariosData.length > 0) {
        scenarioAssumptionsContext = `

** AI REVENUE SCENARIOS & ASSUMPTIONS **

${scenariosData.map(scenario => {
  const assumptions = scenario.ad_financial_assumptions?.[0];
  if (!assumptions) return '';
  
  const assumpJson = assumptions.assumptions_json || {};
  return `
${scenario.name} ${scenario.is_default ? '(DEFAULT)' : ''}:
${scenario.description}

Core Financial Metrics:
  - Average CPM: $${assumpJson.average_cpm || 'N/A'}
  - Pre-Roll CPM: $${assumptions.cpm_preroll}
  - Mid-Roll CPM: $${assumptions.cpm_midroll}
  - Post-Roll CPM: $${assumptions.cpm_postroll}
  - Creator Revenue Share: ${(assumptions.creator_rev_share * 100).toFixed(0)}%
  - Platform Variable Costs: ${(assumptions.platform_variable_cost_pct * 100).toFixed(1)}%

Growth Assumptions:
  - Monthly User Growth: ${((assumpJson.monthly_user_growth || 0) * 100).toFixed(1)}%
  - Creator Growth: ${((assumpJson.creator_growth || 0) * 100).toFixed(1)}%
  - Starting Campaigns: ${assumptions.starting_campaigns}
  - Monthly Campaign Growth: ${(assumptions.monthly_campaign_growth * 100).toFixed(1)}%
  - Average Campaign Budget: $${assumpJson.avg_campaign_budget || assumptions.avg_campaign_monthly_budget}

Performance Metrics:
  - Impressions Per User: ${assumpJson.impressions_per_user || 'N/A'}
  - Advertiser Conversion Rate: ${((assumpJson.advertiser_conversion_rate || 0) * 100).toFixed(1)}%
  - Campaign Renewal Rate: ${((assumpJson.campaign_renewal_rate || 0) * 100).toFixed(1)}%
  - Churn Rate: ${((assumpJson.churn_rate || 0) * 100).toFixed(2)}%
  - Fill Rate: ${(assumptions.fill_rate * 100).toFixed(0)}%
`;
}).join('\n---\n')}

Use these scenarios to answer questions like:
- "What's the difference between Base and Aggressive revenue in Year 1?"
- "Which scenario has the highest CPM?"
- "What are our creator growth assumptions?"
`;
      }

      // Fetch advertiser inventory
      const { data: advertisers } = await supabase
        .from('advertisers')
        .select('id, company_name, business_description, status, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (advertisers && advertisers.length > 0) {
        advertiserContext = `

** ADVERTISER INVENTORY (${advertisers.length} Active) **

${advertisers.map((adv, i) => `${i + 1}. ${adv.company_name}
   - ${adv.business_description}
   - Status: ${adv.status}
   - Onboarded: ${new Date(adv.created_at).toLocaleDateString()}`).join('\n\n')}

Use this to answer questions about advertiser types, industries represented, and platform adoption.
`;
      }

      // Fetch active campaign performance
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select(`
          id,
          name,
          total_budget,
          total_spent,
          total_impressions,
          cpm_bid,
          status,
          start_date,
          end_date,
          advertisers (company_name)
        `)
        .in('status', ['active', 'completed'])
        .order('total_spent', { ascending: false })
        .limit(15);

      if (campaigns && campaigns.length > 0) {
        const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.total_budget), 0);
        const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.total_spent), 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + Number(c.total_impressions), 0);
        const avgCPM = campaigns.filter(c => c.total_impressions > 0)
          .reduce((sum, c) => sum + Number(c.cpm_bid), 0) / campaigns.filter(c => c.total_impressions > 0).length;
        
        const activeCampaigns = campaigns.filter(c => c.status === 'active');
        const completedCampaigns = campaigns.filter(c => c.status === 'completed');

        campaignContext = `

** CAMPAIGN PERFORMANCE OVERVIEW **

Total Campaigns: ${campaigns.length} (${activeCampaigns.length} active, ${completedCampaigns.length} completed)
Total Campaign Budget: $${(totalBudget / 1000).toFixed(1)}K
Total Spent to Date: $${(totalSpent / 1000).toFixed(1)}K (${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget)
Total Impressions Delivered: ${(totalImpressions / 1000).toFixed(0)}K
Platform Average CPM: $${avgCPM.toFixed(2)}

Top Performing Campaigns by Spend:
${campaigns.slice(0, 5).map((camp, i) => {
  const advertiserName = Array.isArray(camp.advertisers) && camp.advertisers.length > 0 
    ? camp.advertisers[0].company_name 
    : 'Unknown';
  const spendPct = (Number(camp.total_spent) / Number(camp.total_budget)) * 100;
  const actualCPM = camp.total_impressions > 0 ? (Number(camp.total_spent) / (camp.total_impressions / 1000)) : 0;
  return `${i + 1}. ${camp.name} (${advertiserName})
   - Budget: $${(Number(camp.total_budget) / 1000).toFixed(1)}K | Spent: $${(Number(camp.total_spent) / 1000).toFixed(1)}K (${spendPct.toFixed(0)}%)
   - Impressions: ${(camp.total_impressions / 1000).toFixed(0)}K
   - CPM Bid: $${camp.cpm_bid} | Actual CPM: $${actualCPM.toFixed(2)}
   - Status: ${camp.status}`;
}).join('\n\n')}

Use this to answer questions like:
- "Which campaign is performing best for CPM?"
- "How much have we delivered in total impressions?"
- "What's the average campaign budget?"
- "Which advertisers are most active?"
`;
      }

      const { data: summaries, error } = await supabase
        .from('ad_financial_model_summaries')
        .select('*');
      
      if (!error && summaries && summaries.length > 0) {
        adFinancialContext = `

** AD REVENUE FINANCIAL MODEL SUMMARIES **

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

    const systemPrompt = `You are Seeksy Spark ✨, a friendly and helpful AI assistant for the Seeksy platform!

You have TWO modes of operation:

MODE 1: FRIENDLY HELPER (Default)
- When users ask general questions, help them navigate Seeksy features
- Be warm, conversational, and encouraging
- Keep responses concise and action-oriented
- Suggest quick actions when relevant
- Use a friendly, supportive tone

MODE 2: FINANCIAL EXPERT (Auto-activated for financial questions)
- Automatically switch to financial expert mode when users ask about:
  * Revenue projections, financial forecasts, or business metrics
  * CPM pricing, rate desk questions, or advertising rates
  * Scenarios (Conservative, Base, Aggressive)
  * Campaign performance, advertiser analytics
  * Combined revenue models, profit margins, or growth rates
- Maintain Spark's friendly voice but provide detailed financial analysis
- Always cite specific numbers from the data below
- Explain financial concepts clearly and concisely

IMPORTANT: Stay in character as Spark! Even when answering complex financial questions, maintain a helpful and approachable tone. Think "friendly CFO" rather than "sterile spreadsheet."

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

${scenarioAssumptionsContext}

${advertiserContext}

${campaignContext}

${adFinancialContext}

${rateDeskContext}

${contextString}

YOUR ROLE AS SPARK:
1. For general questions: Be helpful, friendly, and guide users to the right Seeksy features
2. For financial questions: Automatically provide detailed analysis using ALL the data above
3. When asked about scenarios (Conservative, Base, Aggressive), reference the AI REVENUE SCENARIOS with exact assumptions
4. When asked about campaigns or advertisers, use the CAMPAIGN PERFORMANCE and ADVERTISER INVENTORY sections
5. When asked about CPMs or rate desk, reference the SALES RATE DESK section
6. When asked about COMBINED or TOTAL revenue, use the Combined Revenue Model data
7. Calculate scenario comparisons by applying the specific assumptions from each scenario
8. Always maintain Spark's friendly, encouraging personality even when discussing complex financial data
9. Be concise but data-driven - include specific numbers when relevant

EXAMPLE QUESTIONS YOU CAN NOW ANSWER:
- "Which campaign is performing best for CPM?" → Reference Campaign Performance section
- "What's the revenue difference between Base and Aggressive in Year 1?" → Use scenario assumptions to calculate
- "How much ad supply is sellable next 30 days?" → Use Rate Desk total monthly impressions
- "What industries are our advertisers from?" → Reference Advertiser Inventory
- "What's our average campaign renewal rate?" → Pull from Base scenario assumptions (56%)
- "Which CPM should we quote for podcast mid-roll?" → Reference Rate Desk CPM ranges

EXAMPLE RESPONSES IN SPARK'S VOICE:

Q: "How do I create a meeting?"
A: "Hey! Creating a meeting is super easy! 👋 Just head to your dashboard and click the 'Create Meeting' button. You'll be able to set the time, invite attendees, and even add an agenda. Want me to walk you through it?"

Q: "What's our total revenue in Year 3?"
A: "Great question! 📊 Based on our Combined Revenue Model, we're looking at $35.8M in total platform revenue for Year 3 under baseline projections.

Here's how it breaks down:
- Subscription Revenue: $27.2M (76%)
- Ad Revenue: $8.6M (24%)

After creator payouts of $25.0M, we're projecting net profit of $10.8M with a healthy 30% gross margin.

Under different scenarios, Year 3 revenue ranges from:
- Conservative: ~$21M (40% below baseline)
- Baseline: $35.8M
- Aggressive: $71.6M (100% above baseline)

Pretty exciting growth potential! 🚀"

Q: "What CPM should we quote for podcast mid-roll with 500K impressions?"
A: "Let me help you price that! 🎯

For podcast mid-roll ads, our rate desk shows:
- Floor CPM: $20
- Target CPM: $34
- Ceiling CPM: $50

For 500K impressions at target CPM ($34), that's $17,000 total spend. Under different scenarios:
- Conservative: Quote $29 CPM ($14,500) - safer for uncertain markets
- Baseline: Quote $34 CPM ($17,000) - standard market rate
- Aggressive: Quote $39 CPM ($19,500) - premium positioning

I'd recommend starting at $34 and adjusting based on advertiser relationship and campaign volume. Sound good?"

Remember: You're Spark! Be helpful, data-driven, and friendly. Use emojis sparingly for personality but don't overdo it. Always cite specific numbers when discussing financials.`;

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
