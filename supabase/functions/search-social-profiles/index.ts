import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramProfile {
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  is_verified: boolean;
  external_url: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[search-social-profiles] Starting profile search');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { searchQuery, platform = 'instagram' } = await req.json();

    if (!searchQuery) {
      throw new Error('Search query is required');
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log(`[search-social-profiles] Searching ${platform} for: ${searchQuery}`);

    let profiles: InstagramProfile[] = [];

    if (platform === 'instagram') {
      // Search Instagram profiles using RapidAPI
      const response = await fetch('https://instagram120.p.rapidapi.com/api/instagram/user/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'instagram120.p.rapidapi.com',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[search-social-profiles] Instagram API error:', response.status, errorText);
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[search-social-profiles] Instagram response:', JSON.stringify(data).substring(0, 500));

      // Parse Instagram results - adjust based on actual API response structure
      if (data.users || data.data || Array.isArray(data)) {
        const users = data.users || data.data || data;
        profiles = users.slice(0, 10).map((u: any) => ({
          username: u.username || u.user?.username,
          full_name: u.full_name || u.user?.full_name || '',
          profile_pic_url: u.profile_pic_url || u.user?.profile_pic_url || '',
          follower_count: u.follower_count || u.user?.follower_count || 0,
          is_verified: u.is_verified || u.user?.is_verified || false,
          external_url: u.external_url || null,
        }));
      }
    } else if (platform === 'tiktok') {
      // TikTok search - requires different API
      // Placeholder for TikTok integration
      console.log('[search-social-profiles] TikTok search not yet implemented');
    }

    console.log(`[search-social-profiles] Found ${profiles.length} profiles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profiles,
        platform,
        query: searchQuery 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[search-social-profiles] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
