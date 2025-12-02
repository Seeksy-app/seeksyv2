import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Instagram, RefreshCw, Users, Eye, TrendingUp, Heart, 
  MessageCircle, Bookmark, Image, Video, Search, 
  AlertCircle, ArrowUpRight, BarChart3
} from "lucide-react";
import { 
  useSocialProfiles, 
  useSocialPosts, 
  useSocialInsights, 
  useSyncSocialData,
  useTopPosts 
} from "@/hooks/useSocialMediaSync";
import { SocialOnboardingChecklist } from "@/components/social/SocialOnboardingChecklist";
import { CreatorValuationCard } from "@/components/social/CreatorValuationCard";
import { InstagramReconnectBanner } from "@/components/social/InstagramReconnectBanner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Helmet } from "react-helmet";

export default function SocialAnalytics() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<string>("engagement");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: profiles, isLoading: profilesLoading } = useSocialProfiles();
  const instagramProfile = profiles?.find(p => p.platform === 'instagram');
  
  const { data: posts } = useSocialPosts(instagramProfile?.id || null);
  const { data: insights } = useSocialInsights(instagramProfile?.id || null);
  const { data: topPosts } = useTopPosts(instagramProfile?.id || null, 5);
  const { syncData, isSyncing } = useSyncSocialData();

  const isTokenExpired = instagramProfile?.sync_status === 'token_expired';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Sort posts
  const sortedPosts = [...(posts || [])].sort((a, b) => {
    switch (sortBy) {
      case "engagement":
        return b.engagement_rate - a.engagement_rate;
      case "reach":
        return (b.reach || 0) - (a.reach || 0);
      case "date":
      default:
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    }
  });

  // Filter posts by search
  const filteredPosts = sortedPosts.filter(post => 
    post.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare insights chart data
  const insightsChartData = [...(insights || [])].reverse().map(insight => ({
    date: format(new Date(insight.snapshot_date), 'MMM d'),
    followers: insight.follower_count,
    reach: insight.reach,
    impressions: insight.impressions,
    engagement: insight.engagement_rate,
  }));

  if (profilesLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!instagramProfile) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Helmet>
          <title>Social Analytics – Seeksy</title>
        </Helmet>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Connect Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Instagram account to view analytics and performance metrics.
            </p>
            <Button 
              onClick={() => navigate('/integrations')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            >
              Connect Instagram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      <Helmet>
        <title>Social Analytics – Seeksy</title>
        <meta name="description" content="View your Instagram analytics and social media performance" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {instagramProfile.profile_picture ? (
            <img 
              src={instagramProfile.profile_picture} 
              alt={instagramProfile.username || 'Profile'} 
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">@{instagramProfile.username}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{instagramProfile.account_type || 'Creator'}</Badge>
              {instagramProfile.last_sync_at && (
                <span className="text-xs text-muted-foreground">
                  Last synced {formatDistanceToNow(new Date(instagramProfile.last_sync_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button 
          onClick={() => syncData(instagramProfile.id)}
          disabled={isSyncing || isTokenExpired}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Data Now
        </Button>
      </div>

      {/* Token Expired Warning */}
      {isTokenExpired && (
        <InstagramReconnectBanner error={instagramProfile.sync_error || undefined} />
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Onboarding & Valuation Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SocialOnboardingChecklist />
            <div className="md:col-span-2">
              <CreatorValuationCard profileId={instagramProfile.id} />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Followers</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(instagramProfile.followers_count)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Following</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(instagramProfile.follows_count)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">Posts</span>
                </div>
                <p className="text-3xl font-bold">{formatNumber(instagramProfile.media_count)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm">Avg Engagement</span>
                </div>
                <p className="text-3xl font-bold">
                  {posts?.length 
                    ? (posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length).toFixed(2)
                    : '0.00'}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Followers Chart */}
          {insightsChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Followers Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insightsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Posts */}
          {topPosts && topPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {topPosts.map(post => (
                    <a 
                      key={post.id}
                      href={post.permalink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      {post.media_url || post.thumbnail_url ? (
                        <img 
                          src={post.thumbnail_url || post.media_url || ''} 
                          alt={post.caption?.slice(0, 50) || 'Post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>{formatNumber(post.like_count)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>{formatNumber(post.comment_count)}</span>
                          </div>
                        </div>
                      </div>
                      {post.media_type === 'VIDEO' && (
                        <div className="absolute top-2 right-2">
                          <Video className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search posts..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="reach">Reach</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                <a 
                  href={post.permalink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square bg-muted relative group"
                >
                  {post.media_url || post.thumbnail_url ? (
                    <img 
                      src={post.thumbnail_url || post.media_url || ''} 
                      alt={post.caption?.slice(0, 50) || 'Post'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                </a>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(post.like_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatNumber(post.comment_count)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {post.engagement_rate.toFixed(2)}%
                    </Badge>
                  </div>
                  {post.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.timestamp), 'MMM d, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts found</p>
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insightsChartData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reach & Impressions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={insightsChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="reach" fill="hsl(var(--primary))" name="Reach" />
                          <Bar dataKey="impressions" fill="hsl(var(--muted-foreground))" name="Impressions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={insightsChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="engagement" 
                            stroke="hsl(var(--chart-2))" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Date</th>
                          <th className="text-right py-2">Followers</th>
                          <th className="text-right py-2">Reach</th>
                          <th className="text-right py-2">Impressions</th>
                          <th className="text-right py-2">Profile Views</th>
                          <th className="text-right py-2">Website Clicks</th>
                          <th className="text-right py-2">Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insights?.slice(0, 14).map(insight => (
                          <tr key={insight.id} className="border-b">
                            <td className="py-2">{format(new Date(insight.snapshot_date), 'MMM d, yyyy')}</td>
                            <td className="text-right py-2">{formatNumber(insight.follower_count)}</td>
                            <td className="text-right py-2">{formatNumber(insight.reach)}</td>
                            <td className="text-right py-2">{formatNumber(insight.impressions)}</td>
                            <td className="text-right py-2">{formatNumber(insight.profile_views)}</td>
                            <td className="text-right py-2">{insight.website_clicks}</td>
                            <td className="text-right py-2">{insight.engagement_rate.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No insights data yet. Sync your account to start collecting data.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => syncData(instagramProfile.id)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Comments will appear here after syncing. Select a post to view its comments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
