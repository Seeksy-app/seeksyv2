import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Mic, Music, Download, Rss, Copy, ExternalLink, Mail, Clock, Infinity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailVerificationWizard } from "@/components/podcast/EmailVerificationWizard";
import podcastStudio from "@/assets/podcast-studio.jpg";
import { useState } from "react";

const Podcasts = () => {
  const navigate = useNavigate();
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["podcasts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("podcasts")
        .select(`
          *,
          episodes(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Mic className="w-8 h-8 text-primary" />
              Podcasts
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your podcast shows, episodes, and RSS feeds
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/podcasts/import")}>
              <Download className="w-4 h-4 mr-2" />
              Import from RSS
            </Button>
            <Button onClick={() => navigate("/podcasts/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Podcast
            </Button>
          </div>
        </div>

        {/* Podcast Analytics Overview - Coming Soon */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Podcast Analytics
            </CardTitle>
            <CardDescription>
              Track downloads, listeners, and engagement across all your podcasts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Rss className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We're building comprehensive analytics to help you understand your audience and grow your podcast. Track downloads, listener demographics, episode performance, and more.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Podcasts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted/20" />
            ))}
          </div>
        ) : podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => {
              const episodeCount = podcast.episodes?.[0]?.count || 0;
              const hasVerificationEmail = !!podcast.verification_email;
              const isExpired = podcast.verification_email_expires_at && 
                new Date(podcast.verification_email_expires_at) < new Date();
              
              return (
                <Card
                  key={podcast.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/podcasts/${podcast.id}`)}
                >
                  {podcast.cover_image_url ? (
                    <img
                      src={podcast.cover_image_url}
                      alt={podcast.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {podcast.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {podcast.description || "No description"}
                    </p>
                    
                    {/* Individual Podcast RSS Feed */}
                    <div 
                      className="flex items-center gap-1.5 mb-2 p-2 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rssUrl = `https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/podcast-rss/${podcast.slug || podcast.id}`;
                        copyToClipboard(rssUrl, "RSS feed");
                      }}
                    >
                      <Rss className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <code className="text-[10px] flex-1 truncate text-muted-foreground">
                        seeksy.io/rss/{podcast.slug || podcast.id}
                      </code>
                      <Copy className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>

                    {hasVerificationEmail && !isExpired && (
                      <div 
                        className="flex items-center gap-1.5 mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md cursor-pointer hover:bg-yellow-500/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPodcast(podcast);
                          setVerificationDialogOpen(true);
                        }}
                      >
                        <Mail className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="text-[10px] text-yellow-500 dark:text-yellow-400 font-medium">
                          {podcast.verification_email_permanent ? (
                            <>
                              <Infinity className="h-3 w-3 inline mr-1" />
                              Email Verified
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 inline mr-1" />
                              Verified (48h)
                            </>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        podcast.is_published
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {podcast.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <img 
                src={podcastStudio} 
                alt="Professional podcast studio" 
                className="w-full h-64 object-cover"
              />
              <div className="p-12 text-center">
                <h3 className="text-2xl font-bold mb-2">No podcasts yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first podcast on Seeksy and start sharing your voice with the world
                </p>
                <Button size="lg" onClick={() => navigate("/podcasts/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Podcast
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Email Verification</DialogTitle>
            <DialogDescription>
              Manage your podcast verification email for directory submissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedPodcast && (
            <EmailVerificationWizard
              podcastId={selectedPodcast.id}
              podcastSlug={selectedPodcast.slug}
              currentEmail={selectedPodcast.verification_email}
              currentExpiration={selectedPodcast.verification_email_expires_at}
              currentPermanent={selectedPodcast.verification_email_permanent}
              onComplete={() => setVerificationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Podcasts;
