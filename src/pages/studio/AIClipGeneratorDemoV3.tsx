import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Play, Pause, Scissors, Wand2, Download, Share2, 
  ChevronLeft, Clock, Sparkles, Upload, CheckCircle2,
  Zap, MessageSquare, Heart, TrendingUp, Info,
  Monitor, Smartphone, Square, Check, AlertCircle,
  FileVideo, Loader2, ChevronRight, X, Volume2,
  FileText, Music, Palette, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3 - Guided Workflow Version
 * 
 * This is a DEMO redesign featuring a step-by-step wizard approach:
 * - Step 1: Upload Video or Select File
 * - Step 2: AI Cleanup, Pauses, Fillers
 * - Step 3: AI Clip Detection (horizontal cards)
 * - Step 4: Format & Style (big cards with previews)
 * - Step 5: Export (centralized, descriptive)
 */

interface ClipSuggestion {
  id: string;
  start: number;
  end: number;
  title: string;
  type: "emotion" | "keyword" | "ai" | "realtime";
  confidence: number;
  transcript?: string;
  hook?: string;
  thumbnailTime?: number;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const formatOptions = [
  { 
    id: "9:16", 
    label: "9:16 Vertical", 
    name: "TikTok / Instagram Reels",
    description: "Perfect for mobile-first social platforms. Vertical format optimized for thumb-stopping content with bold captions.",
    icon: Smartphone,
    gradient: "from-pink-500 via-rose-500 to-orange-500",
    example: "Short-form viral clips",
    recommended: true
  },
  { 
    id: "1:1", 
    label: "1:1 Square", 
    name: "Instagram Feed / LinkedIn",
    description: "Square format that works great in feeds. Professional and clean appearance for business content.",
    icon: Square,
    gradient: "from-purple-500 via-violet-500 to-pink-500",
    example: "Feed posts & carousels",
    recommended: false
  },
  { 
    id: "16:9", 
    label: "16:9 Landscape", 
    name: "YouTube / Website",
    description: "Traditional horizontal format. Best for longer content, tutorials, and embedded website videos.",
    icon: Monitor,
    gradient: "from-red-500 via-orange-500 to-amber-500",
    example: "Long-form content",
    recommended: false
  },
];

const stylePresets = [
  { id: "viral", name: "Viral Impact", description: "Bold captions, high energy transitions", icon: TrendingUp, color: "from-pink-500 to-rose-500" },
  { id: "clean", name: "Clean Professional", description: "Minimal styling, readable text", icon: FileText, color: "from-blue-500 to-cyan-500" },
  { id: "podcast", name: "Podcast Style", description: "Waveform visualization, speaker focus", icon: Music, color: "from-purple-500 to-violet-500" },
  { id: "custom", name: "Custom Style", description: "Design your own look", icon: Palette, color: "from-amber-500 to-orange-500" },
];

export default function AIClipGeneratorDemoV3() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("mediaId");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(mediaId ? 2 : 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(mediaId ? [1] : []);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Selection state
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string>("9:16");
  const [selectedStyle, setSelectedStyle] = useState<string>("viral");
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // AI cleanup stats (simulated)
  const [cleanupStats] = useState({
    fillerWordsRemoved: 47,
    fillerDuration: "4.2 min",
    pausesTrimmed: 23,
    pauseDuration: "2.1 min",
    audioNormalized: true,
    clipsDetected: 4
  });

  const [clipSuggestions] = useState<ClipSuggestion[]>([
    { id: "1", start: 12, end: 42, title: "The Turning Point", type: "emotion", confidence: 94, transcript: "This is the moment that changed everything for me...", hook: "Watch what happens next...", thumbnailTime: 15 },
    { id: "2", start: 65, end: 95, title: "Three Key Insights", type: "ai", confidence: 91, transcript: "The three things you need to know about...", hook: "Nobody talks about this...", thumbnailTime: 70 },
    { id: "3", start: 120, end: 150, title: "The Untold Truth", type: "ai", confidence: 88, transcript: "Here's what nobody tells you about...", hook: "This will change how you think...", thumbnailTime: 125 },
    { id: "4", start: 200, end: 230, title: "Stop & Listen", type: "realtime", confidence: 87, transcript: "Stop scrolling. This is important...", hook: "If you only watch one clip today...", thumbnailTime: 205 },
  ]);

  const { data: mediaFile, isLoading: mediaLoading } = useQuery({
    queryKey: ["media-file-demo-v3", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, duration_seconds")
        .eq("id", mediaId)
        .single();
      return data;
    },
    enabled: !!mediaId,
  });

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play();
    setIsPlaying(!isPlaying);
  };

