import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Radio, Share2, TrendingUp, Users, DollarSign, Eye } from "lucide-react";
import { EpisodeCreationModal } from "@/components/podcast/EpisodeCreationModal";
import { getPodcastRevenue } from "@/lib/api/financialApis";
import { format } from "date-fns";

export default function PodcastDashboard() {
  const { podcastId } = useParams<{ podcastId: string }>();
  const navigate = useNavigate();
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: podcast, isLoading: podcastLoading } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["podcast-episodes", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ["podcast-revenue", podcastId],
    queryFn: () => getPodcastRevenue(podcastId!),
    enabled: !!podcastId,
  });

  const handleShare = () => {
    if (!podcast?.rss_feed_url) return;
    navigator.clipboard.writeText(podcast.rss_feed_url);
  };

  if (podcastLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {podcast?.cover_image_url && (
              <img 
                src={podcast.cover_image_url} 
                alt={podcast.title}
                className="w-28 h-28 rounded-xl object-cover shadow-lg ring-2 ring-primary/20"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Your Podcast</span>
              </div>
              <h1 className="text-3xl font-bold mb-1">{podcast?.title}</h1>
              <p className="text-muted-foreground mb-4">
                Hosted by {podcast?.author_name || "Not specified"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowCreationModal(true)} size="lg" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Create Episode
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/studio?podcastId=${podcastId}&mode=new-episode`)} 
                  size="lg" 
                  className="gap-2"
                >
                  Open Studio
                </Button>
                <Button variant="ghost" onClick={handleShare} size="lg" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Podcast
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{episodes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Published episodes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_impressions?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time plays</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenue?.total_revenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_ad_reads?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total ad reads</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-8 sticky top-0 bg-background z-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="studio">Studio Tools</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="directories">Directories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Episodes</CardTitle>
            </CardHeader>
            <CardContent>
              {episodesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : episodes && episodes.length > 0 ? (
                <div className="space-y-2">
                  {episodes.slice(0, 5).map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{episode.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {episode.created_at && format(new Date(episode.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={episode.is_published ? "default" : "secondary"}>
                        {episode.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Radio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No episodes yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="episodes">
          <Card>
            <CardHeader>
              <CardTitle>All Episodes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Episodes management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="studio">
          <Card>
            <CardHeader>
              <CardTitle>Studio Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Studio tools coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Players & Embeds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Player customization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="website">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Website</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Website builder coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monetization">
          <Card>
            <CardHeader>
              <CardTitle>Monetization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Monetization settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="directories">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Directories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Directory submissions coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EpisodeCreationModal 
        open={showCreationModal}
        onOpenChange={setShowCreationModal}
        podcastId={podcastId!}
        podcastTitle={podcast?.title || ""}
      />
    </div>
  );
}
