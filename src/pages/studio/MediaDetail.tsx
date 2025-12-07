import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SocialPublishModal } from "@/components/clips/SocialPublishModal";
import { YouTubePublishModal } from "@/components/studio/YouTubePublishModal";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, Clock, Calendar, Download, Share2,
  Scissors, Wand2, FileText, Layers, Volume2, Palette, Mic,
  Sparkles, Copy, Instagram, Youtube, Video,
  CheckCircle, AlertCircle, Loader2, Eye, Heart, MessageSquare,
  ThumbsUp, BarChart2, DollarSign, Info
} from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
  source?: string | null;
  external_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;
}

interface Clip {
  id: string;
  title: string;
  status: string;
  duration_seconds: number | null;
  vertical_url: string | null;
  thumbnail_url: string | null;
  hook_score: number | null;
  created_at: string;
}

interface TranscriptData {
  id: string;
  raw_text: string | null;
  created_at: string;
}

interface AIJob {
  id: string;
  job_type: string;
  status: string;
  params: Record<string, unknown> | null;
  completed_at: string | null;
  created_at: string;
}

interface EnhancedAsset {
  id: string;
  source_media_id: string;
  ai_job_id: string;
  output_type: string;
  storage_path: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Publish status type
type PublishStatus = 'not_published' | 'published_youtube' | 'published_tiktok' | 'published_instagram';

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [preSelectedPlatform, setPreSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | null>(null);
  const [showAdSubmitModal, setShowAdSubmitModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  
  // Local state for demo publish/ad status
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('not_published');
  const [adStatus, setAdStatus] = useState<'none' | 'pending_review' | 'active'>('none');

  // Fetch media file
  const { data: media, isLoading: loadingMedia } = useQuery({
    queryKey: ["media-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as MediaFile;
    },
    enabled: !!id,
  });

  // Fetch clips for this media
  const { data: clips } = useQuery({
    queryKey: ["media-clips", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as Clip[];
    },
    enabled: !!id,
  });

  // Fetch AI jobs for this media
  const { data: aiJobs } = useQuery({
    queryKey: ["media-ai-jobs", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as AIJob[];
    },
    enabled: !!id,
  });

  // Fetch transcripts
  const { data: transcripts } = useQuery({
    queryKey: ["media-transcripts", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("transcripts")
        .select("id, raw_text, created_at")
        .eq("asset_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as TranscriptData[];
    },
    enabled: !!id,
  });

  // Fetch enhanced assets from AI processing
  const { data: enhancedAssets, isLoading: loadingEnhanced } = useQuery({
    queryKey: ["media-enhanced-assets", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ai_edited_assets")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as EnhancedAsset[];
    },
    enabled: !!id,
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, { label: string; className: string }> = {
      youtube: { label: "YouTube", className: "bg-red-500/90 text-white" },
      zoom: { label: "Zoom", className: "bg-blue-500/90 text-white" },
      riverside: { label: "Riverside", className: "bg-purple-500/90 text-white" },
      studio: { label: "Studio", className: "bg-green-500/90 text-white" },
      upload: { label: "Upload", className: "bg-muted text-muted-foreground" },
    };
    return labels[source || "upload"] || labels.upload;
  };

  // Check if video has been AI processed
  const hasAIProcessing = aiJobs && aiJobs.length > 0;
  const completedJobs = aiJobs?.filter(j => j.status === "completed") || [];
  const latestTranscript = transcripts?.[0];
  
  // Get enhanced video from AI processing - prioritize over source video
  const enhancedVideo = enhancedAssets?.find(a => a.output_type === 'enhanced_video' || a.output_type === 'processed');
  const enhancedVideoUrl = enhancedVideo?.storage_path || null;
  const enhancedThumbnail = enhancedVideo?.thumbnail_url || null;
  
  // Processing state detection
  const isProcessing = aiJobs?.some(j => j.status === 'pending' || j.status === 'processing') || false;
  const processingFailed = aiJobs?.some(j => j.status === 'failed') && !enhancedVideo;

  // Determine video source priority: Enhanced > Processed > Cloudflare > Original
  // Check if this is a YouTube source without downloaded file
  const isYouTubeSource = media?.source === 'youtube';
  const hasDownloadedFile = media?.cloudflare_download_url || (media?.file_url && !media.file_url.includes('youtube.com'));
  const isYouTubeEmbed = isYouTubeSource && !hasDownloadedFile;
  
  // For YouTube embeds, extract video ID
  const youtubeVideoId = isYouTubeEmbed && media?.external_id ? media.external_id : null;
  
  // Primary video URL - don't use YouTube URL directly
  const primaryVideoUrl = enhancedVideoUrl || (hasDownloadedFile ? (media?.cloudflare_download_url || media?.file_url) : null);
  const primaryThumbnail = enhancedThumbnail || media?.thumbnail_url;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/studio/media/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Share link copied to clipboard" });
  };

  const handleDownload = () => {
    if (primaryVideoUrl) {
      window.open(primaryVideoUrl, "_blank");
    }
  };

  const handlePublishToSocial = (clip?: Clip, platform?: 'youtube' | 'instagram' | 'tiktok') => {
    setSelectedClip(clip || null);
    setPreSelectedPlatform(platform || null);
    setShowSocialModal(true);
  };

  const handlePostToYouTube = () => {
    // Simulate YouTube publish
    console.log("Simulated YouTube publish", { videoId: id });
    setPublishStatus('published_youtube');
    toast({
      title: "Queued for YouTube",
      description: "Your video has been queued for YouTube. Analytics will start updating once views come in.",
    });
    setShowSocialModal(false);
  };

  const handleSubmitForAds = () => {
    console.log("Video submitted for ads", { videoId: id, slots: 3, estimatedCPM: 18.50 });
    setAdStatus('pending_review');
    setShowAdSubmitModal(false);
    toast({
      title: "Submitted for Ads",
      description: "Your video has been submitted to Seeksy Ads. Our team will review and start serving ads when it's approved.",
    });
  };

  // Check if published
  const isPublished = publishStatus !== 'not_published';
  const isAdEnabled = adStatus !== 'none';

  // Analytics cards - show real data only
  const analyticsCards = [
    { label: "Total Views", value: 0, icon: Eye, noData: true },
    { label: "Likes", value: 0, icon: ThumbsUp, noData: true },
    { label: "Shares", value: 0, icon: Share2, noData: true },
    { label: "Comments", value: 0, icon: MessageSquare, noData: true },
    { label: "Avg Watch Time", value: "—", icon: Clock, noData: true, isTime: true },
    { label: "Completion Rate", value: "—", icon: BarChart2, noData: true, isPercent: true },
    { label: "Engagement Rate", value: "—", icon: Heart, noData: true, isPercent: true },
  ];

  if (loadingMedia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Media not found</h2>
        <Button onClick={() => navigate("/studio/media")}>Back to Library</Button>
      </div>
    );
  }

  const sourceInfo = getSourceLabel(media.source);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio/media")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground text-sm">Media Library</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[300px]">{media.file_name || "Untitled"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button size="sm" onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}>
            <Wand2 className="w-4 h-4 mr-2" />
            AI Enhance
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                {/* Processing state */}
                {isProcessing && !primaryVideoUrl && !isYouTubeEmbed ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#053877]/20 to-[#2C6BED]/20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-white font-medium">Processing your video...</p>
                    <p className="text-white/60 text-sm mt-1">AI enhancement in progress</p>
                  </div>
                ) : processingFailed && !primaryVideoUrl && !isYouTubeEmbed ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-white font-medium">Processing failed</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Retry AI Enhancement
                    </Button>
                  </div>
                ) : isYouTubeEmbed && youtubeVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={media?.file_name || "YouTube Video"}
                  />
                ) : primaryVideoUrl ? (
                  <video
                    src={primaryVideoUrl}
                    className="w-full h-full"
                    controls
                    poster={primaryThumbnail || undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="w-16 h-16 text-white/20" />
                  </div>
                )}
                
