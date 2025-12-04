import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Play, Pause, Scissors, Wand2, Download, Share2, 
  ChevronLeft, Clock, Sparkles, Volume2, VolumeX,
  Instagram, Youtube, Music2, Info, HelpCircle,
  Zap, MessageSquare, Heart, TrendingUp, Image,
  Monitor, Smartphone, Square, Check, AlertCircle,
  FileVideo, Loader2, RefreshCw, FileText, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V2 - Enhanced Usability Version
 * 
 * This is a DEMO redesign focusing on:
 * - Reduced visual complexity with better spacing
 * - Step-based organization (Choose Format → Review Clips → Style & Export)
 * - Clearer tooltips and helper text
 * - Improved clip results readability
 * - Color-coded transcript timestamps
 */

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

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

const formatOptions = [
  { 
    id: "9:16", 
    label: "9:16", 
    name: "TikTok / Reels",
    description: "Best for vertical videos with captions. Optimized for mobile-first scrolling.",
    icon: Smartphone,
    gradient: "from-pink-500 to-orange-500",
    recommended: true
  },
  { 
    id: "1:1", 
    label: "1:1", 
    name: "Instagram Feed",
    description: "Square format perfect for Instagram feeds and carousels.",
    icon: Square,
    gradient: "from-purple-500 to-pink-500",
    recommended: false
  },
  { 
    id: "16:9", 
    label: "16:9", 
    name: "YouTube",
    description: "Horizontal longform format. Standard for YouTube videos.",
    icon: Monitor,
    gradient: "from-red-500 to-orange-500",
    recommended: false
  },
];

const clipCategories = {
  emotion: { label: "Emotional Moment", color: "bg-rose-500", icon: Heart, description: "High emotional engagement detected" },
  keyword: { label: "Key Insight", color: "bg-blue-500", icon: MessageSquare, description: "Important topic or keyword mentioned" },
  ai: { label: "AI Recommended", color: "bg-purple-500", icon: Sparkles, description: "AI detected viral potential" },
  realtime: { label: "Strong Opener", color: "bg-amber-500", icon: Zap, description: "Great hook for grabbing attention" },
  manual: { label: "Manual Selection", color: "bg-slate-500", icon: Scissors, description: "Manually marked segment" },
};

