import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KBArticle {
  title: string;
  content: string;
  category: string;
  source_name: string | null;
}

// Fetch relevant KB articles based on user query
async function getRelevantKBContext(query: string, supabaseUrl: string, serviceKey: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Simple keyword matching for now - could be enhanced with embeddings later
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Search for relevant articles
    const { data, error } = await supabase
      .from('veteran_kb_articles')
      .select('title, content, category, source_name')
      .eq('is_published', true)
      .limit(5);

    if (error || !data || data.length === 0) {
      console.log("No KB articles found or error:", error);
      return "";
    }

    const articles = data as KBArticle[];

    // Score articles by keyword relevance
    const scoredArticles = articles.map(article => {
      const text = `${article.title} ${article.content}`.toLowerCase();
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score++;
      });
      return { ...article, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

    if (scoredArticles.length === 0) {
      // If no keyword matches, return general DAV info
      const davArticle = articles.find(a => a.category === 'organization' || a.category === 'claims');
      if (davArticle) {
        return `\n\nREFERENCE KNOWLEDGE (from ${davArticle.source_name || 'DAV'}):\n${davArticle.content.slice(0, 1500)}`;
      }
      return "";
    }

    const contextParts = scoredArticles.map(article => 
      `### ${article.title} (Source: ${article.source_name || 'DAV'})\n${article.content.slice(0, 1200)}`
    );

    return `\n\nREFERENCE KNOWLEDGE (use this to inform your responses):\n${contextParts.join('\n\n')}`;
  } catch (error) {
    console.error("Error fetching KB context:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the latest user message for KB search
    const latestUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    const userQuery = latestUserMessage?.content || "";

    // Fetch relevant KB context
    let kbContext = "";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userQuery) {
      kbContext = await getRelevantKBContext(userQuery, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    // Enhance system prompt with KB context
    const enhancedPrompt = systemPrompt + kbContext + `

IMPORTANT: When answering questions, reference the knowledge base information above when relevant. 
You can mention "According to DAV..." or "The Disabled American Veterans organization..." when citing information.
If asked about specific resources, direct them to dav.org or their local DAV office.`;

    console.log("Sending request to Lovable AI with", messages.length, "messages", kbContext ? "(with KB context)" : "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    console.log("Successfully received response from AI");

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("veteran-claims-chat error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
