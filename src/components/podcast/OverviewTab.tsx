import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPodcastRevenue } from "@/lib/api/financialApis";
import { 
  Mic, 
  Radio, 
  Share2, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign,
  Eye,
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface OverviewTabProps {
  podcastId: string;
  userId: string;
}

export const OverviewTab = ({ podcastId, userId }: OverviewTabProps) => {
  const navigate = useNavigate();

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
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["podcast-directories", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcast_directories")
        .select("*")
        .eq("podcast_id", podcastId);
      if (error) throw error;
      return data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ["podcast-revenue", podcastId],
    queryFn: () => getPodcastRevenue(podcastId),
  });

  const handleShare = () => {
    if (!podcast?.rss_feed_url) return;
    navigator.clipboard.writeText(podcast.rss_feed_url);
  };

  if (podcastLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const appleStatus = directories?.find(d => d.directory_name === "Apple Podcasts");
  const spotifyStatus = directories?.find(d => d.directory_name === "Spotify");
  const amazonStatus = directories?.find(d => d.directory_name === "Amazon Music");

  return (
    <div className="space-y-6">
      {/* Podcast Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {podcast?.cover_image_url && (
              <img 
                src={podcast.cover_image_url} 
                alt={podcast.title}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{podcast?.title}</h2>
              <p className="text-muted-foreground mb-4">Host: {podcast?.author_name || "Not specified"}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/podcasts/${podcastId}/episodes/new-from-studio`)}>
                  <Mic className="w-4 h-4 mr-2" />
                  Create Episode
                </Button>
                <Button variant="outline" onClick={() => navigate("/studio")}>
                  <Radio className="w-4 h-4 mr-2" />
                  Go to Studio
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{episodes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_impressions?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenue?.total_revenue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_ad_reads?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Episodes & Distribution Status */}
      <div className="grid md:grid-cols-2 gap-6">
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
              <div className="space-y-3">
                {episodes.map((episode) => (
                  <div key={episode.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
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
              <p className="text-muted-foreground text-center py-8">No episodes yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Apple Podcasts</span>
              {appleStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : appleStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Spotify</span>
              {spotifyStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : spotifyStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Amazon Music</span>
              {amazonStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : amazonStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span>RSS Feed</span>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
