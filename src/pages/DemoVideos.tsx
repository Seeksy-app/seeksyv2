import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Upload, Sparkles, ChevronUp, ChevronDown, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { DemoVideoUpload } from "@/components/demo-videos/DemoVideoUpload";
import { useToast } from "@/hooks/use-toast";

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_featured: boolean;
  created_at: string;
}

export default function DemoVideos() {
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [generatingThumbnailId, setGeneratingThumbnailId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['demo-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Auto-select first video if none selected
  useState(() => {
    if (!selectedVideo && videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const categoryColors: Record<string, string> = {
    'Creator Tools': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Advertiser Tools': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Monetization': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Onboarding': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'AI Features': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    'Platform Overview': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ videoId, direction }: { videoId: string; direction: 'up' | 'down' }) => {
      const currentIndex = videos.findIndex(v => v.id === videoId);
      if (currentIndex === -1) return;
      
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= videos.length) return;

      const currentVideo = videos[currentIndex];
      const swapVideo = videos[swapIndex];

      // Swap order_index values
      await supabase.from('demo_videos').update({ order_index: swapVideo.order_index }).eq('id', currentVideo.id);
      await supabase.from('demo_videos').update({ order_index: currentVideo.order_index }).eq('id', swapVideo.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Order updated" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from('demo_videos').delete().eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Video deleted" });
      setSelectedVideo(null);
    },
  });

  // Generate thumbnail from video
  const generateThumbnail = useCallback(async (video: DemoVideo) => {
    setGeneratingThumbnailId(video.id);
    try {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.preload = 'metadata';
      videoEl.muted = true;
      videoEl.src = video.video_url;

      await new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = () => {
          videoEl.currentTime = Math.min(2, videoEl.duration * 0.1);
        };
        videoEl.onseeked = resolve;
        videoEl.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
        });

        // Upload to storage
        const fileName = `thumb_${Date.now()}_${video.id}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('demo-videos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('demo-videos')
          .getPublicUrl(fileName);

        // Update database
        await supabase.from('demo_videos').update({ thumbnail_url: publicUrl }).eq('id', video.id);
        
        queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
        queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
        toast({ title: "Thumbnail generated!" });
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      toast({ variant: "destructive", title: "Failed to generate thumbnail" });
    } finally {
      setGeneratingThumbnailId(null);
    }
  }, [queryClient, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Demo Video Library
            </h1>
            <p className="text-muted-foreground mt-2">
              Board-ready product demos and feature showcases
            </p>
          </div>
          {user && (
            <Button
              onClick={() => setShowUpload(!showUpload)}
              size="lg"
              variant={showUpload ? "outline" : "default"}
            >
              <Upload className="mr-2 h-4 w-4" />
              {showUpload ? "Hide Upload" : "Upload Video"}
            </Button>
          )}
        </div>

        {/* Upload Section (Admin Only) */}
        {showUpload && user && (
          <DemoVideoUpload onSuccess={() => setShowUpload(false)} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading demo videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Play className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No demo videos yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Upload your first board-ready demo video to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Player */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {selectedVideo && (
                    <>
                      {/* Video Player */}
                      <div className="aspect-video bg-black relative group">
                        <video
                          key={selectedVideo.id}
                          src={selectedVideo.video_url}
                          controls
                          autoPlay
                          className="w-full h-full"
                          poster={selectedVideo.thumbnail_url || undefined}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      {/* Video Info */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={categoryColors[selectedVideo.category] || ''}
                              >
                                {selectedVideo.category}
                              </Badge>
                              {selectedVideo.duration_seconds && (
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(selectedVideo.duration_seconds)}
                                </Badge>
                              )}
                              {selectedVideo.is_featured && (
                                <Badge variant="default" className="gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                          {user && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this video?')) {
                                  deleteMutation.mutate(selectedVideo.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {selectedVideo.description && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                            <p className="text-sm leading-relaxed">{selectedVideo.description}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Playlist */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Playlist</CardTitle>
                  <CardDescription>
                    {videos.length} {videos.length === 1 ? 'video' : 'videos'} available
                    {user && <span className="block text-xs mt-1">Use arrows to reorder</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {videos.map((video, index) => (
                        <div
                          key={video.id}
                          className={`rounded-lg border transition-all ${
                            selectedVideo?.id === video.id
                              ? 'border-primary bg-accent/50'
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="w-full text-left"
                          >
                            <div className="p-3 space-y-2">
                              {/* Thumbnail */}
                              <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-900 rounded-md overflow-hidden relative">
                                {video.thumbnail_url ? (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : null}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="h-8 w-8 text-muted-foreground" />
                                </div>
                                {video.duration_seconds && (
                                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                    {formatDuration(video.duration_seconds)}
                                  </div>
                                )}
                                {selectedVideo?.id === video.id && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                                      <Play className="h-6 w-6" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div>
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  {video.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${categoryColors[video.category] || ''}`}
                                >
                                  {video.category}
                                </Badge>
                              </div>
                            </div>
                          </button>

                          {/* Admin controls */}
                          {user && (
                            <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => reorderMutation.mutate({ videoId: video.id, direction: 'up' })}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => reorderMutation.mutate({ videoId: video.id, direction: 'down' })}
                                  disabled={index === videos.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              {!video.thumbnail_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => generateThumbnail(video)}
                                  disabled={generatingThumbnailId === video.id}
                                >
                                  {generatingThumbnailId === video.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                  )}
                                  Gen Thumb
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}