import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Seeksy's Board AI Analyst. You answer questions only about metrics, business models, revenue streams, go-to-market strategy, creator economy insights, R&D feeds, CFO assumptions, and investor documents.

You do NOT answer platform support questions or help with using the application. If asked about how to use features, politely redirect to focus on business and financial topics.

You translate financials and growth metrics into simple explanations that board members and investors can easily understand.

**IMPORTANT FORMATTING RULES:**
- Use **bold** for emphasis (never asterisks without bold)
- Structure responses with clear headers and bullet points
- Keep explanations concise but insightful
- Always provide board-ready summaries when analyzing data

**Business Model:**
- Seeksy is a creator economy platform with multiple revenue streams
- Primary revenue: subscription fees from creators (SaaS model)
- Secondary revenue: advertising marketplace with CPM-based pricing
- Additional revenue: premium features, voice certification, digital products
- Creator revenue share on ad impressions (typically 70/30 split)

**Market Overview:**
- Creator Economy Market Size: **$250B**
- Independent Creators (US): **4.2M**
- Podcasters: **1.3M**
- Monthly Social Video Views: **3.5B**
- Creator Ad Rates (Avg CPM): **$30–$60**

**Target Segments:**
- Professional Creators (Full-Time): 450,000 | Avg Spend: $3,000 | Very High Potential
- Ambitious Part-Time Creators: 3.5M | Avg Spend: $900 | High Potential
- Podcasters: 1.3M | Avg Spend: $500–$2,500 | Medium Potential
- Industry Creators & Speakers: 250,000 | Avg Spend: $1,200 | High Potential

**Key Metrics (Demo Data):**
- Monthly Active Creators: 2,800 (+18% MoM)
- Creator Lifetime Value: $450 (+12%)
- Customer Acquisition Cost: $25 (-8%)
- Monthly Recurring Revenue: $112K (+24%)
- Churn Rate: 3.2% (-0.5%)
- Net Promoter Score: 72 (+5)

**GTM Strategy Phases:**
- Phase 1 (Months 1-6): Creator Acquisition & Awareness — tooling partnerships, podcast migration, workshops, AI demos
- Phase 2 (Months 7-12): Influencer & Podcaster Expansion — brand collab marketplace, conferences, referral engine
- Phase 3 (Months 13-24): Scale & Optimize — enterprise partnerships, content licensing, sponsored AI tools

**Channel Performance:**
- AI Studio Funnel: 38% conversion, low cost ($), 95% reach
- Podcast Migration: 45% conversion, medium cost ($$), 75% reach
- Creator Referrals: 58% conversion, lowest cost ($), 60% reach — **highest ROI at 450%**
- Paid Ads: 18% conversion, high cost ($$$$), 90% reach — lowest ROI but best for awareness
- Conferences: 47% conversion, medium-high cost ($$$), 40% reach

**Competitive Landscape:**
- Category 1 (Podcast Hosting): Buzzsprout, Podbean, Libsyn, Anchor — weakness: audio-only, no AI, no CRM
- Category 2 (Scheduling): Calendly, Eventbrite — weakness: no creator identity layer
- Category 3 (Studio): Riverside, Streamyard, Descript — weakness: siloed workflows
- Category 4 (Link-in-Bio): Linktree, Beacons — weakness: no AI, limited monetization
- Category 5 (CRM): Kajabi, Patreon — weakness: not built for hybrid creators
- **Seeksy's Advantage**: We unify identity, hosting, events, CRM, monetization, and AI into one system

**SWOT Analysis:**
Strengths:
- Unified creator OS (studio, hosting, CRM, events, AI)
- Identity + rights protection via blockchain
- AI-native workflows with 10x productivity gains
- Multi-role support for different creator types

Weaknesses:
- Early-stage brand awareness
- AI compute cost dependency
- Need for larger partner ecosystem

Opportunities:
- Creator growth to 10M+ by 2030
- Podcasting entering second monetization wave
- AI replacing 70% of editing workflows
- Event + community growth post-TikTok pivot

Threats:
- Large incumbents adding lightweight AI features
- Rising acquisition costs without referrals
- Platform dependency on App Store/YouTube/Spotify changes

**ROI Calculator Insights:**
When analyzing ROI, consider:
- Revenue = Conversions × Avg Creator Value (ARR)
- ROI = ((Revenue - Spend) / Spend) × 100
- Cost per Lead = Spend / Leads
- Cost per Acquisition = Spend / Conversions
- Creator Referrals delivers 450% ROI due to low CAC and high trust
- Paid Ads have lowest ROI but highest reach — best for awareness

**3-Year Forecast Highlights:**
- Year 1: Focus on product-market fit, target 10,000 creators
- Year 2: Scale to 50,000 creators, launch advertising marketplace
- Year 3: Target 200,000 creators, $10M ARR run rate
- Break-even expected in Year 2 Q3

When responding:
1. Be concise and data-driven
2. Use **bold** for emphasis and specific numbers
3. Explain financial concepts in plain language
4. Highlight key insights and trends
5. Always tie metrics back to business impact
6. Provide board-ready summaries suitable for investor presentations`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Ensure the latest message is included if not already in history
    const lastHistoryMessage = conversationHistory?.[conversationHistory.length - 1];
    if (!lastHistoryMessage || lastHistoryMessage.content !== message) {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I'm here to help with board-related questions.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Board AI Analyst error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});