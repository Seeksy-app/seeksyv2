import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptureRequest {
  url: string;
  pageName: string;
  category: 'advertiser-tools' | 'creator-tools' | 'internal' | 'external' | 'onboarding';
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url, pageName, category, description }: CaptureRequest = await req.json();

    if (!url || !pageName || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call ScreenshotOne API
    const screenshotOneKey = Deno.env.get('SCREENSHOTONE_API_KEY');
    if (!screenshotOneKey) {
      throw new Error('ScreenshotOne API key not configured');
    }

    const screenshotParams = new URLSearchParams({
      access_key: screenshotOneKey,
      url: url,
      format: 'jpeg',
      viewport_width: '1920',
      viewport_height: '1080',
      device_scale_factor: '1',
      full_page: 'false',
      block_ads: 'true',
      block_cookie_banners: 'true',
      block_trackers: 'true',
      cache: 'false',
    });

    console.log('Calling ScreenshotOne API for:', url);
    console.log('ScreenshotOne API key present:', !!screenshotOneKey, 'length:', screenshotOneKey?.length);
    
    const screenshotResponse = await fetch(
      `https://api.screenshotone.com/take?${screenshotParams.toString()}`
    );

    console.log('ScreenshotOne response status:', screenshotResponse.status, screenshotResponse.statusText);

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('ScreenshotOne API error response:', {
        status: screenshotResponse.status,
        statusText: screenshotResponse.statusText,
        body: errorText,
        url: url
      });
      
      // Parse error if JSON
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.message || errorJson.error || errorText;
      } catch (_) {
        // Not JSON, use raw text
      }
      
      throw new Error(`ScreenshotOne API error (HTTP ${screenshotResponse.status}): ${errorDetail}`);
    }

    const imageBuffer = await screenshotResponse.arrayBuffer();
    console.log('Screenshot captured, size:', imageBuffer.byteLength, 'bytes');

    // Generate file path
    const timestamp = new Date().getTime();
    const sanitizedPageName = pageName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const fileName = `${sanitizedPageName}_${timestamp}.jpeg`;
    const storagePath = `${category}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ui-screenshots')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('Screenshot uploaded to storage:', storagePath);

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('ui-screenshots')
      .getPublicUrl(storagePath);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabaseClient
      .from('ui_screenshots')
      .insert({
        page_name: pageName,
        url: url,
        category: category,
        screenshot_path: storagePath,
        created_by: user.id,
        metadata: {
          description: description || null,
          public_url: publicUrl,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    console.log('Screenshot metadata saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        screenshot: {
          id: dbData.id,
          page_name: dbData.page_name,
          url: dbData.url,
          category: dbData.category,
          screenshot_path: dbData.screenshot_path,
          public_url: publicUrl,
          created_at: dbData.created_at,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Screenshot capture error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});