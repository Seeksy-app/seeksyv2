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

${contextString}

YOUR ROLE:
1. Answer questions about financial forecasts using the data above
2. When asked about specific years or projections, provide baseline numbers AND scenario ranges
3. Calculate scenario projections by applying the multipliers above
4. For subscriber/user questions, reference the starting numbers and growth rates
5. Explain assumptions clearly when relevant
6. Be concise but data-driven - always include specific numbers

EXAMPLE RESPONSE FORMAT:
Q: "How many subscribers in 2028?"
A: "Based on our projections, we estimate approximately 10,000 total users by end of 2028 under baseline assumptions (15% monthly growth, 5% churn). 

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
