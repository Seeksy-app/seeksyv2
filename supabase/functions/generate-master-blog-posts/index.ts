import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Only admins and editors can generate master blog posts
const ALLOWED_ROLES = ['admin', 'super_admin', 'editor'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🔒 Blog Generator: Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.log("🔒 Blog Generator: Invalid token -", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // === AUTHORIZATION ===
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error("🔒 Blog Generator: Failed to fetch roles -", rolesError);
    }

    const roles = userRoles?.map(r => r.role) || [];
    const hasAccess = roles.some(role => ALLOWED_ROLES.includes(role));

    if (!hasAccess) {
      console.log(`🔒 Blog Generator: Access denied for user ${user.id} with roles [${roles.join(', ')}]`);
      return new Response(
        JSON.stringify({ error: "Access denied. Only admins and editors can generate master blog posts." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Blog Generator: Authorized - user=${user.id}, roles=[${roles.join(',')}]`);

    // Generate 3 blog posts
    const posts = [];
    for (let i = 0; i < 3; i++) {
      console.log(`Generating post ${i + 1}/3...`);

      const topicResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a creative content writer for a platform called Seeksy that helps creators, influencers, and entrepreneurs manage their business. Generate engaging blog post topics and content.'
            },
            {
              role: 'user',
              content: `Generate a complete blog post for creators/influencers. Include:
1. An engaging title (max 80 characters)
2. A compelling excerpt (max 160 characters)
3. Full blog content in markdown format (500-800 words)
4. SEO meta description (max 160 characters)
5. 5-7 relevant keywords

Topic categories to choose from: social media strategy, content creation tips, monetization, personal branding, productivity, technology for creators, marketing insights.

Return ONLY a JSON object with this exact structure:
{
  "title": "string",
  "excerpt": "string",
  "content": "string (markdown)",
  "seo_description": "string",
  "seo_keywords": ["keyword1", "keyword2"]
}`
            }
          ],
        }),
      });

      if (!topicResponse.ok) {
        console.error(`AI generation failed for post ${i + 1}:`, await topicResponse.text());
        continue;
      }

      const topicData = await topicResponse.json();
      const content = topicData.choices[0].message.content;
      
      let blogData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          blogData = JSON.parse(jsonMatch[0]);
        } else {
          console.error('No JSON found in AI response');
          continue;
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        continue;
      }

      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}-${i}`;

      // Use the authenticated user as the author
      const { data: insertedPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user.id, // Use authenticated user, not arbitrary first user
          title: blogData.title,
          slug: slug,
          excerpt: blogData.excerpt,
          content: blogData.content,
          seo_title: blogData.title,
          seo_description: blogData.seo_description,
          seo_keywords: blogData.seo_keywords,
          status: 'published',
          published_at: new Date().toISOString(),
          publish_to_master: true,
          master_published_at: new Date().toISOString(),
          is_ai_generated: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to insert post ${i + 1}:`, insertError);
        continue;
      }

      posts.push(insertedPost);
      console.log(`Successfully created post ${i + 1}: ${blogData.title}`);
    }

    console.log(`Generated ${posts.length} blog posts successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsCreated: posts.length,
        posts: posts.map(p => ({ id: p.id, title: p.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating master blog posts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
