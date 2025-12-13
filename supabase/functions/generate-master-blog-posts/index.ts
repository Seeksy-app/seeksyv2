import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Only admins and editors can generate master blog posts
const ALLOWED_ROLES = ['admin', 'super_admin', 'editor'];

// Generate an image using Lovable AI and upload to storage
async function generateImage(
  prompt: string, 
  lovableApiKey: string, 
  supabase: any,
  filename: string
): Promise<string | null> {
  try {
    console.log('🖼️ Generating image with prompt:', prompt.substring(0, 80) + '...');
    
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
      const errorText = await response.text();
      console.error('❌ Image generation failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const base64DataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64DataUrl) {
      console.warn('⚠️ No image URL in response');
      return null;
    }

    console.log('✅ Image generated, uploading to storage...');
    
    // Extract base64 data and convert to binary
    const base64Match = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error('❌ Invalid base64 data URL format');
      return null;
    }
    
    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to Supabase storage
    const storagePath = `blog-images/${filename}.${imageFormat}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-assets')
      .upload(storagePath, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Failed to upload image:', uploadError.message);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-assets')
      .getPublicUrl(storagePath);
    
    console.log('✅ Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error generating image:', error);
    return null;
  }
}

// Safely parse JSON from AI response
function safeParseJson(content: string): any {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      console.log('Code block JSON parse failed, trying raw content');
    }
  }
  
  // Try to find JSON object directly
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Try to fix common JSON issues
      let fixed = jsonMatch[0]
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/\n/g, '\\n') // Escape newlines in strings
        .replace(/\r/g, '\\r'); // Escape carriage returns
      
      try {
        return JSON.parse(fixed);
      } catch (e2) {
        console.error('JSON parse failed even after fixes');
      }
    }
  }
  
  return null;
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

    // Fetch existing titles to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(30);
    
    const existingTitles = existingPosts?.map(p => p.title.toLowerCase()) || [];
    console.log(`📚 Found ${existingTitles.length} existing posts to avoid duplicating`);

    // Generate 3 blog posts
    const posts = [];
    for (let i = 0; i < 3; i++) {
      console.log(`\n📝 Generating post ${i + 1}/3...`);

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
              content: `You are a creative content writer for Seeksy, a platform for creators, influencers, and entrepreneurs. Generate unique, engaging blog content. 
              
IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text. Just the raw JSON object.`
            },
            {
              role: 'user',
              content: `Generate a UNIQUE blog post for creators/influencers. 

AVOID these existing topics: ${existingTitles.slice(0, 10).join(', ')}

Requirements:
1. Title: engaging, max 80 chars, MUST be different from existing titles
2. Excerpt: compelling summary, max 160 chars  
3. Content: full markdown article, 500-800 words
4. SEO description: max 160 chars
5. Keywords: 5-7 relevant terms
6. Topic tags: 2 tags like "Content Strategy", "Audience Growth", "Monetization Tips"
7. Featured image prompt: describe a professional abstract header image (no text, no faces)
8. Inline image prompts: 2 prompts for images to place in article body

Categories: social media strategy, content creation tips, monetization, personal branding, productivity, technology for creators, marketing insights, podcasting, video creation, newsletter growth.

In content, use placeholders: ![description](INLINE_IMAGE_1), ![description](INLINE_IMAGE_2)

Return this exact JSON structure (no markdown, no code blocks):
{"title":"string","excerpt":"string","content":"markdown string","seo_description":"string","seo_keywords":["k1","k2"],"topic_tags":["t1","t2"],"featured_image_prompt":"string","inline_image_prompts":["p1","p2"]}`
            }
          ],
        }),
      });

      if (!topicResponse.ok) {
        console.error(`❌ AI generation failed for post ${i + 1}:`, await topicResponse.text());
        continue;
      }

      const topicData = await topicResponse.json();
      const content = topicData.choices?.[0]?.message?.content || '';
      console.log('📄 AI response length:', content.length);
      
      const blogData = safeParseJson(content);
      
      if (!blogData || !blogData.title) {
        console.error('❌ Failed to parse AI response or missing title');
        console.log('Raw content preview:', content.substring(0, 300));
        continue;
      }

      console.log(`📰 Parsed article: "${blogData.title}"`);

      // Generate unique filename base
      const filenameBase = `${Date.now()}-${i}`;

      // Generate featured image (REQUIRED)
      let featuredImageUrl = null;
      if (blogData.featured_image_prompt) {
        const imagePrompt = `Professional blog header illustration: ${blogData.featured_image_prompt}. Modern minimalist design, subtle blue color palette (#053877, #2C6BED), abstract shapes, no text, no human faces, 16:9 aspect ratio, high quality editorial style.`;
        featuredImageUrl = await generateImage(imagePrompt, lovableApiKey, supabase, `featured-${filenameBase}`);
      }
      
      // If featured image failed, try a generic prompt
      if (!featuredImageUrl) {
        console.log('⚠️ Featured image failed, trying fallback prompt...');
        const fallbackPrompt = `Abstract modern blog header illustration for article about ${blogData.title}. Minimalist design with blue gradient colors, geometric shapes, professional editorial style, no text, no faces, 16:9 aspect ratio.`;
        featuredImageUrl = await generateImage(fallbackPrompt, lovableApiKey, supabase, `featured-${filenameBase}-fallback`);
      }

      // Generate inline images and replace placeholders
      let finalContent = blogData.content || '';
      if (blogData.inline_image_prompts && Array.isArray(blogData.inline_image_prompts)) {
        for (let j = 0; j < blogData.inline_image_prompts.length; j++) {
          const inlinePrompt = `Blog illustration: ${blogData.inline_image_prompts[j]}. Clean professional modern style, suitable for inline article content, no text overlay.`;
          const inlineImageUrl = await generateImage(inlinePrompt, lovableApiKey, supabase, `inline-${filenameBase}-${j}`);
          
          if (inlineImageUrl) {
            finalContent = finalContent.replace(`INLINE_IMAGE_${j + 1}`, inlineImageUrl);
            console.log(`✅ Inline image ${j + 1} generated`);
          } else {
            // Remove the placeholder if image generation failed
            finalContent = finalContent.replace(new RegExp(`!\\[[^\\]]*\\]\\(INLINE_IMAGE_${j + 1}\\)`, 'g'), '');
            console.log(`⚠️ Inline image ${j + 1} failed, removing placeholder`);
          }
        }
      }

      // Generate unique slug with timestamp
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}-${i}`;

      // Combine AI Generated tag with topic tags
      const allTags = ['AI Generated', ...(blogData.topic_tags || [])];

      // INSERT new post (never update existing)
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
          seo_keywords: allTags,
          status: 'published',
          published_at: new Date().toISOString(),
          publish_to_master: true,
          master_published_at: new Date().toISOString(),
          is_ai_generated: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to insert post ${i + 1}:`, insertError);
        continue;
      }

      posts.push(insertedPost);
      console.log(`✅ Created post ${i + 1}: "${blogData.title}" (image: ${featuredImageUrl ? 'yes' : 'no'})`);
    }

    console.log(`\n🎉 Generated ${posts.length} new blog posts successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsCreated: posts.length,
        posts: posts.map(p => ({ id: p.id, title: p.title, hasImage: !!p.featured_image_url }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating master blog posts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
