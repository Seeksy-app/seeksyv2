import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  success: boolean;
  posts_synced: number;
  comments_synced: number;
  insights_synced: number;
  last_sync: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    let userId: string | null = null;
    let profileId: string | null = null;
    let isCronJob = false;

    // Check if this is a cron job (no auth header) or user request
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      userId = user.id;

      // Get optional profile_id from body
      try {
        const body = await req.json();
        profileId = body.profile_id || null;
      } catch {
        // No body provided
      }
    } else {
      // Cron job - sync all profiles
      isCronJob = true;
    }

    console.log(`Meta sync started - User: ${userId}, Profile: ${profileId}, Cron: ${isCronJob}`);

    // Get profiles to sync
    let profilesQuery = supabase
      .from('social_media_profiles')
      .select('*')
      .eq('platform', 'instagram');

    if (userId && !isCronJob) {
      profilesQuery = profilesQuery.eq('user_id', userId);
    }
    
    if (profileId) {
      profilesQuery = profilesQuery.eq('id', profileId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error('Failed to fetch profiles');
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No profiles to sync', posts_synced: 0, comments_synced: 0, insights_synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalPostsSynced = 0;
    let totalCommentsSynced = 0;
    let totalInsightsSynced = 0;

    for (const profile of profiles) {
      try {
        console.log(`Syncing profile: ${profile.username} (${profile.id})`);

        // Check token expiry
        if (profile.token_expires_at && new Date(profile.token_expires_at) < new Date()) {
          console.log(`Token expired for profile ${profile.id}`);
          await supabase
            .from('social_media_profiles')
            .update({ sync_status: 'token_expired', sync_error: 'Access token has expired' })
            .eq('id', profile.id);
          continue;
        }

        const accessToken = profile.access_token;
        if (!accessToken) {
          console.log(`No access token for profile ${profile.id}`);
          continue;
        }

        // Update sync status
        await supabase
          .from('social_media_profiles')
          .update({ sync_status: 'syncing', sync_error: null })
          .eq('id', profile.id);

        // 1. Fetch and update profile data
        const profileResponse = await fetch(
          `https://graph.facebook.com/v18.0/${profile.platform_user_id}?` +
          `fields=id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url&` +
          `access_token=${accessToken}`
        );

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          console.error('Profile fetch error:', errorData);
          
          // Check for token expiry error
          if (errorData.error?.code === 190) {
            await supabase
              .from('social_media_profiles')
              .update({ sync_status: 'token_expired', sync_error: 'Access token has expired' })
              .eq('id', profile.id);
            continue;
          }
          
          throw new Error(errorData.error?.message || 'Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        
        // Update profile with latest data
        await supabase
          .from('social_media_profiles')
          .update({
            username: profileData.username,
            account_type: profileData.account_type,
            media_count: profileData.media_count || 0,
            followers_count: profileData.followers_count || 0,
            follows_count: profileData.follows_count || 0,
            biography: profileData.biography,
            profile_picture: profileData.profile_picture_url,
          })
          .eq('id', profile.id);

        // 2. Fetch media (posts)
        const mediaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${profile.platform_user_id}/media?` +
          `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&` +
          `limit=200&access_token=${accessToken}`
        );

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          const posts = mediaData.data || [];
          
          for (const post of posts) {
            // Calculate engagement rate
            const engagementRate = profile.followers_count > 0
              ? ((post.like_count || 0) + (post.comments_count || 0)) / profile.followers_count * 100
              : 0;

            // Upsert post
            const { error: postError } = await supabase
              .from('social_media_posts')
              .upsert({
                profile_id: profile.id,
                post_id: post.id,
                media_url: post.media_url,
                thumbnail_url: post.thumbnail_url,
                caption: post.caption,
                media_type: post.media_type,
                permalink: post.permalink,
                timestamp: post.timestamp,
                like_count: post.like_count || 0,
                comment_count: post.comments_count || 0,
                engagement_rate: engagementRate,
              }, { onConflict: 'profile_id,post_id' });

            if (postError) {
              console.error('Error upserting post:', postError);
            } else {
              totalPostsSynced++;
            }

            // 3. Fetch comments for each post
            try {
              const commentsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${post.id}/comments?` +
                `fields=id,text,username,timestamp,like_count&` +
                `limit=100&access_token=${accessToken}`
              );

              if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                const comments = commentsData.data || [];

                // Get the post's UUID from our database
                const { data: dbPost } = await supabase
                  .from('social_media_posts')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .eq('post_id', post.id)
                  .single();

                if (dbPost) {
                  for (const comment of comments) {
                    const { error: commentError } = await supabase
                      .from('social_media_comments')
                      .upsert({
                        post_id: dbPost.id,
                        comment_id: comment.id,
                        text: comment.text,
                        username: comment.username,
                        timestamp: comment.timestamp,
                        like_count: comment.like_count || 0,
                      }, { onConflict: 'post_id,comment_id' });

                    if (!commentError) {
                      totalCommentsSynced++;
                    }
                  }
                }
              }
            } catch (commentErr) {
              console.log('Comments fetch skipped for post:', post.id);
            }

            // Fetch post insights (for business/creator accounts)
            try {
              const insightsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${post.id}/insights?` +
                `metric=impressions,reach,saved&access_token=${accessToken}`
              );

              if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json();
                const insights = insightsData.data || [];
                
                const impressions = insights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0;
                const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
                const saved = insights.find((i: any) => i.name === 'saved')?.values?.[0]?.value || 0;

                await supabase
                  .from('social_media_posts')
                  .update({ impressions, reach, saved })
                  .eq('profile_id', profile.id)
                  .eq('post_id', post.id);
              }
            } catch (insightErr) {
              console.log('Insights fetch skipped for post:', post.id);
            }
          }
        }

        // 4. Fetch account-level insights
        try {
          const accountInsightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${profile.platform_user_id}/insights?` +
            `metric=impressions,reach,profile_views,website_clicks,email_contacts,accounts_engaged,total_interactions&` +
            `period=day&access_token=${accessToken}`
          );

          if (accountInsightsResponse.ok) {
            const accountInsights = await accountInsightsResponse.json();
            const data = accountInsights.data || [];
            
            const impressions = data.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0;
            const reach = data.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
            const profileViews = data.find((i: any) => i.name === 'profile_views')?.values?.[0]?.value || 0;
            const websiteClicks = data.find((i: any) => i.name === 'website_clicks')?.values?.[0]?.value || 0;
            const emailContacts = data.find((i: any) => i.name === 'email_contacts')?.values?.[0]?.value || 0;
            const accountsEngaged = data.find((i: any) => i.name === 'accounts_engaged')?.values?.[0]?.value || 0;
            const totalInteractions = data.find((i: any) => i.name === 'total_interactions')?.values?.[0]?.value || 0;

            // Calculate engagement rate
            const engagementRate = profile.followers_count > 0
              ? (totalInteractions / profile.followers_count) * 100
              : 0;

            // Upsert daily snapshot
            const { error: snapshotError } = await supabase
              .from('social_insights_snapshots')
              .upsert({
                profile_id: profile.id,
                snapshot_date: new Date().toISOString().split('T')[0],
                impressions,
                reach,
                profile_views: profileViews,
                website_clicks: websiteClicks,
                email_contacts: emailContacts,
                follower_count: profile.followers_count || 0,
                engagement_rate: engagementRate,
                accounts_engaged: accountsEngaged,
                total_interactions: totalInteractions,
              }, { onConflict: 'profile_id,snapshot_date' });

            if (!snapshotError) {
              totalInsightsSynced++;
            }
          }
        } catch (insightErr) {
          console.log('Account insights fetch failed:', insightErr);
        }

        // Update sync status to success
        await supabase
          .from('social_media_profiles')
          .update({ 
            sync_status: 'synced', 
            sync_error: null,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        // Log successful sync
        await supabase.from('social_sync_logs').insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          sync_type: isCronJob ? 'cron' : 'manual',
          status: 'success',
          posts_synced: totalPostsSynced,
          comments_synced: totalCommentsSynced,
          insights_synced: totalInsightsSynced,
        });

        console.log(`Profile ${profile.username} synced successfully`);

      } catch (profileError) {
        console.error(`Error syncing profile ${profile.id}:`, profileError);
        const errorMsg = profileError instanceof Error ? profileError.message : 'Unknown error';
        
        await supabase
          .from('social_media_profiles')
          .update({ 
            sync_status: 'error', 
            sync_error: errorMsg
          })
          .eq('id', profile.id);

        // Log failed sync
        await supabase.from('social_sync_logs').insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          sync_type: isCronJob ? 'cron' : 'manual',
          status: 'error',
          error_code: profileError instanceof Error && 'code' in profileError ? String((profileError as any).code) : null,
          error_message: errorMsg,
        });
      }
    }

    const result: SyncResult = {
      success: true,
      posts_synced: totalPostsSynced,
      comments_synced: totalCommentsSynced,
      insights_synced: totalInsightsSynced,
      last_sync: new Date().toISOString(),
    };

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-sync-social-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
