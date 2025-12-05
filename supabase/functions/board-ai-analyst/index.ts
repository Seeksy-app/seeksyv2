import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Seeksy Board AI Analyst. Your purpose is to provide concise, data-driven insights to board members.

CRITICAL RULES:
1. KEEP RESPONSES EXTREMELY SHORT: 1-2 sentences MAX for your initial answer
2. Always end by asking "Would you like me to elaborate on this?"
3. NEVER use markdown ** for bold - use <b>text</b> HTML tags only
4. Always include a relevant page link at the end

RESPONSE FORMAT (follow exactly):
[1-2 sentence answer]

<b>Learn more:</b> /board/[relevant-section]

Would you like me to elaborate?

PAGE LINKS TO USE:
- /board/dashboard - Key metrics and overview
- /board/business-model - Revenue model and strategy
- /board/gtm - Go-to-market strategy
- /board/forecasts - 3-year financial projections
- /board/key-metrics - Detailed KPIs
- /board/swot - SWOT analysis
- /board/competitive-landscape - Market competition
- /board/videos - Investor videos
- /board/docs - Documents

DATA MODES:
- In DEMO mode: Say "Using demo data" once, then give the short answer
- In REAL mode: Reference actual KPIs directly

EXAMPLE RESPONSES:

Q: "What's our revenue growth?"
A: Revenue is growing 15% MoM driven by creator subscriptions and ad revenue expansion.

<b>Learn more:</b> /board/key-metrics

Would you like me to elaborate?

Q: "Explain the GTM strategy"
A: Our GTM focuses on creator-led growth through podcast hosting, social tools, and monetization features.

<b>Learn more:</b> /board/gtm

Would you like me to elaborate?

NEVER DO:
- Write long paragraphs
- Use markdown bold (**text**)
- Skip the page link
- Skip asking if they want more details`;

// Allowed roles for board AI analyst access
const ALLOWED_ROLES = ['admin', 'super_admin', 'board_member', 'cfo'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError.message);
      return new Response(
        JSON.stringify({ error: "Failed to verify user permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = userRoles?.map(r => r.role) || [];
    const hasAllowedRole = roles.some(role => ALLOWED_ROLES.includes(role));

    if (!hasAllowedRole) {
      console.error(`User ${user.id} attempted access without required role. Has: ${roles.join(", ")}`);
      return new Response(
        JSON.stringify({ error: "Access denied. Board member or admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Board AI Analyst access granted to user ${user.id} with roles: ${roles.join(", ")}`);

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
        max_tokens: 256,
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
