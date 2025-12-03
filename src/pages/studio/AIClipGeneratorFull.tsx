import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Play, Pause, Scissors, Wand2, Download, Share2, 
  ChevronLeft, Clock, Sparkles, Volume2, VolumeX,
  Instagram, Youtube, Music2, Maximize2, Flag,
  Zap, MessageSquare, Heart, TrendingUp, Image,
  Monitor, Smartphone, Square, RotateCcw, Check,
  FileVideo, Loader2, RefreshCw, Palette, Type,
  Upload, Move, Crop, LayoutGrid, PictureInPicture,
  FileText, Music, List, ZoomIn, ZoomOut, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipSuggestion {
  id: string;
  start: number;
  end: number;
  title: string;
  type: "emotion" | "keyword" | "manual" | "ai" | "realtime";
  confidence: number;
  transcript?: string;
  hook?: string;
}

interface CreatedClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  aspectRatio: string;
  stylePreset: string;
  thumbnailUrl?: string;
  status: "pending" | "processing" | "complete" | "failed";
  exportUrl?: string;
}

interface PipPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StylePreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  layout: string;
  captionStyle: string;
  defaultRatio: string;
  musicEnabled: boolean;
}

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

const stylePresets: StylePreset[] = [
  { id: "viral", name: "Viral Vertical", description: "Optimized for TikTok & Reels", icon: TrendingUp, layout: "vertical-center", captionStyle: "bold-pop", defaultRatio: "9:16", musicEnabled: true },
  { id: "motivational", name: "Motivational", description: "Inspiring content with clean text", icon: Zap, layout: "vertical-bottom", captionStyle: "gradient-glow", defaultRatio: "9:16", musicEnabled: true },
  { id: "educational", name: "Educational", description: "Clear, readable captions", icon: MessageSquare, layout: "pip-bottom", captionStyle: "clean-white", defaultRatio: "9:16", musicEnabled: false },
  { id: "podcast", name: "Podcast Split-Screen", description: "Guest & host layout", icon: Monitor, layout: "split-screen", captionStyle: "minimal", defaultRatio: "9:16", musicEnabled: false },
  { id: "reaction", name: "Reaction Style", description: "PiP with facial focus", icon: Heart, layout: "pip-corner", captionStyle: "emoji-react", defaultRatio: "9:16", musicEnabled: true },
];

const layoutPresets = [
  { id: "full", name: "Full Screen", icon: Maximize2 },
  { id: "pip-top-right", name: "PiP Top Right", icon: PictureInPicture },
  { id: "pip-bottom-right", name: "PiP Bottom Right", icon: PictureInPicture },
  { id: "split-horizontal", name: "Side by Side", icon: LayoutGrid },
  { id: "split-vertical", name: "Stacked", icon: LayoutGrid },
];

const captionThemes = [
  { id: "bold-pop", name: "Bold Pop", preview: "font-bold text-white drop-shadow-lg" },
  { id: "gradient-glow", name: "Gradient Glow", preview: "font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" },
  { id: "clean-white", name: "Clean White", preview: "font-medium text-white bg-black/50 px-2 py-1 rounded" },
  { id: "minimal", name: "Minimal", preview: "font-normal text-white/90" },
  { id: "emoji-react", name: "Emoji React", preview: "font-bold text-yellow-400" },
  { id: "none", name: "No Captions", preview: "hidden" },
];

const musicTracks = [
  { id: "upbeat", name: "Upbeat Energy", category: "energetic" },
  { id: "chill", name: "Chill Vibes", category: "relaxed" },
  { id: "dramatic", name: "Dramatic Impact", category: "cinematic" },
  { id: "motivational", name: "Motivational Rise", category: "inspiring" },
  { id: "none", name: "No Music", category: "none" },
];

const aspectRatios = [
  { id: "9:16", label: "9:16", description: "TikTok / Reels", icon: Smartphone },
  { id: "1:1", label: "1:1", description: "Instagram", icon: Square },
  { id: "16:9", label: "16:9", description: "YouTube", icon: Monitor },
];

const exportFormats = [
  { id: "mp4", label: "MP4", description: "Best quality" },
  { id: "mov", label: "MOV", description: "Apple compatible" },
  { id: "gif", label: "GIF", description: "Social previews" },
];

