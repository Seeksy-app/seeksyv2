import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { message, context } = await req.json();

    console.log(`Global Agent received: ${message}`);

    // Route to appropriate persona
    const persona = detectPersona(message, context);
    console.log(`Routing to persona: ${persona}`);

    let response;
    switch (persona) {
      case "mia":
        response = await handleMia(message, context, user, supabase);
        break;
      case "castor":
        response = await handleCastor(message, context, user, supabase);
        break;
      case "echo":
        response = await handleEcho(message, context, user, supabase);
        break;
      case "lex":
        response = await handleLex(message, context, user, supabase);
        break;
      case "atlas":
        response = await handleAtlas(message, context, user, supabase);
        break;
      case "reel":
        response = await handleReel(message, context, user, supabase);
        break;
      case "scribe":
        // Call scribe-agent for email tasks
        const scribeResponse = await supabase.functions.invoke("scribe-agent", {
          body: { action: "draft", input: message, context },
        });
        return new Response(
          JSON.stringify(scribeResponse.data),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      default:
        response = await handleGeneral(message, context, user, supabase);
    }

    return new Response(
      JSON.stringify({ success: true, persona, response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Global Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectPersona(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();

  // Context-based routing
  if (context?.route?.includes("/meeting") || context?.route?.includes("/events")) return "mia";
  if (context?.route?.includes("/podcast")) return "castor";
  if (context?.route?.includes("/studio")) return "echo";
  if (context?.route?.includes("/identity") || context?.route?.includes("/certificate")) return "lex";
  if (context?.route?.includes("/email") || context?.route?.includes("/campaign")) return "scribe";
  if (context?.route?.includes("/clips") || context?.route?.includes("/media")) return "reel";
  if (context?.route?.includes("/analytics") || context?.route?.includes("/email-home")) return "atlas";

  // Keyword-based routing
  if (/(meeting|calendar|schedule|event|invitation)/i.test(lowerMessage)) return "mia";
  if (/(podcast|episode|publish|rss|show)/i.test(lowerMessage)) return "castor";
  if (/(studio|recording|broadcast|guest|stream)/i.test(lowerMessage)) return "echo";
  if (/(identity|face|voice|certificate|rights|verify)/i.test(lowerMessage)) return "lex";
  if (/(email|campaign|subject|draft|send|newsletter)/i.test(lowerMessage)) return "scribe";
  if (/(clip|video|social|reel|media|edit)/i.test(lowerMessage)) return "reel";
  if (/(analytics|data|performance|stats|metrics|insights)/i.test(lowerMessage)) return "atlas";

  return "general";
}

async function handleMia(message: string, context: any, user: any, supabase: any) {
  const systemPrompt = `You are Mia, the Meetings & Events Coordinator for Seeksy. You help with:
- Scheduling meetings
- Creating events
- Managing calendar
- Sending invitations
- Drafting follow-up emails

Be friendly, organized, and proactive. Reference upcoming meetings and events when relevant.`;

  return await callAI(systemPrompt, message, context);
}

async function handleCastor(message: string, context: any, user: any, supabase: any) {
  // Fetch user's podcasts for context
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .eq("owner_id", user.id)
    .limit(5);

  const systemPrompt = `You are Castor, the Podcast Production Manager for Seeksy. You help with:
- Publishing podcast episodes
- Writing episode notes and descriptions
- Drafting social media posts
- Suggesting clip moments
- Managing RSS feeds

${podcasts?.length ? `Active podcasts: ${podcasts.map((p: any) => p.title).join(", ")}` : ""}

Be creative, strategic, and audience-focused.`;

  return await callAI(systemPrompt, message, context);
}

async function handleEcho(message: string, context: any, user: any, supabase: any) {
  const systemPrompt = `You are Echo, the Studio Director for Seeksy. You help with:
- Recording guidance and setup
- Guest coordination
- Pre and post-production workflows
- Episode notifications
- Technical studio assistance

Be clear, technical when needed, and supportive. Guide creators through the production process.`;

  return await callAI(systemPrompt, message, context);
}

async function handleLex(message: string, context: any, user: any, supabase: any) {
  // Fetch identity status
  const { data: identityAssets } = await supabase
    .from("identity_assets")
    .select("*")
    .eq("creator_id", user.id);

  const systemPrompt = `You are Lex, the Identity & Rights Guardian for Seeksy. You help with:
- Face and voice verification
- Rights management
- Certificate interpretation
- Licensing compliance
- Identity protection

${identityAssets?.length ? `Identity status: ${identityAssets.length} verified assets` : "No verified identity yet"}

Be protective, clear about legal matters, and educate creators about their rights.`;

  return await callAI(systemPrompt, message, context);
}

async function handleAtlas(message: string, context: any, user: any, supabase: any) {
  // Fetch recent analytics
  const { data: emailEvents } = await supabase
    .from("email_events")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(10);

  const systemPrompt = `You are Atlas, the Data & Analytics Guide for Seeksy. You help with:
- Engagement summaries
- Email performance analysis
- Smart send time recommendations
- Segment insights
- Growth trends

${emailEvents?.length ? `Recent email events: ${emailEvents.length} tracked` : "No email events yet"}

Be data-driven, insightful, and actionable. Provide specific recommendations based on metrics.`;

  return await callAI(systemPrompt, message, context);
}

async function handleReel(message: string, context: any, user: any, supabase: any) {
  // Fetch recent clips
  const { data: clips } = await supabase
    .from("clips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const systemPrompt = `You are Reel, the Clips & Media Assistant for Seeksy. You help with:
- Clip naming and descriptions
- Social media scriptwriting
- Thumbnail ideas
- Content repurposing
- Platform-specific optimization

${clips?.length ? `Recent clips: ${clips.length} created` : "No clips yet"}

Be creative, platform-savvy, and focused on engagement. Think like a social media expert.`;

  return await callAI(systemPrompt, message, context);
}

async function handleGeneral(message: string, context: any, user: any, supabase: any) {
  const systemPrompt = `You are the Seeksy AI Assistant. You help creators with all aspects of the platform:
- Meetings & Events (Mia specializes in this)
- Podcast Production (Castor handles this)
- Studio Recording (Echo's expertise)
- Identity & Rights (Lex covers this)
- Email & Communications (Scribe manages this)
- Clips & Media (Reel focuses here)
- Analytics & Data (Atlas analyzes this)

Provide helpful, concise guidance and direct users to specialized personas when appropriate.`;

  return await callAI(systemPrompt, message, context);
}

async function callAI(systemPrompt: string, userMessage: string, context: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
