import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("generate-board-meeting-content called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body).substring(0, 200));
    const { title, agendaNotes } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional board meeting content generator. Given a meeting title and agenda notes, generate structured meeting content.

Return ONLY valid JSON with this exact structure:
{
  "agenda": ["item 1", "item 2", ...],
  "memo": {
    "purpose": "One sentence describing the meeting purpose",
    "current_state": ["Current state bullet 1", "Current state bullet 2", ...],
    "key_questions": ["Key question 1?", "Key question 2?", ...],
    "objective": "One sentence describing the desired outcome"
  },
  "decisions": [
    {
      "Topic": "Decision topic 1",
      "Option": "Option being considered",
      "Upside": "Potential benefits",
      "Risk": "Potential risks",
      "Decision": ""
    }
  ]
}

Guidelines:
- Generate 5-8 clear agenda items based on the notes
- Keep memo sections concise and actionable
- Create 3-6 decision items that require board input
- Leave Decision field empty (to be filled during meeting)
- Be professional and business-focused`;

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
          { role: "user", content: `Meeting Title: ${title}\n\nAgenda Notes:\n${agendaNotes}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    console.log("AI response received");
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No content generated");
    }

    console.log("Raw content:", content.substring(0, 200));

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(jsonStr);
    console.log("Parsed result, agenda items:", result.agenda?.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-board-meeting-content error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