export default function AIClipGeneratorFull() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("mediaId");
  const fromRealtime = searchParams.get("from") === "realtime";
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Clip state
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [clipTitle, setClipTitle] = useState("My Clip");
  
  // Style state
  const [selectedPreset, setSelectedPreset] = useState<string>("viral");
  const [selectedRatio, setSelectedRatio] = useState<string>("9:16");
  const [selectedLayout, setSelectedLayout] = useState<string>("full");
  const [selectedCaptionTheme, setSelectedCaptionTheme] = useState<string>("bold-pop");
  const [selectedMusic, setSelectedMusic] = useState<string>("upbeat");
  const [musicEnabled, setMusicEnabled] = useState(true);
  
  // PiP state
  const [pipPosition, setPipPosition] = useState<PipPosition>({ x: 70, y: 70, width: 25, height: 30 });
  const [isDraggingPip, setIsDraggingPip] = useState(false);
  const [isResizingPip, setIsResizingPip] = useState(false);
  
  // Processing state
  const [selectedFormat, setSelectedFormat] = useState<string>("mp4");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Created clips
  const [createdClips, setCreatedClips] = useState<CreatedClip[]>([]);
  const [exportQueue, setExportQueue] = useState<CreatedClip[]>([]);
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([
    { id: "1", start: 0, end: 5, text: "Welcome back to the show everyone..." },
    { id: "2", start: 5, end: 12, text: "Today we're going to talk about something really exciting..." },
    { id: "3", start: 12, end: 20, text: "This is the moment that changed everything for me..." },
    { id: "4", start: 20, end: 30, text: "And I think it's going to change things for you too..." },
  ]);
  const [showTranscript, setShowTranscript] = useState(true);

  const [clipSuggestions, setClipSuggestions] = useState<ClipSuggestion[]>([
    { id: "1", start: 12, end: 42, title: "Emotional moment", type: "emotion", confidence: 94, transcript: "This is the moment that changed everything...", hook: "Watch what happens next..." },
    { id: "2", start: 65, end: 95, title: "Key insight", type: "keyword", confidence: 88, transcript: "The three things you need to know about...", hook: "Nobody talks about this..." },
    { id: "3", start: 120, end: 150, title: "Viral hook", type: "ai", confidence: 91, transcript: "Here's what nobody tells you about...", hook: "This will change how you think..." },
    { id: "4", start: 200, end: 230, title: "Strong opener", type: "ai", confidence: 87, transcript: "Stop scrolling. This is important...", hook: "If you only watch one clip today..." },
  ]);

  const { data: mediaFile, isLoading: mediaLoading } = useQuery({
    queryKey: ["media-file", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, duration_seconds")
        .eq("id", mediaId)
        .single();
      return data as { 
        id: string; 
        file_name: string; 
        file_url: string;
        duration_seconds: number | null;
      } | null;
    },
    enabled: !!mediaId,
  });

  type RealtimeClip = {
    id: string;
    title: string | null;
    status: string | null;
    created_at: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
  };

  const { data: realtimeClips } = useQuery({
    queryKey: ["realtime-clips"],
    queryFn: async (): Promise<RealtimeClip[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Use explicit query to avoid deep type instantiation
      const result = await (supabase as any)
        .from("clips")
        .select("id, title, status, created_at, thumbnail_url, duration_seconds")
        .eq("user_id", user.id)
        .eq("source", "realtime_ai")
        .order("created_at", { ascending: false })
        .limit(10);
      
      return (result.data || []) as RealtimeClip[];
    },
    enabled: fromRealtime,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setClipEnd(Math.min(30, video.duration));
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const addMarker = () => {
    setMarkers([...markers, currentTime]);
    toast({ title: "Marker added", description: `at ${formatTime(currentTime)}` });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTypeIcon = (type: ClipSuggestion["type"]) => {
    switch (type) {
      case "emotion": return Heart;
      case "keyword": return MessageSquare;
      case "ai": return Sparkles;
      case "realtime": return Zap;
      case "manual": return Flag;
      default: return Zap;
    }
  };

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId,
          fileUrl: mediaFile?.file_url,
          duration: mediaFile?.duration_seconds,
        },
      });

      if (error) throw error;

      if (data?.clips) {
        setClipSuggestions(data.clips.map((c: any, i: number) => ({
          id: `${i}`,
          start: c.start_time,
          end: c.end_time,
          title: c.title,
          type: "ai",
          confidence: c.virality_score,
          transcript: c.description,
          hook: c.hook,
        })));
      }

      toast({ title: "Analysis complete", description: `Found ${data?.clips?.length || 0} clips` });
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateThumbnails = async () => {
    setGeneratingThumbnails(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-thumbnail", {
        body: {
          videoTitle: clipTitle,
          videoDescription: selectedClip?.transcript || "Video clip",
          style: selectedPreset,
          count: 4,
        },
      });

      if (error) throw error;

      if (data?.thumbnails) {
        setThumbnails(data.thumbnails);
      } else if (data?.imageUrl) {
        setThumbnails([data.imageUrl]);
      }
      toast({ title: "Thumbnails generated", description: "Choose your favorite" });
    } catch (error) {
      // Fallback to placeholder thumbnails
      setThumbnails([
        `https://picsum.photos/seed/${Date.now()}/320/180`,
        `https://picsum.photos/seed/${Date.now() + 1}/320/180`,
        `https://picsum.photos/seed/${Date.now() + 2}/320/180`,
        `https://picsum.photos/seed/${Date.now() + 3}/320/180`,
      ]);
      toast({ title: "Thumbnails generated", description: "Choose your favorite" });
    } finally {
      setGeneratingThumbnails(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    setCustomThumbnail(file);
    const url = URL.createObjectURL(file);
    setSelectedThumbnail(url);
    toast({ title: "Thumbnail uploaded", description: "Custom thumbnail selected" });
  };

  const handleCreateClip = async () => {
    const newClip: CreatedClip = {
      id: `clip-${Date.now()}`,
      title: clipTitle,
      startTime: clipStart,
      endTime: clipEnd,
      aspectRatio: selectedRatio,
      stylePreset: selectedPreset,
      thumbnailUrl: selectedThumbnail || undefined,
      status: "pending",
    };
    
    setCreatedClips([...createdClips, newClip]);
    toast({ title: "Clip created", description: `"${clipTitle}" added to My Clips` });
  };

  const handleExport = async () => {
    if (createdClips.length === 0 && !selectedClip) {
      toast({ title: "No clip selected", description: "Create or select a clip first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setExportProgress(i);
      }

      // Save to Media Library
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("media_files").insert({
          user_id: user.id,
          file_name: `${clipTitle}_${selectedRatio.replace(":", "x")}.${selectedFormat}`,
          file_type: "video",
          file_url: mediaFile?.file_url || "",
          duration_seconds: clipEnd - clipStart,
          status: "ready",
        });

        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["media-files"] });
        }
      }

      // Add to export queue
      const exportedClip: CreatedClip = {
        id: `export-${Date.now()}`,
        title: clipTitle,
        startTime: clipStart,
        endTime: clipEnd,
        aspectRatio: selectedRatio,
        stylePreset: selectedPreset,
        thumbnailUrl: selectedThumbnail || undefined,
        status: "complete",
        exportUrl: "#",
      };
      setExportQueue([exportedClip, ...exportQueue]);

      toast({ 
        title: "Clip saved to Media Library", 
        description: `${selectedRatio} clip exported as ${selectedFormat.toUpperCase()}` 
      });
    } catch (error) {
      toast({ title: "Export failed", description: "Please try again", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setExportProgress(0);
    }
  };

  const handleSelectClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setClipStart(clip.start);
    setClipEnd(clip.end);
    setClipTitle(clip.title);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start;
    }
  };

  const handleTranscriptClick = (segment: TranscriptSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = segment.start;
      setCurrentTime(segment.start);
    }
  };

  const handlePresetChange = (presetId: string) => {
    const preset = stylePresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setSelectedRatio(preset.defaultRatio);
      setMusicEnabled(preset.musicEnabled);
      
      // Set layout based on preset
      if (presetId === "podcast") {
        setSelectedLayout("split-horizontal");
      } else if (presetId === "reaction") {
        setSelectedLayout("pip-top-right");
      } else {
        setSelectedLayout("full");
      }
    }
  };

  const videoUrl = mediaFile?.file_url;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">AI Clip Generator</h1>
            <p className="text-xs text-muted-foreground">
              {mediaFile?.file_name || "Select a video"}
              {fromRealtime && " • From Realtime Clips"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {exportProgress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </Button>
          <Button size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Video Preview + Transcript */}
        <div className="w-1/2 border-r border-border flex flex-col">
          {/* Layout Controls */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Layout:</span>
            {layoutPresets.map((layout) => (
              <Button
                key={layout.id}
                variant={selectedLayout === layout.id ? "default" : "outline"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setSelectedLayout(layout.id)}
              >
                <layout.icon className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">{layout.name}</span>
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Transcript
              </Button>
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black/95 flex items-center justify-center p-4 relative">
            <div className={cn(
              "relative bg-muted rounded-xl overflow-hidden shadow-2xl",
              selectedRatio === "9:16" && "w-full max-w-sm aspect-[9/16]",
              selectedRatio === "1:1" && "w-full max-w-md aspect-square",
              selectedRatio === "16:9" && "w-full max-w-2xl aspect-video"
            )}>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  onClick={togglePlay}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a video to generate clips</p>
                  </div>
                </div>
              )}
              
              {/* Draggable PiP Preview */}
              {(selectedLayout.includes("pip") || selectedPreset === "podcast" || selectedPreset === "reaction") && (
                <div 
                  ref={pipRef}
                  className="absolute bg-muted/90 rounded-lg border-2 border-white/30 backdrop-blur-sm flex items-center justify-center cursor-move hover:border-primary/50 transition-colors group"
                  style={{
                    width: `${pipPosition.width}%`,
                    height: `${pipPosition.height}%`,
                    right: `${100 - pipPosition.x - pipPosition.width}%`,
                    top: selectedLayout === "pip-bottom-right" ? "auto" : `${100 - pipPosition.y - pipPosition.height}%`,
                    bottom: selectedLayout === "pip-bottom-right" ? "4%" : "auto",
                  }}
                >
                  <div className="text-center">
                    <PictureInPicture className="w-5 h-5 text-white/50 mx-auto" />
                    <span className="text-[10px] text-white/70">PiP</span>
                  </div>
                  {/* Resize handle */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white/50" />
                  </div>
                </div>
              )}

              {/* Caption Preview */}
              {selectedClip && selectedCaptionTheme !== "none" && (
                <div className={cn(
                  "absolute left-4 right-4 text-center",
                  selectedLayout.includes("pip") ? "bottom-20" : "bottom-12"
                )}>
                  <p className={cn(
                    "text-lg drop-shadow-lg px-2 py-1 rounded inline-block",
                    captionThemes.find(t => t.id === selectedCaptionTheme)?.preview || "text-white font-bold"
                  )}>
                    {selectedClip.hook || selectedClip.title}
                  </p>
                </div>
              )}

              {/* Play button overlay */}
              {!isPlaying && videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button size="lg" variant="secondary" className="rounded-full w-16 h-16" onClick={togglePlay}>
                    <Play className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Panel (collapsible) */}
          {showTranscript && (
            <div className="h-32 border-t border-border bg-muted/30 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-1">
                  {transcript.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => handleTranscriptClick(segment)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        currentTime >= segment.start && currentTime < segment.end
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="text-xs text-muted-foreground mr-2">{formatTime(segment.start)}</span>
                      {segment.text}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Video Controls */}
          <div className="p-4 border-t border-border space-y-4">
            {/* Timeline with Waveform */}
            <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const newTime = percent * (duration || 1);
                setCurrentTime(newTime);
                if (videoRef.current) videoRef.current.currentTime = newTime;
              }}
            >
              {/* Waveform visualization */}
              <div className="absolute inset-0 flex items-center justify-center gap-px px-2">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-colors",
                      (i / 100) * (duration || 1) >= clipStart && (i / 100) * (duration || 1) <= clipEnd
                        ? "bg-primary/60"
                        : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${20 + Math.random() * 60}%` }}
                  />
                ))}
              </div>
              
              {/* Clip range highlight */}
              <div 
                className="absolute inset-y-0 bg-primary/10 border-l-2 border-r-2 border-primary"
                style={{ 
                  left: `${(clipStart / (duration || 1)) * 100}%`,
                  width: `${((clipEnd - clipStart) / (duration || 1)) * 100}%`
                }}
              />

              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
              />

              {/* Markers */}
              {markers.map((marker, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-1 h-full bg-yellow-400/80 rounded"
                  style={{ left: `${(marker / (duration || 1)) * 100}%` }}
                />
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={addMarker}>
                  <Flag className="w-3.5 h-3.5" />
                  Marker
                </Button>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <Slider
                    value={[volume]}
                    max={100}
                    className="w-20"
                    onValueChange={([v]) => setVolume(v)}
                  />
                </div>
              </div>
            </div>

            {/* Clip Range */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Clip Range</span>
                <span className="text-xs text-muted-foreground">{formatTime(clipEnd - clipStart)} duration</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Start</label>
                  <input 
                    type="text" 
                    value={formatTime(clipStart)} 
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">End</label>
                  <input 
                    type="text" 
                    value={formatTime(clipEnd)} 
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    readOnly
                  />
                </div>
                <Button size="sm" className="gap-1.5 mt-5" onClick={handleExport} disabled={isGenerating}>
                  <Scissors className="w-3.5 h-3.5" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex flex-col">
          <Tabs defaultValue={fromRealtime ? "realtime" : "suggestions"} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-4 h-12 rounded-none border-b border-border bg-transparent flex-wrap">
              <TabsTrigger value="suggestions" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions
              </TabsTrigger>
              <TabsTrigger value="myclips" className="gap-2">
                <List className="w-4 h-4" />
                My Clips
              </TabsTrigger>
              {fromRealtime && (
                <TabsTrigger value="realtime" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Realtime
                </TabsTrigger>
              )}
              <TabsTrigger value="style" className="gap-2">
                <Palette className="w-4 h-4" />
                Style
              </TabsTrigger>
              <TabsTrigger value="thumbnails" className="gap-2">
                <Image className="w-4 h-4" />
                Thumbnails
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* AI Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      {clipSuggestions.length} clips detected
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={handleReanalyze}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Re-analyze
                    </Button>
                  </div>

                  {clipSuggestions.map((clip) => {
                    const TypeIcon = getTypeIcon(clip.type);
                    return (
                      <Card
                        key={clip.id}
                        onClick={() => handleSelectClip(clip)}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedClip?.id === clip.id && "ring-2 ring-primary"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-20 h-28 rounded-lg bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                              {videoUrl && (
                                <video
                                  src={`${videoUrl}#t=${clip.start}`}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm">{clip.title}</h3>
                                <Badge variant="outline" className="text-xs gap-1">
                                  <TypeIcon className="w-3 h-3" />
                                  {clip.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {clip.transcript}
                              </p>
                              {clip.hook && (
                                <p className="text-xs text-primary mb-2 italic">
                                  "{clip.hook}"
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(clip.start)} - {formatTime(clip.end)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {clip.confidence}% viral
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* My Clips Tab */}
            <TabsContent value="myclips" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      {createdClips.length} clips created
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={handleCreateClip}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      Create Clip
                    </Button>
                  </div>

                  {createdClips.length === 0 ? (
                    <div className="text-center py-12">
                      <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">No clips created yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select from AI suggestions or create manually
                      </p>
                      <Button variant="outline" onClick={handleCreateClip}>
                        Create First Clip
                      </Button>
                    </div>
                  ) : (
                    createdClips.map((clip) => (
                      <Card key={clip.id} className="cursor-pointer hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-24 rounded-lg bg-muted shrink-0 overflow-hidden">
                              {clip.thumbnailUrl ? (
                                <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileVideo className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm">{clip.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {clip.aspectRatio}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {stylePresets.find(p => p.id === clip.stylePreset)?.name || clip.stylePreset}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Realtime Clips Tab */}
            {fromRealtime && (
              <TabsContent value="realtime" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Clips captured by AI during your live session
                    </p>
                    {realtimeClips?.length === 0 ? (
                      <div className="text-center py-12">
                        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">No realtime clips yet</p>
                        <p className="text-sm text-muted-foreground">
                          Enable "Capture Realtime AI Clips" in your next session
                        </p>
                      </div>
                    ) : (
                      realtimeClips?.map((clip: any) => (
                        <Card key={clip.id} className="cursor-pointer hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-24 rounded bg-muted" />
                              <div>
                                <h3 className="font-medium text-sm">{clip.title || "Untitled Clip"}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(clip.duration_seconds || 0)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Style Tab */}
            <TabsContent value="style" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Style Presets */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Style Presets
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {stylePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetChange(preset.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            selectedPreset === preset.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <preset.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{preset.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Maximize2 className="w-4 h-4" />
                      Aspect Ratio
                    </h3>
                    <div className="flex gap-2">
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setSelectedRatio(ratio.id)}
                          className={cn(
                            "flex-1 p-3 rounded-xl border text-center transition-all",
                            selectedRatio === ratio.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <ratio.icon className="w-5 h-5 mx-auto mb-1" />
                          <p className="font-medium text-sm">{ratio.label}</p>
                          <p className="text-xs text-muted-foreground">{ratio.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption Themes */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Caption Theme
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {captionThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedCaptionTheme(theme.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            selectedCaptionTheme === theme.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="font-medium text-sm">{theme.name}</span>
                          <div className="mt-2 bg-black/80 p-2 rounded">
                            <span className={cn("text-xs", theme.preview)}>
                              {theme.id === "none" ? "—" : "Sample Text"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Music */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Background Music
                      </h3>
                      <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} />
                    </div>
                    {musicEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        {musicTracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => setSelectedMusic(track.id)}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all",
                              selectedMusic === track.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Music2 className="w-4 h-4" />
                              <span className="font-medium text-sm">{track.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{track.category}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Thumbnails Tab */}
            <TabsContent value="thumbnails" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">AI Thumbnails</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateThumbnails}
                      disabled={generatingThumbnails}
                      className="gap-1.5"
                    >
                      {generatingThumbnails ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      Generate
                    </Button>
                  </div>

                  {thumbnails.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                      <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">No thumbnails yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate AI thumbnails for your clip
                      </p>
                      <Button variant="outline" onClick={handleGenerateThumbnails} disabled={generatingThumbnails}>
                        Generate Thumbnails
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {thumbnails.map((thumb, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedThumbnail(thumb)}
                          className={cn(
                            "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                            selectedThumbnail === thumb
                              ? "border-primary"
                              : "border-transparent hover:border-primary/50"
                          )}
                        >
                          <img src={thumb} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                          {selectedThumbnail === thumb && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Upload Custom Thumbnail */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-3">Upload Custom Thumbnail</h3>
                    <label className="block">
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Drop image or click to upload</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleThumbnailUpload}
                        />
                      </div>
                    </label>
                    {customThumbnail && (
                      <div className="mt-3 p-2 bg-muted/50 rounded-lg flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{customThumbnail.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Export Queue */}
                  {exportQueue.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Export History</h3>
                      <div className="space-y-2">
                        {exportQueue.map((clip) => (
                          <div key={clip.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                {clip.status === "complete" ? (
                                  <Check className="w-5 h-5 text-green-500" />
                                ) : clip.status === "processing" ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <FileVideo className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{clip.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {clip.aspectRatio} • {formatTime(clip.endTime - clip.startTime)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={clip.status === "complete" ? "default" : "secondary"}>
                                {clip.status}
                              </Badge>
                              {clip.status === "complete" && (
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-3">Export Format</h3>
                    <div className="flex gap-2">
                      {exportFormats.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id)}
                          className={cn(
                            "flex-1 p-3 rounded-xl border text-center transition-all",
                            selectedFormat === format.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <FileVideo className="w-5 h-5 mx-auto mb-1" />
                          <p className="font-medium text-sm">{format.label}</p>
                          <p className="text-xs text-muted-foreground">{format.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Options</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" defaultChecked />
                      Include captions
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Add Seeksy watermark
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Auto-publish to My Page
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" defaultChecked />
                      Save to Media Library
                    </label>
                  </div>

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Exporting...</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <Progress value={exportProgress} />
                    </div>
                  )}

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleExport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export & Save to Media Library
                      </>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
