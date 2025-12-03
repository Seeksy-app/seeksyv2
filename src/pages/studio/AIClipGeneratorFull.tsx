import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Pause, Scissors, Wand2, Download, Share2, 
  ChevronLeft, Clock, Sparkles, Volume2, VolumeX,
  Instagram, Youtube, Music2, Maximize2, Flag,
  Zap, MessageSquare, Heart, TrendingUp, Image,
  Monitor, Smartphone, Square, RotateCcw, Check,
  FileVideo, Loader2, RefreshCw, Palette, Type
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

interface StylePreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  layout: string;
  captionStyle: string;
}

const stylePresets: StylePreset[] = [
  { id: "viral", name: "Viral Vertical", description: "Optimized for TikTok & Reels", icon: TrendingUp, layout: "vertical-center", captionStyle: "bold-pop" },
  { id: "motivational", name: "Motivational", description: "Inspiring content with clean text", icon: Zap, layout: "vertical-bottom", captionStyle: "gradient-glow" },
  { id: "educational", name: "Educational", description: "Clear, readable captions", icon: MessageSquare, layout: "pip-bottom", captionStyle: "clean-white" },
  { id: "podcast", name: "Podcast Split-Screen", description: "Guest & host layout", icon: Monitor, layout: "split-screen", captionStyle: "minimal" },
  { id: "reaction", name: "Reaction Style", description: "PiP with facial focus", icon: Heart, layout: "pip-corner", captionStyle: "emoji-react" },
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
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("mediaId");
  const fromRealtime = searchParams.get("from") === "realtime";
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [selectedPreset, setSelectedPreset] = useState<string>("viral");
  const [selectedRatio, setSelectedRatio] = useState<string>("9:16");
  const [selectedFormat, setSelectedFormat] = useState<string>("mp4");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

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
        .select("*")
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

  const { data: realtimeClips } = useQuery({
    queryKey: ["realtime-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "realtime_ai")
        .order("created_at", { ascending: false })
        .limit(10);
      
      return data || [];
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
      // Simulate thumbnail generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setThumbnails([
        "https://picsum.photos/seed/thumb1/320/180",
        "https://picsum.photos/seed/thumb2/320/180",
        "https://picsum.photos/seed/thumb3/320/180",
      ]);
      toast({ title: "Thumbnails generated", description: "Choose your favorite" });
    } finally {
      setGeneratingThumbnails(false);
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setExportProgress(i);
      }

      toast({ 
        title: "Export complete!", 
        description: `${selectedRatio} clip exported as ${selectedFormat.toUpperCase()}` 
      });
    } finally {
      setIsGenerating(false);
      setExportProgress(0);
    }
  };

  const handleSelectClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setClipStart(clip.start);
    setClipEnd(clip.end);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start;
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
        {/* Left Panel - Video Preview */}
        <div className="w-1/2 border-r border-border flex flex-col">
          {/* Video Player */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className={cn(
              "relative bg-muted rounded-xl overflow-hidden",
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
              
              {/* PiP Preview */}
              {selectedPreset === "podcast" || selectedPreset === "reaction" ? (
                <div className="absolute bottom-4 right-4 w-24 h-36 bg-muted/80 rounded-lg border border-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[10px] text-white/70">PiP</span>
                </div>
              ) : null}

              {/* Caption Preview */}
              {selectedClip && (
                <div className={cn(
                  "absolute left-4 right-4 text-center",
                  selectedPreset === "educational" ? "bottom-20" : "bottom-16"
                )}>
                  <p className={cn(
                    "text-white font-bold text-lg drop-shadow-lg",
                    selectedPreset === "motivational" && "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  )}>
                    {selectedClip.hook || selectedClip.title}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Video Controls */}
          <div className="p-4 border-t border-border space-y-4">
            {/* Timeline with Waveform Placeholder */}
            <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden">
              {/* Waveform visualization placeholder */}
              <div className="absolute inset-0 flex items-center justify-center gap-px px-2">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary/40 rounded-full"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                  />
                ))}
              </div>
              
              {/* Progress overlay */}
              <div 
                className="absolute inset-y-0 left-0 bg-primary/20"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />

              {/* Clip range handles */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize"
                style={{ left: `${(clipStart / (duration || 1)) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-ew-resize"
                style={{ left: `${(clipEnd / (duration || 1)) * 100}%` }}
              />

              {/* Markers */}
              {markers.map((marker, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-0.5 h-full bg-yellow-400"
                  style={{ left: `${(marker / (duration || 1)) * 100}%` }}
                />
              ))}
            </div>

            {/* Slider */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={([val]) => {
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full"
            />

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
            <TabsList className="w-full justify-start px-4 h-12 rounded-none border-b border-border bg-transparent">
              <TabsTrigger value="suggestions" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions
              </TabsTrigger>
              {fromRealtime && (
                <TabsTrigger value="realtime" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Realtime Clips
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
                          onClick={() => setSelectedPreset(preset.id)}
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

                  {/* Caption Style */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Caption Style
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["Bold Pop", "Clean White", "Gradient Glow", "Minimal", "Emoji React", "None"].map((style) => (
                        <button
                          key={style}
                          className="p-2 rounded-lg border border-border hover:border-primary/50 text-sm transition-all"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
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
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
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
                      <input type="checkbox" className="rounded" defaultChecked />
                      Add Seeksy watermark
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Auto-publish to My Page
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
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
                        Export Clip
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
