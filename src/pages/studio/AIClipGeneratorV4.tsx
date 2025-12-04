import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, ChevronLeft, Sparkles, 
  Smartphone, Square, Monitor, Wand2,
  Download, Loader2, RefreshCw, Check, Image
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipSuggestion {
  id: string;
  start: number;
  end: number;
  title: string;
  confidence: number;
  hook?: string;
}

interface ThumbnailOption {
  id: string;
  url: string;
  style: string;
  selected: boolean;
}

const aspectRatios = [
  { id: "9:16", label: "9:16", icon: Smartphone, color: "bg-primary" },
  { id: "1:1", label: "1:1", icon: Square, color: "bg-muted" },
  { id: "16:9", label: "16:9", icon: Monitor, color: "bg-muted" },
];

const overlayStyles = [
  { id: "viral", name: "Viral Bold", preview: "font-bold text-xl" },
  { id: "clean", name: "Clean Minimal", preview: "font-medium text-lg" },
  { id: "gradient", name: "Gradient Pop", preview: "font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" },
];

export default function AIClipGeneratorV4() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get("media");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [selectedStyle, setSelectedStyle] = useState("viral");
  const [overlayText, setOverlayText] = useState("Watch what happens next...");
  const [activeTab, setActiveTab] = useState("preview");
  
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [thumbnails, setThumbnails] = useState<ThumbnailOption[]>([]);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);

  // Fetch media file
  const { data: mediaFile } = useQuery({
    queryKey: ["media-file", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", mediaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!mediaId,
  });

  const videoUrl = mediaFile?.file_url || null;

  // Auto-analyze on video load
  useEffect(() => {
    if (videoUrl && clips.length === 0 && !isAnalyzing) {
      handleAnalyze();
    }
  }, [videoUrl]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(r => setTimeout(r, 2000));
    
    const mockClips: ClipSuggestion[] = [
      { id: "1", start: 12, end: 42, title: "Emotional moment", confidence: 94, hook: "Watch what happens next..." },
      { id: "2", start: 65, end: 95, title: "Key insight", confidence: 88, hook: "Nobody talks about this..." },
      { id: "3", start: 120, end: 150, title: "Viral hook", confidence: 91, hook: "This will change how you think..." },
      { id: "4", start: 200, end: 230, title: "Strong opener", confidence: 87, hook: "If you only watch one clip today..." },
    ];
    
    setClips(mockClips);
    setSelectedClip(mockClips[0]);
    setOverlayText(mockClips[0].hook || "Watch what happens next...");
    setIsAnalyzing(false);
    toast({ title: `${mockClips.length} clips detected` });
  };

  const handleGenerateThumbnails = async () => {
    setIsGeneratingThumbs(true);
    
    // Generate 5 thumbnail options based on video frames
    await new Promise(r => setTimeout(r, 2500));
    
    const styles = ["Bold Text", "Minimal", "Gradient", "Dark Mode", "Colorful"];
    const mockThumbnails: ThumbnailOption[] = styles.map((style, i) => ({
      id: `thumb-${i}`,
      url: `https://picsum.photos/seed/${mediaId || 'demo'}-${i}/400/700`,
      style,
      selected: i === 0,
    }));
    
    setThumbnails(mockThumbnails);
    setSelectedThumbnail(mockThumbnails[0].id);
    setIsGeneratingThumbs(false);
    toast({ title: "5 thumbnail options generated" });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setOverlayText(clip.hook || "Watch what happens next...");
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start;
    }
  };

  // Phone preview dimensions based on aspect ratio
  const getPreviewDimensions = () => {
    switch (selectedRatio) {
      case "9:16": return { width: 280, height: 500 };
      case "1:1": return { width: 350, height: 350 };
      case "16:9": return { width: 450, height: 253 };
      default: return { width: 280, height: 500 };
    }
  };

  const dims = getPreviewDimensions();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <div className="border-b bg-background sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">AI Clip Studio</h1>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {mediaFile?.file_name || "Select a video"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/studio/media")}>
              Change Video
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Format Selector - Simple Pills */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Format:</span>
          {aspectRatios.map(ratio => {
            const Icon = ratio.icon;
            const isActive = selectedRatio === ratio.id;
            return (
              <Button
                key={ratio.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRatio(ratio.id)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {ratio.label}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Preview - Center */}
          <div className="col-span-7 flex flex-col items-center">
            {/* Phone Frame Preview */}
            <div 
              className="relative bg-black rounded-[2rem] p-2 shadow-2xl"
              style={{ width: dims.width + 16, height: dims.height + 16 }}
            >
              {/* Notch */}
              {selectedRatio === "9:16" && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
              )}
              
              {/* Video Container */}
              <div 
                className="relative rounded-[1.5rem] overflow-hidden bg-gray-900"
                style={{ width: dims.width, height: dims.height }}
              >
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                      onClick={togglePlay}
                    />
                    
                    {/* Overlay - Always Visible */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                      {/* Top Badge */}
                      {selectedClip && (
                        <div className="flex items-center gap-2">
                          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg">
                            <span className="font-semibold text-sm">{selectedClip.title}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {selectedClip.confidence}% viral
                          </Badge>
                        </div>
                      )}
                      
                      {/* Bottom Hook Text */}
                      <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-xl">
                        <p className={cn(
                          "text-white text-center",
                          selectedStyle === "viral" && "font-bold text-lg",
                          selectedStyle === "clean" && "font-medium",
                          selectedStyle === "gradient" && "font-bold text-lg"
                        )}>
                          {overlayText}
                        </p>
                      </div>
                    </div>

                    {/* Play Button */}
                    {!isPlaying && (
                      <button 
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-6 h-6 text-black ml-1" />
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-white/50 text-sm">No video selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Simple Timeline */}
            <div className="w-full max-w-md mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-5">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="preview">Clips</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="thumb">Thumb</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              {/* Clips Tab */}
              <TabsContent value="preview" className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{clips.length} clips detected</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Re-analyze</span>
                  </Button>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-2">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                        <p className="text-sm text-muted-foreground">Analyzing video...</p>
                      </div>
                    ) : clips.length === 0 ? (
                      <div className="text-center py-12">
                        <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Upload a video to detect clips
                        </p>
                      </div>
                    ) : (
                      clips.map(clip => (
                        <button
                          key={clip.id}
                          onClick={() => selectClip(clip)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            selectedClip?.id === clip.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{clip.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {clip.confidence}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(clip.start)} - {formatTime(clip.end)}
                          </p>
                          {clip.hook && (
                            <p className="text-xs text-primary mt-1 truncate">
                              "{clip.hook}"
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Caption Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {overlayStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-all",
                          selectedStyle === style.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-sm">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Overlay Text</label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    placeholder="Enter hook text..."
                  />
                </div>

                <Button className="w-full gap-2" variant="outline">
                  <Wand2 className="w-4 h-4" />
                  Generate AI Hook
                </Button>
              </TabsContent>

              {/* Thumbnail Tab */}
              <TabsContent value="thumb" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Thumbnails</span>
                  <Button 
                    size="sm" 
                    onClick={handleGenerateThumbnails}
                    disabled={isGeneratingThumbs}
                  >
                    {isGeneratingThumbs ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate 5
                  </Button>
                </div>

                {isGeneratingThumbs ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Generating thumbnails from video...
                    </p>
                  </div>
                ) : thumbnails.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Image className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click "Generate 5" to create AI thumbnails
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {thumbnails.map(thumb => (
                      <button
                        key={thumb.id}
                        onClick={() => setSelectedThumbnail(thumb.id)}
                        className={cn(
                          "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all",
                          selectedThumbnail === thumb.id 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <img 
                          src={thumb.url} 
                          alt={thumb.style}
                          className="w-full h-full object-cover"
                        />
                        {selectedThumbnail === thumb.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <span className="text-xs text-white font-medium">{thumb.style}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Or upload custom</p>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drop image or click to upload
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="mt-4 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Export Settings</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Format: {selectedRatio}</p>
                    <p>Style: {overlayStyles.find(s => s.id === selectedStyle)?.name}</p>
                    {selectedClip && (
                      <p>Clip: {selectedClip.title} ({formatTime(selectedClip.start)} - {formatTime(selectedClip.end)})</p>
                    )}
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Export Clip
                </Button>

                <Button variant="outline" className="w-full">
                  Save as Draft
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}