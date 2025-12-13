import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Only admins and editors can generate master blog posts
const ALLOWED_ROLES = ['admin', 'super_admin', 'editor'];

// Generate an image using Lovable AI
async function generateImage(prompt: string, lovableApiKey: string): Promise<string | null> {
  try {
    console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log('Image generated successfully');
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

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
6. A short image prompt for a featured header image (describe a professional, abstract illustration suitable for a blog header)
7. 2-3 inline image prompts that should be placed within the content (describe specific visuals that enhance the article)

Topic categories to choose from: social media strategy, content creation tips, monetization, personal branding, productivity, technology for creators, marketing insights.

IMPORTANT: In the content, include markdown image placeholders where inline images should go, using the format: ![Image description](INLINE_IMAGE_1), ![Image description](INLINE_IMAGE_2), etc.

Return ONLY a JSON object with this exact structure:
{
  "title": "string",
  "excerpt": "string",
  "content": "string (markdown with image placeholders)",
  "seo_description": "string",
  "seo_keywords": ["keyword1", "keyword2"],
  "featured_image_prompt": "string (short prompt for header image)",
  "inline_image_prompts": ["prompt1", "prompt2"]
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

      // Generate featured image
      let featuredImageUrl = null;
      if (blogData.featured_image_prompt) {
        const imagePrompt = `Professional blog header image: ${blogData.featured_image_prompt}. Modern, clean design with subtle blue tones (#053877, #2C6BED). Abstract and minimal, suitable for a SaaS blog. High quality, 16:9 aspect ratio.`;
        featuredImageUrl = await generateImage(imagePrompt, lovableApiKey);
      }

      // Generate inline images and replace placeholders
      let finalContent = blogData.content;
      if (blogData.inline_image_prompts && Array.isArray(blogData.inline_image_prompts)) {
        for (let j = 0; j < blogData.inline_image_prompts.length; j++) {
          const inlinePrompt = `Blog illustration: ${blogData.inline_image_prompts[j]}. Clean, professional, modern style. Suitable for inline blog content.`;
          const inlineImageUrl = await generateImage(inlinePrompt, lovableApiKey);
          
          if (inlineImageUrl) {
            // Replace placeholder with actual image URL
            finalContent = finalContent.replace(`INLINE_IMAGE_${j + 1}`, inlineImageUrl);
          } else {
            // Remove the placeholder if image generation failed
            finalContent = finalContent.replace(new RegExp(`!\\[[^\\]]*\\]\\(INLINE_IMAGE_${j + 1}\\)`, 'g'), '');
          }
        }
      }

      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}-${i}`;

      // Use the authenticated user as the author
      const { data: insertedPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user.id,
          title: blogData.title,
          slug: slug,
          excerpt: blogData.excerpt,
          content: finalContent,
          featured_image_url: featuredImageUrl,
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
      console.log(`Successfully created post ${i + 1}: ${blogData.title} (with ${featuredImageUrl ? 'featured image' : 'no featured image'})`);
    }

    console.log(`Generated ${posts.length} blog posts successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsCreated: posts.length,
        posts: posts.map(p => ({ id: p.id, title: p.title, hasImage: !!p.featured_image_url }))
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