  const handleSelectClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start;
    }
  };

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep((currentStep + 1) as WizardStep);
  };

  const handlePrevStep = () => {
    setCurrentStep((currentStep - 1) as WizardStep);
  };

  const simulateProcessing = async () => {
    setIsProcessing(true);
    const stages = [
      "Analyzing audio track...",
      "Detecting filler words...",
      "Identifying pauses...",
      "Normalizing audio levels...",
      "Detecting clip-worthy moments...",
      "Generating thumbnails..."
    ];
    
    for (let i = 0; i < stages.length; i++) {
      setProcessingStage(stages[i]);
      setProcessingProgress(((i + 1) / stages.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsProcessing(false);
    handleNextStep();
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    toast({ title: "Demo: Export simulated", description: "In production, your clip would be exported here." });
  };

  const videoUrl = mediaFile?.file_url;

  const steps = [
    { number: 1, title: "Select Video", icon: Upload },
    { number: 2, title: "AI Cleanup", icon: Wand2 },
    { number: 3, title: "Choose Clip", icon: Scissors },
    { number: 4, title: "Style", icon: Palette },
    { number: 5, title: "Export", icon: Download },
  ];

  const getTypeIcon = (type: ClipSuggestion["type"]) => {
    switch (type) {
      case "emotion": return Heart;
      case "ai": return Sparkles;
      case "realtime": return Zap;
      default: return MessageSquare;
    }
  };

  const getTypeLabel = (type: ClipSuggestion["type"]) => {
    switch (type) {
      case "emotion": return "Emotional";
      case "ai": return "AI Pick";
      case "realtime": return "Hook";
      default: return "Insight";
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Demo Banner */}
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-purple-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Demo V3 — Guided Workflow Version</span>
            <span className="text-xs text-purple-600">• Step-by-step wizard, functionality preserved</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Create Your Clip</h1>
                  <p className="text-sm text-muted-foreground">Powered by AI • Follow the steps below</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/studio/clips")}>
                Exit Wizard
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => completedSteps.includes(step.number) || step.number === currentStep ? setCurrentStep(step.number as WizardStep) : null}
                    disabled={!completedSteps.includes(step.number) && step.number !== currentStep}
                    className={cn(
                      "flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all",
                      currentStep === step.number && "bg-primary/10",
                      completedSteps.includes(step.number) && currentStep !== step.number && "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      currentStep === step.number 
                        ? "bg-primary text-white shadow-lg shadow-primary/30" 
                        : completedSteps.includes(step.number)
                          ? "bg-green-500 text-white"
                          : "bg-slate-200 text-slate-500"
                    )}>
                      {completedSteps.includes(step.number) && currentStep !== step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      currentStep === step.number ? "text-primary" : "text-muted-foreground"
                    )}>{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-16 h-1 mx-2 rounded-full",
                      completedSteps.includes(step.number) ? "bg-green-500" : "bg-slate-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Step 1: Select Video */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Start with Your Video</h2>
                <p className="text-lg text-muted-foreground">
                  Upload a new video or select one from your library. Our AI will analyze it and find the best clip-worthy moments.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="cursor-pointer hover:border-primary/50 transition-all group">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Upload New Video</h3>
                    <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary/50 transition-all group"
                  onClick={() => navigate("/studio/media")}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                      <FileVideo className="w-8 h-8 text-slate-500 group-hover:text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Select from Library</h3>
                    <p className="text-sm text-muted-foreground">Choose from your existing media</p>
                  </CardContent>
                </Card>
              </div>

              {mediaFile && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-green-800">Video Selected</p>
                      <p className="text-sm text-green-700">{mediaFile.file_name}</p>
                    </div>
                    <Button onClick={handleNextStep} className="gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: AI Cleanup */}
          {currentStep === 2 && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">AI Video Cleanup</h2>
                <p className="text-lg text-muted-foreground">
                  Our AI will automatically remove filler words, trim awkward pauses, and balance your audio.
                </p>
              </div>

              {isProcessing ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="font-medium text-foreground mb-2">{processingStage}</p>
                    <Progress value={processingProgress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{Math.round(processingProgress)}% complete</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-rose-600 mb-1">{cleanupStats.fillerWordsRemoved}</div>
                        <p className="text-sm text-muted-foreground">Filler words removed</p>
                        <p className="text-xs text-rose-600 mt-1">Saved {cleanupStats.fillerDuration}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-amber-600 mb-1">{cleanupStats.pausesTrimmed}</div>
                        <p className="text-sm text-muted-foreground">Pauses trimmed</p>
                        <p className="text-xs text-amber-600 mt-1">Saved {cleanupStats.pauseDuration}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-green-600 mb-1">{cleanupStats.clipsDetected}</div>
                        <p className="text-sm text-muted-foreground">Clips detected</p>
                        <p className="text-xs text-green-600 mt-1">Ready to review</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-900 text-white mb-8">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Audio Normalized
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Background Noise Reduced
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">
                        <Info className="w-4 h-4 inline mr-2" />
                        Your video has been cleaned up. All improvements are non-destructive — your original file is preserved.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" size="lg" onClick={handlePrevStep} className="gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button size="lg" onClick={simulateProcessing} className="gap-2">
                      Run AI Cleanup <Wand2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Choose Clip */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-3">Choose Your Best Clip</h2>
                <p className="text-lg text-muted-foreground">
                  Our AI found {clipSuggestions.length} high-potential moments. Select one to continue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                {clipSuggestions.map((clip) => {
                  const TypeIcon = getTypeIcon(clip.type);
                  return (
                    <Card 
                      key={clip.id}
                      className={cn(
                        "cursor-pointer transition-all overflow-hidden",
                        selectedClip?.id === clip.id 
                          ? "ring-2 ring-primary shadow-lg" 
                          : "hover:shadow-md hover:border-primary/30"
                      )}
                      onClick={() => handleSelectClip(clip)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-slate-900">
                        {videoUrl && (
                          <video 
                            src={`${videoUrl}#t=${clip.thumbnailTime}`} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono">
                          {formatTime(clip.end - clip.start)}
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-white/90 text-foreground gap-1">
                            <TypeIcon className="w-3 h-3" />
                            {getTypeLabel(clip.type)}
                          </Badge>
                        </div>
                        {selectedClip?.id === clip.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-1">{clip.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{clip.transcript}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-amber-600">
                            <Sparkles className="w-3 h-3" />
                            {clip.confidence}% viral score
                          </div>
                          <span className="text-muted-foreground">
                            {formatTime(clip.start)} - {formatTime(clip.end)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={handlePrevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button size="lg" onClick={handleNextStep} disabled={!selectedClip} className="gap-2">
                  Continue to Style <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Format & Style */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-3">Choose Format & Style</h2>
                <p className="text-lg text-muted-foreground">
                  Select where you'll share your clip and how it should look.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Format Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Output Format</h3>
                  <div className="space-y-3">
                    {formatOptions.map((format) => (
                      <Card 
                        key={format.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedRatio === format.id 
                            ? "ring-2 ring-primary" 
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedRatio(format.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            format.gradient
                          )}>
                            <format.icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{format.label}</span>
                              {format.recommended && (
                                <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{format.name}</p>
                          </div>
                          {selectedRatio === format.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Visual Style</h3>
                  <div className="space-y-3">
                    {stylePresets.map((style) => (
                      <Card 
                        key={style.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedStyle === style.id 
                            ? "ring-2 ring-primary" 
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            style.color
                          )}>
                            <style.icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold">{style.name}</span>
                            <p className="text-sm text-muted-foreground">{style.description}</p>
                          </div>
                          {selectedStyle === style.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={handlePrevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button size="lg" onClick={handleNextStep} className="gap-2">
                  Continue to Export <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Export */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <Download className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Ready to Export!</h2>
                <p className="text-lg text-muted-foreground">
                  Review your clip settings and export when ready.
                </p>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Clip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Clip</p>
                      <p className="font-semibold">{selectedClip?.title}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                      <p className="font-semibold">{selectedClip ? formatTime(selectedClip.end - selectedClip.start) : "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Format</p>
                      <p className="font-semibold">{formatOptions.find(f => f.id === selectedRatio)?.name}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Style</p>
                      <p className="font-semibold">{stylePresets.find(s => s.id === selectedStyle)?.name}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                      <Wand2 className="w-5 h-5" />
                      AI Enhancements Included
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✓ Filler words removed ({cleanupStats.fillerDuration} saved)</li>
                      <li>✓ Pauses trimmed ({cleanupStats.pauseDuration} saved)</li>
                      <li>✓ Audio normalized & balanced</li>
                      <li>✓ Auto-captions ready</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={handlePrevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                  <Button size="lg" onClick={handleExport} disabled={isExporting} className="gap-2 px-8">
                    {isExporting ? (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
