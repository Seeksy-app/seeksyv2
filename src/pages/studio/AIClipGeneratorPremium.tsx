import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, Scissors, Wand2, Download, Share2, 
  ChevronLeft, Clock, Sparkles, Volume2, 
  Instagram, Youtube, Music2, Maximize2, Flag,
  Zap, MessageSquare, Heart, TrendingUp
} from "lucide-react";

interface ClipSuggestion {
  id: string;
  start: number;
  end: number;
  title: string;
  type: "emotion" | "keyword" | "manual" | "ai";
  confidence: number;
  transcript?: string;
}

export default function AIClipGeneratorPremium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("mediaId");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);

  // Mock clip suggestions
  const [clipSuggestions] = useState<ClipSuggestion[]>([
    { id: "1", start: 12, end: 42, title: "Emotional moment", type: "emotion", confidence: 94, transcript: "This is the moment that changed everything..." },
    { id: "2", start: 65, end: 95, title: "Key insight", type: "keyword", confidence: 88, transcript: "The three things you need to know about..." },
    { id: "3", start: 120, end: 150, title: "Viral hook", type: "ai", confidence: 91, transcript: "Here's what nobody tells you about..." },
    { id: "4", start: 200, end: 230, title: "Strong opener", type: "ai", confidence: 87, transcript: "Stop scrolling. This is important..." },
  ]);

  const { data: mediaFile } = useQuery({
    queryKey: ["media-file", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", mediaId)
        .single();
      return data as unknown as { 
        id: string; 
        file_name: string; 
        cloudflare_download_url: string | null;
        duration_seconds: number | null;
      } | null;
    },
    enabled: !!mediaId,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

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
      case "manual": return Flag;
      default: return Zap;
    }
  };

  const exportFormats = [
    { id: "tiktok", label: "TikTok", icon: Music2, ratio: "9:16" },
    { id: "reels", label: "Reels", icon: Instagram, ratio: "9:16" },
    { id: "shorts", label: "YouTube Shorts", icon: Youtube, ratio: "9:16" },
    { id: "horizontal", label: "Full Episode", icon: Maximize2, ratio: "16:9" },
  ];

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
            <p className="text-xs text-muted-foreground">{mediaFile?.file_name || "Select a video"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export All
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
          <div className="flex-1 bg-black flex items-center justify-center p-6">
            <div className="relative w-full max-w-md aspect-[9/16] bg-muted rounded-xl overflow-hidden">
              {mediaFile?.cloudflare_download_url ? (
                <video
                  ref={videoRef}
                  src={mediaFile.cloudflare_download_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a video to generate clips</p>
                  </div>
                </div>
              )}
              
              {/* PiP Overlay - smaller preview */}
              <div className="absolute bottom-4 right-4 w-24 h-36 bg-muted/80 rounded-lg border border-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-[10px] text-white/70">16:9 preview</span>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="p-4 border-t border-border space-y-4">
            {/* Timeline */}
            <div className="relative">
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
              {/* Markers on timeline */}
              <div className="absolute inset-0 pointer-events-none">
                {markers.map((marker, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-0.5 h-full bg-primary"
                    style={{ left: `${(marker / (duration || 100)) * 100}%` }}
                  />
                ))}
              </div>
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
                  Add Marker (M)
                </Button>
                <Button variant="outline" size="icon">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Clip Range Selector */}
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
                <Button size="sm" className="gap-1.5 mt-5">
                  <Scissors className="w-3.5 h-3.5" />
                  Create Clip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Suggestions & Export */}
        <div className="w-1/2 flex flex-col">
          <Tabs defaultValue="suggestions" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-4 h-12 rounded-none border-b border-border bg-transparent">
              <TabsTrigger value="suggestions" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions
              </TabsTrigger>
              <TabsTrigger value="clips" className="gap-2">
                <Scissors className="w-4 h-4" />
                My Clips
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      {clipSuggestions.length} clips detected
                    </p>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Re-analyze
                    </Button>
                  </div>

                  {clipSuggestions.map((clip) => {
                    const TypeIcon = getTypeIcon(clip.type);
                    return (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClip(clip)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedClip?.id === clip.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-24 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                            <Play className="w-5 h-5 text-muted-foreground" />
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
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(clip.start)} - {formatTime(clip.end)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {clip.confidence}% match
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="clips" className="flex-1 m-0 p-4">
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-1">No clips created yet</p>
                  <p className="text-sm text-muted-foreground">Select from AI suggestions or create manually</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Choose export format for your clips</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {exportFormats.map((format) => (
                      <button
                        key={format.id}
                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <format.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{format.label}</p>
                            <p className="text-xs text-muted-foreground">{format.ratio}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-3">Export Options</h3>
                    <div className="space-y-2">
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
                    </div>
                  </div>

                  <Button className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Export Selected Clips
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