export default function AIClipGeneratorDemoV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("mediaId");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string>("9:16");
  const [isExporting, setIsExporting] = useState(false);
  
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([
    { id: "1", start: 0, end: 5, text: "Welcome back to the show everyone..." },
    { id: "2", start: 5, end: 12, text: "Today we're going to talk about something really exciting..." },
    { id: "3", start: 12, end: 20, text: "This is the moment that changed everything for me..." },
    { id: "4", start: 20, end: 30, text: "And I think it's going to change things for you too..." },
  ]);

  const [clipSuggestions] = useState<ClipSuggestion[]>([
    { id: "1", start: 12, end: 42, title: "The Turning Point", type: "emotion", confidence: 94, transcript: "This is the moment that changed everything...", hook: "Watch what happens next..." },
    { id: "2", start: 65, end: 95, title: "Three Key Insights", type: "keyword", confidence: 88, transcript: "The three things you need to know about...", hook: "Nobody talks about this..." },
    { id: "3", start: 120, end: 150, title: "The Untold Truth", type: "ai", confidence: 91, transcript: "Here's what nobody tells you about...", hook: "This will change how you think..." },
    { id: "4", start: 200, end: 230, title: "Stop & Listen", type: "realtime", confidence: 87, transcript: "Stop scrolling. This is important...", hook: "If you only watch one clip today..." },
  ]);

  const { data: mediaFile, isLoading: mediaLoading } = useQuery({
    queryKey: ["media-file-demo-v2", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, duration_seconds, edit_transcript")
        .eq("id", mediaId)
        .single();
      return data as { 
        id: string; 
        file_name: string; 
        file_url: string;
        duration_seconds: number | null;
        edit_transcript: any;
      } | null;
    },
    enabled: !!mediaId,
  });

  useEffect(() => {
    if (mediaFile?.edit_transcript && Array.isArray(mediaFile.edit_transcript)) {
      const transcriptSegments = mediaFile.edit_transcript.map((seg: any, idx: number) => ({
        id: String(idx),
        start: seg.start || seg.startTime || 0,
        end: seg.end || seg.endTime || 0,
        text: seg.text || seg.content || "",
      }));
      if (transcriptSegments.length > 0) {
        setTranscript(transcriptSegments);
      }
    }
  }, [mediaFile?.edit_transcript]);

  useEffect(() => {
    if (!selectedClip && clipSuggestions.length > 0) {
      setSelectedClip(clipSuggestions[0]);
    }
  }, [clipSuggestions, selectedClip]);

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
    if (isPlaying) video.pause();
    else video.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
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

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    toast({ title: "Demo: Export simulated", description: "In production, your clip would be exported here." });
  };

  const videoUrl = mediaFile?.file_url;

  const steps = [
    { number: 1, title: "Choose Output Format", description: "Select where you'll share your clip" },
    { number: 2, title: "Review Clips", description: "Select the best moments from AI suggestions" },
    { number: 3, title: "Style & Export", description: "Customize and download your clip" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        {/* Demo Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Demo V2 — Enhanced Usability Version</span>
            <span className="text-xs text-amber-600">• Layout updated, functionality preserved</span>
          </div>
        </div>

        {/* Header */}
        <div className="border-b bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">AI Production Studio</h1>
                  <p className="text-sm text-muted-foreground">
                    {mediaFile?.file_name || "Select a video to get started"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate("/studio/media")}>
                  Change Video
                </Button>
                <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Clip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="border-b bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full",
                      currentStep === step.number 
                        ? "bg-primary/10 border-2 border-primary" 
                        : "bg-white border-2 border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      currentStep === step.number 
                        ? "bg-primary text-white" 
                        : currentStep > step.number 
                          ? "bg-green-500 text-white"
                          : "bg-slate-200 text-slate-600"
                    )}>
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        "font-semibold",
                        currentStep === step.number ? "text-primary" : "text-foreground"
                      )}>{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-slate-300 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left Column - Video Preview & Transcript */}
            <div className="col-span-5 space-y-6">
              {/* Video Preview */}
              <Card className="overflow-hidden">
                <div className={cn(
                  "relative bg-slate-900 flex items-center justify-center",
                  selectedRatio === "9:16" && "aspect-[9/16]",
                  selectedRatio === "1:1" && "aspect-square",
                  selectedRatio === "16:9" && "aspect-video"
                )}>
                  {videoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        onClick={togglePlay}
                        poster={`${videoUrl}#t=0.1`}
                      />
                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Button size="lg" className="rounded-full w-16 h-16" onClick={togglePlay}>
                            <Play className="w-6 h-6" />
                          </Button>
                        </div>
                      )}
                      {selectedClip && (
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <p className="text-white font-medium text-sm">{selectedClip.title}</p>
                            <p className="text-white/70 text-xs mt-1">{selectedClip.hook}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <FileVideo className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-white font-medium">No video selected</p>
                      <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate("/studio/media")}>
                        Select from Media Library
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Transcript Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">Transcript</CardTitle>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Click on any sentence to jump to that point in the video. Select text to create a clip from that portion.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>Click any segment to navigate to that moment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                      {transcript.map((segment) => (
                        <button
                          key={segment.id}
                          onClick={() => handleTranscriptClick(segment)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg transition-all group",
                            currentTime >= segment.start && currentTime < segment.end
                              ? "bg-primary/10 border-l-4 border-primary"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <span className={cn(
                            "text-xs font-mono px-2 py-0.5 rounded mr-2",
                            currentTime >= segment.start && currentTime < segment.end
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          )}>
                            {formatTime(segment.start)}
                          </span>
                          <span className="text-sm text-foreground">{segment.text}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full gap-2">
                      <Scissors className="w-4 h-4" />
                      Create Clip from Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Step Content */}
            <div className="col-span-7">
              {/* Step 1: Choose Format */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Step 1: Choose Output Format</h2>
                    <p className="text-muted-foreground">Select the platform where you'll share your clip. This determines the video dimensions and optimization.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {formatOptions.map((format) => (
                      <Tooltip key={format.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setSelectedRatio(format.id);
                              toast({ title: `Selected ${format.name}`, description: format.description });
                            }}
                            className={cn(
                              "relative flex items-center gap-6 p-6 rounded-xl border-2 transition-all text-left",
                              selectedRatio === format.id
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                            )}
                          >
                            {format.recommended && (
                              <Badge className="absolute top-3 right-3 bg-green-500">Recommended</Badge>
                            )}
                            <div className={cn(
                              "w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br",
                              format.gradient
                            )}>
                              <format.icon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-foreground">{format.label}</span>
                                <span className="text-lg font-semibold text-foreground">{format.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{format.description}</p>
                            </div>
                            {selectedRatio === format.id && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium">{format.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={() => setCurrentStep(2)} className="gap-2">
                      Continue to Review Clips
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Review Clips */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Step 2: Review AI-Detected Clips</h2>
                    <p className="text-muted-foreground">Our AI found these high-potential moments in your video. Select the one you want to export.</p>
                  </div>

                  <div className="space-y-4">
                    {clipSuggestions.map((clip) => {
                      const category = clipCategories[clip.type];
                      return (
                        <button
                          key={clip.id}
                          onClick={() => handleSelectClip(clip)}
                          className={cn(
                            "w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left",
                            selectedClip?.id === clip.id
                              ? "border-primary bg-primary/5"
                              : "border-slate-200 hover:border-primary/50"
                          )}
                        >
                          {/* Thumbnail placeholder */}
                          <div className="w-24 h-16 rounded-lg bg-slate-900 flex-shrink-0 relative overflow-hidden">
                            {videoUrl && (
                              <video src={`${videoUrl}#t=${clip.start}`} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-mono">
                              {formatTime(clip.end - clip.start)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{clip.title}</h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={cn("text-white text-[10px]", category.color)}>
                                    <category.icon className="w-3 h-3 mr-1" />
                                    {category.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{category.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{clip.transcript}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>{clip.confidence}% viral score</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>AI-predicted engagement potential based on content analysis</p>
                                </TooltipContent>
                              </Tooltip>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {selectedClip?.id === clip.id && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" size="lg" onClick={() => setCurrentStep(1)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button size="lg" onClick={() => setCurrentStep(3)} className="gap-2">
                      Continue to Style & Export
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Style & Export */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Step 3: Style & Export</h2>
                    <p className="text-muted-foreground">Review your clip settings and export when ready.</p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Clip Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selected Clip</p>
                          <p className="font-semibold">{selectedClip?.title || "None selected"}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Format</p>
                          <p className="font-semibold">{formatOptions.find(f => f.id === selectedRatio)?.name}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                          <p className="font-semibold">{selectedClip ? formatTime(selectedClip.end - selectedClip.start) : "—"}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Viral Score</p>
                          <p className="font-semibold text-amber-600">{selectedClip?.confidence || 0}%</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                          <Wand2 className="w-5 h-5" />
                          <span className="font-medium">AI Enhancements Applied</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Filler words removed • Audio balanced • Optimal trim points</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" size="lg" onClick={() => setCurrentStep(2)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline" size="lg" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                      <Button size="lg" onClick={handleExport} disabled={isExporting} className="gap-2 bg-primary">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export Clip
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
