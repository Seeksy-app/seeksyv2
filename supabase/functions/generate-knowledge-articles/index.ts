import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PORTALS = ['admin', 'creator', 'board'] as const;
const CATEGORIES = [
  'Seeksy Updates',
  'Industry Insights',
  'Creator Growth & Monetization',
  'AI Tools & Trends',
  'Podcasting Industry',
  'Meetings & Events Industry',
  'How-To Articles'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { count = 3 } = await req.json().catch(() => ({ count: 3 }));

    console.log(`Generating ${count} knowledge articles...`);

    const generatedArticles = [];

    for (let i = 0; i < count; i++) {
      const portal = PORTALS[i % PORTALS.length];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('blog_generation_jobs')
        .insert({
          portal,
          category,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create job:', jobError);
        continue;
      }

      try {
        // Generate article with AI
        const systemPrompt = `You are a professional content writer for Seeksy, a creator platform. 
Generate a high-quality knowledge article in JSON format.

Target audience: ${portal === 'board' ? 'Board members and investors - strategic, high-level, financial focus' : portal === 'admin' ? 'Platform administrators - operational, technical, insights-driven' : 'Content creators - practical, inspirational, actionable'}

Category: ${category}

Return ONLY valid JSON with this structure:
{
  "title": "Compelling article title",
  "excerpt": "2-3 sentence summary",
  "purpose": "Why this topic matters (2-3 sentences)",
  "expected_outcomes": "What readers will learn (2-3 sentences)",
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"],
  "content": "Full article content in markdown format (minimum 800 words with ## headings)",
  "execution_steps": ["step 1", "step 2", "step 3", "step 4"],
  "questions": ["question 1?", "question 2?", "question 3?", "question 4?", "question 5?"],
  "screenshot_urls": ["/assets/screens/dashboard.png", "/assets/screens/analytics.png"]
}`;

        const userPrompt = `Write a comprehensive knowledge article about a trending topic in the ${category} category for ${portal === 'board' ? 'board members' : portal === 'admin' ? 'administrators' : 'creators'}.

Make it insightful, actionable, and relevant to current industry trends. Include specific examples and data points where applicable.

The article should be minimum 800 words and follow professional writing standards.`;

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
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`AI API error: ${response.status} - ${errText}`);
        }

        const aiResult = await response.json();
        const content = aiResult.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content returned from AI');
        }

        // Parse JSON from response
        let articleData;
        try {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content;
          articleData = JSON.parse(jsonStr.trim());
        } catch (parseErr) {
          console.error('Failed to parse AI response:', content.substring(0, 500));
          throw new Error('Failed to parse article JSON');
        }

        // Generate slug
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

        // Determine section based on category and portal
        const sectionMap: Record<string, Record<string, string>> = {
          admin: {
            'Seeksy Updates': 'Overview',
            'Industry Insights': 'Overview',
            'Creator Growth & Monetization': 'Monetization',
            'AI Tools & Trends': 'AI Systems',
            'Podcasting Industry': 'Creator Tools',
            'Meetings & Events Industry': 'Meetings & Events',
            'How-To Articles': 'Creator Tools'
          },
          creator: {
            'Seeksy Updates': 'Getting Started',
            'Industry Insights': 'Growth',
            'Creator Growth & Monetization': 'Monetization',
            'AI Tools & Trends': 'Studio Tools',
            'Podcasting Industry': 'Studio Tools',
            'Meetings & Events Industry': 'Meetings',
            'How-To Articles': 'Getting Started'
          },
          board: {
            'Seeksy Updates': 'Company Health',
            'Industry Insights': 'Competitive Landscape',
            'Creator Growth & Monetization': 'Capital Strategy',
            'AI Tools & Trends': 'Milestones',
            'Podcasting Industry': 'Competitive Landscape',
            'Meetings & Events Industry': 'Milestones',
            'How-To Articles': 'Team & Org'
          }
        };

        const section = sectionMap[portal]?.[category] || 'Overview';

        // Insert article
        const { data: article, error: articleError } = await supabase
          .from('knowledge_articles')
          .insert({
            portal,
            section,
            category,
            title: articleData.title,
            slug: `${slug}-${Date.now()}`,
            excerpt: articleData.excerpt,
            content: articleData.content,
            purpose: articleData.purpose,
            expected_outcomes: articleData.expected_outcomes,
            key_takeaways: articleData.key_takeaways,
            execution_steps: articleData.execution_steps,
            questions: articleData.questions,
            screenshot_urls: articleData.screenshot_urls,
            is_published: true,
            view_count: 0,
            version: 1
          })
          .select()
          .single();

        if (articleError) throw articleError;

        // Update job as completed
        await supabase
          .from('blog_generation_jobs')
          .update({
            status: 'completed',
            generated_article_id: article.id,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        generatedArticles.push(article);
        console.log(`Generated article: ${article.title}`);

      } catch (genError) {
        console.error(`Failed to generate article:`, genError);
        await supabase
          .from('blog_generation_jobs')
          .update({
            status: 'failed',
            error_message: genError instanceof Error ? genError.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: generatedArticles.length,
        articles: generatedArticles 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
