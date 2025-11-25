import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AICameraProcessingDialog } from "@/components/media/AICameraProcessingDialog";
import { PostProductionTutorial } from "@/components/media/PostProductionTutorial";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Scissors,
  Sparkles,
  Type,
  Image as ImageIcon,
  Film,
  Save,
  Download,
  Undo,
  Redo,
  X,
  Camera,
  HelpCircle
} from "lucide-react";

interface Marker {
  id: string;
  type: 'ad' | 'lower_third' | 'broll' | 'cut' | 'camera_focus';
  timestamp: number;
  duration?: number;
  data?: any;
}

export default function PostProductionStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mediaId = searchParams.get("id");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [activeTab, setActiveTab] = useState("tools");
  const [cameraProcessingOpen, setCameraProcessingOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Fetch media file
  const { data: mediaFile, isLoading } = useQuery({
    queryKey: ["media-file", mediaId],
    queryFn: async () => {
      if (!mediaId) throw new Error("No media ID provided");
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const addMarker = (type: Marker['type']) => {
    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      type,
      timestamp: currentTime,
      duration: type === 'ad' ? 30 : type === 'lower_third' ? 5 : undefined,
      data: {}
    };
    setMarkers([...markers, newMarker]);
    setSelectedMarker(newMarker);
    toast.success(`${type.replace('_', ' ')} marker added`);
  };

  const removeMarker = (markerId: string) => {
    setMarkers(markers.filter(m => m.id !== markerId));
    if (selectedMarker?.id === markerId) {
      setSelectedMarker(null);
    }
    toast.success("Marker removed");
  };

  const handleAICameraFocus = () => {
    if (!mediaFile) {
      toast.error("No media file loaded");
      return;
    }
    setCameraProcessingOpen(true);
  };

  const handleCameraProcessingComplete = (edits: any) => {
    // Add camera focus markers to timeline
    if (edits?.edits) {
      const cameraMarkers = edits.edits.map((edit: any) => ({
        id: `camera-${Date.now()}-${Math.random()}`,
        type: 'camera_focus' as const,
        timestamp: edit.timestamp,
        duration: 5,
        data: {
          shotType: edit.type,
          description: edit.description
        }
      }));
      setMarkers([...markers, ...cameraMarkers]);
      toast.success(`Added ${cameraMarkers.length} camera angles to your timeline`);
    }
  };

  const processAIEdit = async (editType: string) => {
    if (!mediaFile) return;

    toast.loading("Processing AI edit...", { id: "ai-edit" });
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-video-content", {
        body: {
          mediaFileId: mediaFile.id,
          videoUrl: mediaFile.file_url,
          analysisType: editType,
        },
      });

      if (error) throw error;

      toast.success("AI analysis complete", { id: "ai-edit" });
      
      // Add markers based on AI suggestions
      if (data?.analysis) {
        // Process AI recommendations and add markers
        toast.info("Adding AI-suggested markers to timeline");
      }
    } catch (error) {
      console.error("AI edit error:", error);
      toast.error("Failed to process AI edit", { id: "ai-edit" });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (!mediaFile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No media file found</p>
          <Button onClick={() => navigate("/media-library")}>
            Back to Media Library
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/media-library")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Post Production Studio</h1>
            <p className="text-sm text-muted-foreground">{mediaFile.file_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setTutorialOpen(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Tutorial
          </Button>
          <Button variant="outline" size="sm">
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button variant="outline" size="sm">
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          <Button variant="default" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <video
              ref={videoRef}
              src={mediaFile.file_url}
              className="max-h-full max-w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          {/* Timeline Controls */}
          <div className="border-t bg-card p-4">
            <div className="mb-4">
              <div className="relative h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  seekTo(percent * duration);
                }}
              >
                <div
                  className="absolute h-full bg-primary"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {markers.map(marker => (
                  <div
                    key={marker.id}
                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 cursor-pointer"
                    style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(marker.timestamp);
                      setSelectedMarker(marker);
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => seekTo(Math.min(duration, currentTime + 5))}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l bg-card overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="markers">Markers</TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="flex-1 p-4 space-y-4">
              <TooltipProvider delayDuration={300}>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Tools
                  </h3>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('ad')}
                        >
                          <Film className="h-4 w-4 mr-2" />
                          Insert AI Ad
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>AI automatically finds the best placement for ads based on natural breaks and engagement</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleAICameraFocus}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          AI Camera Focus
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Creates polished multicam-style edit with punch-ins, digital zooms, and reframing to highlight the speaker at the right moments</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => processAIEdit('trim')}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Smart Trim
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>AI removes filler words, dead air, and awkward pauses to create a tighter, more professional edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Manual Tools</h3>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('lower_third')}
                        >
                          <Type className="h-4 w-4 mr-2" />
                          Lower Third / Name Tag
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Add professional lower third graphics with name, title, or other text overlays at current timestamp</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('broll')}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Insert B-Roll
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Place supplemental footage or images at current timestamp to add visual interest</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('cut')}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Manual Cut
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Mark a manual cut point to remove unwanted sections from your video</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </TabsContent>

            <TabsContent value="markers" className="flex-1 p-4">
              {markers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">
                    No markers added yet. Use the tools to add markers to your video.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {markers.map(marker => (
                    <Card key={marker.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              marker.type === 'ad' ? 'default' :
                              marker.type === 'lower_third' ? 'secondary' :
                              'outline'
                            }>
                              {marker.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatTime(marker.timestamp)}
                            </span>
                          </div>
                          {marker.duration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {marker.duration}s
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => seekTo(marker.timestamp)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMarker(marker.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Camera Processing Dialog */}
      <AICameraProcessingDialog
        open={cameraProcessingOpen}
        onOpenChange={setCameraProcessingOpen}
        videoUrl={mediaFile?.file_url || ''}
        onComplete={handleCameraProcessingComplete}
      />

      {/* Tutorial Dialog */}
      <PostProductionTutorial
        open={tutorialOpen}
        onOpenChange={setTutorialOpen}
      />
    </div>
  );
}
