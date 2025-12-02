import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Niche multipliers for pricing
const NICHE_MULTIPLIERS: Record<string, number> = {
  "beauty": 1.8,
  "fashion": 1.8,
  "business": 2.0,
  "finance": 2.0,
  "weddings": 2.5,
  "events": 2.5,
  "fitness": 1.6,
  "health": 1.6,
  "wellness": 1.6,
  "lifestyle": 1.0,
  "general": 1.0,
};

// Base CPM rates
const BASE_CPM = {
  reel: 12,
  feed_post: 10,
  story: 8,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile_id } = await req.json();

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from("social_media_profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent posts for engagement calculation
    const { data: posts } = await supabase
      .from("social_media_posts")
      .select("like_count, comment_count, reach, impressions")
      .eq("profile_id", profile_id)
      .order("timestamp", { ascending: false })
      .limit(20);

    // Calculate averages
    const postCount = posts?.length || 0;
    let avgLikes = 0;
    let avgComments = 0;
    let avgReach = 0;

    if (posts && posts.length > 0) {
      avgLikes = Math.round(posts.reduce((sum, p) => sum + (p.like_count || 0), 0) / postCount);
      avgComments = Math.round(posts.reduce((sum, p) => sum + (p.comment_count || 0), 0) / postCount);
      avgReach = Math.round(posts.reduce((sum, p) => sum + (p.reach || 0), 0) / postCount);
    }

    const followers = profile.followers_count || 0;
    const engagementRate = followers > 0 
      ? ((avgLikes + avgComments) / followers) * 100 
      : 0;

    // Get highest niche multiplier
    const nicheTags = profile.niche_tags || [];
    let nicheMultiplier = 1.0;
    for (const tag of nicheTags) {
      const normalizedTag = tag.toLowerCase();
      for (const [niche, mult] of Object.entries(NICHE_MULTIPLIERS)) {
        if (normalizedTag.includes(niche) && mult > nicheMultiplier) {
          nicheMultiplier = mult;
        }
      }
    }

    // Calculate base engagement value
    const baseEngagement = (engagementRate / 100) * followers;

    // Calculate prices
    const calculatePrices = (baseCpm: number) => {
      const mid = (baseEngagement / 1000) * baseCpm * nicheMultiplier;
      return {
        low: Math.round(mid * 0.7 * 100) / 100,
        mid: Math.round(mid * 100) / 100,
        high: Math.round(mid * 1.3 * 100) / 100,
      };
    };

    const reelPrices = calculatePrices(BASE_CPM.reel);
    const feedPostPrices = calculatePrices(BASE_CPM.feed_post);
    const storyPrices = calculatePrices(BASE_CPM.story);

    // Upsert valuation
    const valuationData = {
      user_id: user.id,
      profile_id: profile_id,
      platform: profile.platform,
      calculated_at: new Date().toISOString(),
      followers: followers,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      avg_likes_per_post: avgLikes,
      avg_comments_per_post: avgComments,
      est_reach_per_post: avgReach || Math.round(followers * 0.1),
      reel_price_low: reelPrices.low,
      reel_price_mid: reelPrices.mid,
      reel_price_high: reelPrices.high,
      feed_post_price_low: feedPostPrices.low,
      feed_post_price_mid: feedPostPrices.mid,
      feed_post_price_high: feedPostPrices.high,
      story_price_low: storyPrices.low,
      story_price_mid: storyPrices.mid,
      story_price_high: storyPrices.high,
      currency: "USD",
      assumptions_json: {
        niche_multiplier: nicheMultiplier,
        niche_tags: nicheTags,
        base_cpm: BASE_CPM,
        posts_analyzed: postCount,
      },
      updated_at: new Date().toISOString(),
    };

    // Check if valuation exists
    const { data: existingVal } = await supabase
      .from("creator_valuations")
      .select("id")
      .eq("profile_id", profile_id)
      .eq("user_id", user.id)
      .single();

    let valuation;
    if (existingVal) {
      const { data, error } = await supabase
        .from("creator_valuations")
        .update(valuationData)
        .eq("id", existingVal.id)
        .select()
        .single();
      if (error) throw error;
      valuation = data;
    } else {
      const { data, error } = await supabase
        .from("creator_valuations")
        .insert(valuationData)
        .select()
        .single();
      if (error) throw error;
      valuation = data;
    }

    // Also upsert to agency_discovery_profiles
    const discoveryData = {
      platform: profile.platform,
      username: profile.username,
      profile_picture_url: profile.profile_picture,
      followers: followers,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      niche_tags: nicheTags,
      location: profile.location,
      email: profile.email,
      estimated_value_per_post: feedPostPrices.mid,
      source: "connected_creator",
      linked_profile_id: profile_id,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existingDiscovery } = await supabase
      .from("agency_discovery_profiles")
      .select("id")
      .eq("linked_profile_id", profile_id)
      .single();

    if (existingDiscovery) {
      await supabase
        .from("agency_discovery_profiles")
        .update(discoveryData)
        .eq("id", existingDiscovery.id);
    } else {
      await supabase.from("agency_discovery_profiles").insert(discoveryData);
    }

    return new Response(JSON.stringify({ success: true, valuation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Valuation error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to calculate valuation";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
