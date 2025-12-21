import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricsContext {
  gsc?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  } | null;
  ga4?: {
    users?: number;
    sessions?: number;
    views?: number;
    engagementRate?: number;
  } | null;
}

interface BaselineContext {
  gsc?: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
    captured_at?: string;
  } | null;
  ga4?: {
    users?: number;
    sessions?: number;
    captured_at?: string;
  } | null;
}

interface RequestBody {
  seo_page_id: string;
  context: {
    page_name: string;
    route_path: string;
    baseline?: BaselineContext | null;
    metrics_7d?: MetricsContext | null;
    metrics_28d?: MetricsContext | null;
    gbp_location_id?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin access
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some((r) => r.role === "admin" || r.role === "super_admin")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { seo_page_id, context } = body;

    if (!seo_page_id || !context) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build analysis prompt
    const prompt = buildAnalysisPrompt(context);

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Seeksy Spark, an SEO performance analyst for a website.

Your job:
- Explain why a page's performance changed using ONLY the provided metrics and context.
- Never invent facts (no guessing about algorithm updates, indexing, competitors, or seasonality unless the data strongly supports it).
- Be concise, practical, and non-technical when possible.
- If the data is missing or insufficient, say so and recommend the single best next diagnostic step.

Hard rules:
- Output MUST be valid JSON and match the provided JSON schema.
- Do not include markdown.
- Do not include any personally identifying information.
- Do not reference private prompts, hidden policies, or internal tool names.
- If you are uncertain, label it explicitly as a hypothesis and explain what evidence would confirm it.

Focus:
- Compare 7d vs 28d, and baseline deltas when available.
- Use GSC metrics (clicks, impressions, CTR, position) to reason about search behavior.
- Use GA4 metrics (users, sessions, views, engagement rate) to reason about onsite behavior.
- If GBP context is provided (reviews, business description, categories), use it only as supporting context, not primary causation.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "explain_performance_change",
              description: "Provide structured explanation of SEO performance changes",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of what changed"
                  },
                  likely_causes: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 likely causes for the changes"
                  },
                  recommended_actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 specific actions to take"
                  }
                },
                required: ["summary", "likely_causes", "recommended_actions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "explain_performance_change" } },
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[seo-ai-explain-change] AI error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    
    // Extract result from tool call
    let result;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("[seo-ai-explain-change] Failed to parse:", e);
        return new Response(JSON.stringify({ error: "AI returned invalid response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try {
          result = JSON.parse(content);
        } catch {
          // Return a basic response
          result = {
            summary: content.substring(0, 300),
            likely_causes: ["Unable to determine specific causes"],
            recommended_actions: ["Review page content and technical SEO"]
          };
        }
      } else {
        return new Response(JSON.stringify({ error: "AI returned empty response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[seo-ai-explain-change] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildAnalysisPrompt(context: RequestBody['context']): string {
  const parts: string[] = [];
  
  parts.push(`Page: ${context.page_name} (${context.route_path})`);
  parts.push("");

  if (context.baseline) {
    parts.push("BASELINE (first recorded metrics):");
    if (context.baseline.gsc) {
      parts.push(`  GSC - Clicks: ${context.baseline.gsc.clicks ?? 'N/A'}, Impressions: ${context.baseline.gsc.impressions ?? 'N/A'}, CTR: ${context.baseline.gsc.ctr?.toFixed(2) ?? 'N/A'}%, Position: ${context.baseline.gsc.position?.toFixed(1) ?? 'N/A'}`);
    }
    if (context.baseline.ga4) {
      parts.push(`  GA4 - Users: ${context.baseline.ga4.users ?? 'N/A'}, Sessions: ${context.baseline.ga4.sessions ?? 'N/A'}`);
    }
    parts.push("");
  }

  if (context.metrics_7d) {
    parts.push("LAST 7 DAYS:");
    if (context.metrics_7d.gsc) {
      parts.push(`  GSC - Clicks: ${context.metrics_7d.gsc.clicks ?? 'N/A'}, Impressions: ${context.metrics_7d.gsc.impressions ?? 'N/A'}, CTR: ${context.metrics_7d.gsc.ctr?.toFixed(2) ?? 'N/A'}%, Position: ${context.metrics_7d.gsc.position?.toFixed(1) ?? 'N/A'}`);
    }
    if (context.metrics_7d.ga4) {
      parts.push(`  GA4 - Users: ${context.metrics_7d.ga4.users ?? 'N/A'}, Sessions: ${context.metrics_7d.ga4.sessions ?? 'N/A'}`);
    }
    parts.push("");
  }

  if (context.metrics_28d) {
    parts.push("LAST 28 DAYS:");
    if (context.metrics_28d.gsc) {
      parts.push(`  GSC - Clicks: ${context.metrics_28d.gsc.clicks ?? 'N/A'}, Impressions: ${context.metrics_28d.gsc.impressions ?? 'N/A'}, CTR: ${context.metrics_28d.gsc.ctr?.toFixed(2) ?? 'N/A'}%, Position: ${context.metrics_28d.gsc.position?.toFixed(1) ?? 'N/A'}`);
    }
    if (context.metrics_28d.ga4) {
      parts.push(`  GA4 - Users: ${context.metrics_28d.ga4.users ?? 'N/A'}, Sessions: ${context.metrics_28d.ga4.sessions ?? 'N/A'}`);
    }
    parts.push("");
  }

  parts.push("Analyze these metrics and explain:");
  parts.push("1. What significant changes occurred?");
  parts.push("2. What are the likely causes?");
  parts.push("3. What specific actions should be taken?");

  return parts.join("\n");
}
