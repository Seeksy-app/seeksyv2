import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Clock, CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", id)
        .order("publish_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: certificates } = useQuery({
    queryKey: ["episode-certificates", id],
    queryFn: async () => {
      if (!episodes) return [];
      const episodeIds = episodes.map(ep => ep.id);
      
      const { data, error } = await supabase
        .from("episode_blockchain_certificates")
        .select("episode_id, certificate_hash")
        .in("episode_id", episodeIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!episodes && episodes.length > 0,
  });

  const deleteEpisode = useMutation({
    mutationFn: async (episodeId: string) => {
      const { data: episode } = await supabase
        .from("episodes")
        .select("file_size_bytes")
        .eq("id", episodeId)
        .single();
      
      const { error } = await supabase
        .from("episodes")
        .delete()
        .eq("id", episodeId);
      
      if (error) throw error;
      
      if (episode?.file_size_bytes && user) {
        const fileSizeMB = Math.ceil(episode.file_size_bytes / (1024 * 1024));
        try {
          await supabase.rpc('increment_usage', {
            _user_id: user.id,
            _feature_type: 'podcast_storage_mb',
            _increment: -fileSizeMB
          });
        } catch (usageError) {
          console.error("Failed to update storage usage:", usageError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes", id] });
      toast.success("Episode deleted");
      setEpisodeToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete episode");
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!podcast) return null;

  const episodeCount = episodes?.length || 0;

  const recommendations = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Add a title and description",
      subtitle: "for a great first impression",
      completed: !!podcast.title && !!podcast.description,
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Add custom artwork",
      subtitle: "to make your podcast stand out",
      completed: !!podcast.cover_image_url,
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Publish your first episode",
      subtitle: "to launch your podcast",
      completed: episodeCount > 0,
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Submit to directories like Apple and Spotify",
      subtitle: "to get discovered",
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/podcasts")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {podcast.cover_image_url && (
              <img
                src={podcast.cover_image_url}
                alt={podcast.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{podcast.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded text-xs font-medium text-white">
                  Hosted by Seeksy
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">My Podcasts</span>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Resources</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="home" className="px-6">
          <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-2">
            <TabsTrigger
              value="home"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Home
            </TabsTrigger>
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Episodes
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Players
            </TabsTrigger>
            <TabsTrigger
              value="website"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Website
            </TabsTrigger>
            <TabsTrigger
              value="directories"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Directories
            </TabsTrigger>
            <TabsTrigger
              value="monetization"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Monetization
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-0">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold">Episodes</h2>
                      <Button
                        size="lg"
                        className="bg-black text-white hover:bg-black/90"
                        onClick={() => navigate(`/podcasts/${id}/upload`)}
                      >
                        Upload a New Episode
                      </Button>
                    </div>

                    {episodeCount === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-4">
                          There are no episodes in this podcast.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => navigate(`/podcasts/${id}/upload`)}
                            className="text-base underline hover:no-underline"
                          >
                            Upload an episode
                          </button>
                          <span className="text-muted-foreground">or</span>
                          <button
                            onClick={() => navigate("/podcasts/import")}
                            className="text-base underline hover:no-underline"
                          >
                            copy in an existing podcast
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {episodes?.map((episode) => (
                           <Card key={episode.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {episode.episode_number && (
                                    <span className="text-sm text-muted-foreground">
                                      #{episode.episode_number}
                                    </span>
                                  )}
                                  <h3 className="font-semibold">{episode.title}</h3>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    episode.is_published
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-secondary/10 text-secondary'
                                  }`}>
                                    {episode.is_published ? 'Published' : 'Draft'}
                                  </span>
                                  {certificates?.some(cert => cert.episode_id === episode.id) && (
                                    <VoiceCertifiedBadge size="sm" showText={false} />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {episode.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {episode.duration_seconds 
                                      ? formatDuration(episode.duration_seconds)
                                      : 'Unknown'}
                                  </span>
                                  <span>
                                    {new Date(episode.publish_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/podcasts/${id}/episodes/${episode.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEpisodeToDelete(episode.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {episode.audio_url && (
                              <audio controls className="w-full mt-3">
                                <source src={episode.audio_url} type="audio/mpeg" />
                              </audio>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Recommendations */}
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-6">
                        Recommendations for your new podcast
                      </h3>
                      <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
                          >
                            <div
                              className={`${
                                rec.completed
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {rec.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {rec.title}{" "}
                                <span className="text-muted-foreground font-normal">
                                  {rec.subtitle}
                                </span>
                              </p>
                            </div>
                            <span className="text-muted-foreground opacity-0 group-hover:opacity-100">
                              →
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* RSS Migration Card */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <h3 className="text-xl font-bold mb-2">
                        Moving from another host?
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Seamlessly migrate your podcast RSS feed to Seeksy with automatic 301 redirects
                      </p>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => navigate(`/podcasts/${id}/migrate`)}
                      >
                        Start RSS Migration
                      </Button>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="episodes" className="mt-0 p-6">
            <p className="text-muted-foreground">Episodes tab content coming soon...</p>
          </TabsContent>

          <TabsContent value="players" className="mt-0 p-6">
            <p className="text-muted-foreground">Players tab content coming soon...</p>
          </TabsContent>

          <TabsContent value="website" className="mt-0 p-6">
            <p className="text-muted-foreground">Website tab content coming soon...</p>
          </TabsContent>

          <TabsContent value="directories" className="mt-0 p-6">
            <p className="text-muted-foreground">Directories tab content coming soon...</p>
          </TabsContent>

          <TabsContent value="monetization" className="mt-0 p-6">
            <p className="text-muted-foreground">Monetization tab content coming soon...</p>
          </TabsContent>

          <TabsContent value="stats" className="mt-0 p-6">
            <p className="text-muted-foreground">Stats tab content coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!episodeToDelete} onOpenChange={() => setEpisodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this episode. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => episodeToDelete && deleteEpisode.mutate(episodeToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PodcastDetail;