                {/* Enhanced badge overlay */}
                {enhancedVideo && (
                  <Badge className="absolute top-3 left-3 bg-green-500 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-semibold mb-2">{media.file_name || "Untitled Video"}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(media.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {media.created_at ? format(new Date(media.created_at), "MMM d, yyyy") : "—"}
                      </span>
                      <Badge className={sourceInfo.className}>{sourceInfo.label}</Badge>
                      {hasAIProcessing && completedJobs.length > 0 && (
                        <Badge className="bg-green-500/90 text-white">Enhanced</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {media.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{media.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Analytics Tabs - Enhancements First */}
            <Card>
              <Tabs defaultValue="enhancements" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="w-full grid grid-cols-3 bg-muted">
                    <TabsTrigger value="enhancements" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Enhancements
                    </TabsTrigger>
                    <TabsTrigger value="clips" className="flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Clips
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Enhancements Tab */}
                  <TabsContent value="enhancements" className="mt-0">
                    {!hasAIProcessing ? (
                      <div className="text-center py-8">
                        <Wand2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="font-medium mb-1">No AI enhancements yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isYouTubeEmbed 
                            ? "Generate AI clips from this YouTube video, or enhance it with AI post-production"
                            : "Enhance your video with AI-powered post-production"
                          }
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/studio/clips?media=${id}`)}
                          >
                            <Scissors className="w-4 h-4 mr-2" />
                            Generate AI Clips
                          </Button>
                          <Button onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}>
                            <Wand2 className="w-4 h-4 mr-2" />
                            AI Enhancement
                          </Button>
                        </div>
                        {isYouTubeEmbed && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Note: AI enhancement requires downloading the video first
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">Chapters</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {completedJobs.find(j => j.job_type === 'chapters') ? '✓' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">Auto-detected</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-green-500" />
                            <span className="font-medium">Transcript</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {latestTranscript ? '✓' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {latestTranscript ? 'Words transcribed' : 'Not generated'}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Mic className="w-5 h-5 text-orange-500" />
                            <span className="font-medium">Filler Removal</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {completedJobs.find(j => j.job_type === 'filler_removal') ? '✓' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">Processed</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="w-5 h-5 text-purple-500" />
                            <span className="font-medium">Audio Enhanced</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {completedJobs.find(j => j.job_type === 'audio_enhancement') ? '✓' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">Noise reduced</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-5 h-5 text-pink-500" />
                            <span className="font-medium">Color Grading</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {completedJobs.find(j => j.job_type === 'color_correction') ? '✓' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">Applied</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Scissors className="w-5 h-5 text-cyan-500" />
                            <span className="font-medium">Clips Generated</span>
                          </div>
                          <p className="text-2xl font-bold">{clips?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Ready to share</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Clips Tab */}
                  <TabsContent value="clips" className="mt-0">
                    {!clips || clips.length === 0 ? (
                      <div className="text-center py-8">
                        <Scissors className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="font-medium mb-1">No clips generated yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate viral clips from your video with AI
                        </p>
                        <Button onClick={() => navigate(`/studio/clips?media=${id}`)}>
                          <Scissors className="w-4 h-4 mr-2" />
                          Generate Clips
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{clips.length} clips generated</p>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/studio/clips?media=${id}`)}>
                            Generate More
                          </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {clips.slice(0, 6).map((clip) => (
                            <div
                              key={clip.id}
                              className="group relative aspect-[9/16] rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={() => handlePublishToSocial(clip)}
                            >
                              {clip.thumbnail_url ? (
                                <img
                                  src={clip.thumbnail_url}
                                  alt={clip.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Scissors className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm font-medium truncate">{clip.title}</p>
                                <p className="text-white/70 text-xs">{formatDuration(clip.duration_seconds)}</p>
                              </div>
                              {clip.hook_score && (
                                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                                  {Math.round(clip.hook_score * 100)}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        {clips.length > 6 && (
                          <div className="text-center">
                            <Button variant="link" onClick={() => navigate(`/studio/clips?media=${id}`)}>
                              View all {clips.length} clips
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={isPublished ? "default" : "secondary"}>
                        {isPublished ? `Published to ${publishStatus.replace('published_', '').charAt(0).toUpperCase() + publishStatus.replace('published_', '').slice(1)}` : "Not yet published"}
                      </Badge>
                    </div>
                    
                    {/* Info banner */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Analytics will start updating once this video is published to social.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {analyticsCards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.label} className="p-4 rounded-lg border bg-card text-center">
                            <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-2xl font-bold">
                              {card.noData ? (card.isTime || card.isPercent ? "—" : "0") : card.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {card.noData 
                                ? (card.isTime || card.isPercent 
                                    ? "Analytics start after first publish" 
                                    : `No ${card.label.toLowerCase()} yet`)
                                : card.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Generated Clips Section */}
            {clips && clips.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-primary" />
                      Generated Clips
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/studio/clips?media=${id}`)}>
                      Generate More
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="group rounded-lg border overflow-hidden hover:border-primary/50 transition-all"
                      >
                        <div className="aspect-[9/16] max-h-40 bg-muted relative">
                          {clip.thumbnail_url ? (
                            <img src={clip.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Scissors className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                          )}
                          <Badge className="absolute bottom-2 right-2 text-xs bg-black/60 text-white border-0">
                            {formatDuration(clip.duration_seconds)}
                          </Badge>
                          {clip.hook_score && (
                            <Badge className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground">
                              Hook: {clip.hook_score}%
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-sm truncate mb-2">{clip.title || "Untitled Clip"}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              onClick={() => navigate(`/studio/clips?clipId=${clip.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs h-8"
                              onClick={() => handlePublishToSocial(clip)}
                            >
                              Publish
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Export & Share */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePublishToSocial(undefined, 'instagram')}
                >
                  <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                  Publish to Instagram
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePublishToSocial(undefined, 'tiktok')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Publish to TikTok
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePublishToSocial(undefined, 'youtube')}
                >
                  <Youtube className="w-4 h-4 mr-2 text-red-500" />
                  Publish to YouTube Shorts
                </Button>
              </CardContent>
            </Card>

            {/* File Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(media.duration_seconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{formatFileSize(media.file_size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{media.file_type || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge className={sourceInfo.className}>{sourceInfo.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="font-medium">
                    {media.created_at
                      ? formatDistanceToNow(new Date(media.created_at), { addSuffix: true })
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Transcript Preview */}
            {latestTranscript && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Transcript</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Full
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-6">
                    {latestTranscript.raw_text || "No transcript text available"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Social Publish Modal */}
      <SocialPublishModal
        open={showSocialModal}
        onOpenChange={setShowSocialModal}
        clip={selectedClip ? {
          id: selectedClip.id,
          title: selectedClip.title,
          thumbnail_url: selectedClip.thumbnail_url,
          file_url: selectedClip.vertical_url,
          duration_seconds: selectedClip.duration_seconds,
        } : media ? {
          id: media.id,
          title: media.file_name || "Untitled",
          file_url: primaryVideoUrl,
          thumbnail_url: primaryThumbnail,
          duration_seconds: media.duration_seconds,
        } : null}
      />

      {/* Submit for Ads Modal */}
      <Dialog open={showAdSubmitModal} onOpenChange={setShowAdSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2C6BED]" />
              Submit this video to Seeksy Ads?
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>We'll add this video to our ad marketplace.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>3 ad slots</strong> will be inserted (pre-roll / mid-roll / post-roll)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Estimated payout: <strong>$18.50</strong> per 1,000 impressions (CPM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>You'll earn revenue whenever this video is shown with ads</span>
                </li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdSubmitModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#053877] to-[#2C6BED]"
              onClick={handleSubmitForAds}
            >
              Yes, submit for ads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Publish Modal */}
      <YouTubePublishModal
        open={showYouTubeModal}
        onOpenChange={setShowYouTubeModal}
        video={media ? {
          id: media.id,
          title: media.file_name || "Untitled",
          description: media.description || "",
          file_url: primaryVideoUrl,
          thumbnail_url: primaryThumbnail,
          duration_seconds: media.duration_seconds,
        } : null}
      />
    </div>
  );
}
