import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { 
  Wand2, Scissors, ArrowLeft, Play, Pause, Clock, FileVideo, FileAudio, 
  Sparkles, Volume2, Type, Layers, Image, Upload, Check, Loader2, 
  AlertCircle, Film, Mic, Palette, Sun, X, RefreshCw, Download, Eye,
  ChevronRight, Zap, RotateCcw, ImagePlus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  thumbnail_url: string | null;
  edit_status: string | null;
  file_size_bytes: number | null;
}

interface ProcessingJob {
  id: string;
  status: string;
  job_type: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// Processing steps for the multi-step progress bar
const PROCESSING_STEPS = [
  { id: 'audio', label: 'Audio Enhancement', icon: Volume2 },
  { id: 'video', label: 'Video Enhancement', icon: Sun },
  { id: 'filler', label: 'Filler Removal', icon: Mic },
  { id: 'pauses', label: 'Pause Removal', icon: Zap },
  { id: 'color', label: 'Color Correction', icon: Palette },
  { id: 'transcript', label: 'Transcription', icon: Type },
  { id: 'chapters', label: 'Chapter Detection', icon: Layers },
  { id: 'output', label: 'Packaging Output', icon: Film },
];

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AIPostProduction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processVideo, isProcessing } = useVideoProcessing();
  
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showStudioView, setShowStudioView] = useState(false);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'audio'>('all');
  
  // Processing state
  const [isStudioActive, setIsStudioActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  // Thumbnail state
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  
  // Comparison slider
  const [comparisonPosition, setComparisonPosition] = useState(50);

  // Fetch user's media files
  const { data: mediaFiles, isLoading: loadingMedia } = useQuery({
    queryKey: ['media-files-for-processing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, file_url, cloudflare_download_url, duration_seconds, created_at, thumbnail_url, edit_status, file_size_bytes')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaFile[];
    }
  });

  // Fetch processing jobs for selected media
  const { data: processingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['processing-jobs', selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia) return [];
      
      const { data, error } = await supabase
        .from('ai_jobs')
        .select('id, status, job_type, created_at, completed_at, error_message')
        .eq('source_media_id', selectedMedia.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProcessingJob[];
    },
    enabled: !!selectedMedia,
    refetchInterval: isStudioActive ? 2000 : false
  });

  // Real-time subscription for job updates
  useEffect(() => {
    if (!selectedMedia?.id) return;

    const channel = supabase
      .channel(`ai-jobs-${selectedMedia.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_jobs',
          filter: `source_media_id=eq.${selectedMedia.id}`
        },
        (payload) => {
          console.log('Job update:', payload);
          refetchJobs();
          
          // Update studio state based on job status
          const job = payload.new as any;
          if (job) {
            if (job.status === 'completed') {
              setIsStudioActive(false);
              setCurrentStep(PROCESSING_STEPS.length);
              setStepProgress(100);
              setProcessingStatus('Complete!');
              toast({
                title: "Processing Complete!",
                description: "Your media has been enhanced successfully.",
              });
            } else if (job.status === 'failed') {
              setIsStudioActive(false);
              setProcessingStatus('Failed');
              toast({
                title: "Processing Failed",
                description: job.error_message || "An error occurred during processing.",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMedia?.id, refetchJobs, toast]);

  // Simulate step progression during processing
  useEffect(() => {
    if (!isStudioActive) return;

    const interval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) {
          setCurrentStep(step => {
            if (step < PROCESSING_STEPS.length - 1) {
              setProcessingStatus(PROCESSING_STEPS[step + 1].label + '...');
              return step + 1;
            }
            return step;
          });
          return 0;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStudioActive]);

  const handleStartProcessing = async (mode: 'full' | 'clips') => {
    if (!selectedMedia) {
      toast({
        title: "No media selected",
        description: "Please select a video or audio file first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Reset studio state
      setIsStudioActive(true);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      
      const jobType = mode === 'full' ? 'ai_edit' : 'full_process';
      await processVideo(selectedMedia.id, jobType);
      
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
      
      toast({
        title: "Processing started",
        description: "View progress in the Studio below",
        action: (
          <Button size="sm" variant="outline" onClick={() => {
            document.getElementById('processing-studio')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            View Studio
          </Button>
        )
      });
    } catch (error) {
      console.error('Processing error:', error);
      setIsStudioActive(false);
      setProcessingStatus('Failed');
    }
  };

  const handleRetryJob = async (job: ProcessingJob) => {
    if (!selectedMedia) return;
    
    try {
      setIsStudioActive(true);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      
      await processVideo(selectedMedia.id, job.job_type as any);
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
      
      toast({ title: "Retrying processing...", description: "Job resubmitted successfully" });
    } catch (error) {
      setIsStudioActive(false);
      toast({ title: "Retry failed", variant: "destructive" });
    }
  };

  const handleGenerateThumbnails = async () => {
    if (!selectedMedia) return;
    
    setIsGeneratingThumbnails(true);
    
    // Simulate thumbnail generation
    await new Promise(r => setTimeout(r, 2000));
    
    const mockThumbnails = [
      `https://picsum.photos/seed/${selectedMedia.id}-1/400/225`,
      `https://picsum.photos/seed/${selectedMedia.id}-2/400/225`,
      `https://picsum.photos/seed/${selectedMedia.id}-3/400/225`,
      `https://picsum.photos/seed/${selectedMedia.id}-4/400/225`,
    ];
    
    setGeneratedThumbnails(mockThumbnails);
    setSelectedThumbnail(mockThumbnails[0]);
    setIsGeneratingThumbnails(false);
    
    toast({ title: "Thumbnails generated!", description: "Select one to set as default" });
  };

  const handleSetDefaultThumbnail = async () => {
    if (!selectedMedia || !selectedThumbnail) return;
    
    try {
      await supabase
        .from('media_files')
        .update({ thumbnail_url: selectedThumbnail })
        .eq('id', selectedMedia.id);
      
      queryClient.invalidateQueries({ queryKey: ['media-files-for-processing'] });
      toast({ title: "Thumbnail saved!" });
      setShowThumbnailDialog(false);
    } catch (error) {
      toast({ title: "Failed to save thumbnail", variant: "destructive" });
    }
  };

  const latestJob = processingJobs?.[0];
  const latestFailedJob = processingJobs?.find(j => j.status === 'failed');
  const videoUrl = selectedMedia?.cloudflare_download_url || selectedMedia?.file_url;

  // Filter media files
  const filteredMedia = mediaFiles?.filter(f => {
    if (mediaFilter === 'all') return true;
    return f.file_type === mediaFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio/media')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Post-Production</h1>
            <p className="text-muted-foreground">
              Automatically enhance, edit, and generate clips from your content
            </p>
          </div>
        </div>

        {/* Media Selection Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Select Media
            </CardTitle>
            <CardDescription>
              Choose a video or audio file from your Media Library to process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMedia ? (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex items-center justify-center relative">
                  {selectedMedia.thumbnail_url ? (
                    <img 
                      src={selectedMedia.thumbnail_url} 
                      alt={selectedMedia.file_name || 'Media'}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedMedia.file_type === 'video' ? (
                    <FileVideo className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FileAudio className="h-8 w-8 text-muted-foreground" />
                  )}
                  {videoUrl && (
                    <button 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      onClick={() => setShowStudioView(true)}
                    >
                      <Play className="h-6 w-6 text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedMedia.file_name || 'Untitled'}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(selectedMedia.duration_seconds)}
                    </span>
                    <span>{formatFileSize(selectedMedia.file_size_bytes)}</span>
                    <Badge variant="outline">{selectedMedia.file_type || 'unknown'}</Badge>
                    {selectedMedia.edit_status === 'edited' && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        AI Enhanced
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowMediaSelector(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-24 border-dashed"
                onClick={() => setShowMediaSelector(true)}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span>Select from Media Library</span>
                </div>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Processing Studio (Pic-in-Pic) */}
        {isStudioActive && selectedMedia && (
          <Card className="mb-8 border-primary" id="processing-studio">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Processing Studio
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsStudioActive(false);
                    toast({ title: "Processing continues in background" });
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Minimize
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Video Preview */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {videoUrl ? (
                    <video 
                      src={videoUrl} 
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileVideo className="h-16 w-16 text-white/20" />
                    </div>
                  )}
                  
                  {/* Processing Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          {(() => {
                            const StepIcon = PROCESSING_STEPS[currentStep]?.icon || Wand2;
                            return <StepIcon className="h-8 w-8 text-primary animate-bounce" />;
                          })()}
                        </div>
                      </div>
                      {/* Ripple effect */}
                      <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />
                    </div>
                    <p className="mt-4 text-white font-medium">{processingStatus}</p>
                    <p className="text-white/60 text-sm">Step {currentStep + 1} of {PROCESSING_STEPS.length}</p>
                  </div>
                </div>

                {/* Step Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">
                      {Math.round((currentStep / PROCESSING_STEPS.length) * 100 + (stepProgress / PROCESSING_STEPS.length))}%
                    </span>
                  </div>
                  <Progress 
                    value={(currentStep / PROCESSING_STEPS.length) * 100 + (stepProgress / PROCESSING_STEPS.length)} 
                    className="h-2"
                  />
                  
                  <div className="space-y-2 mt-6">
                    {PROCESSING_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isComplete = index < currentStep;
                      const isActive = index === currentStep;
                      
                      return (
                        <div 
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-all",
                            isActive && "bg-primary/10 ring-1 ring-primary/30",
                            isComplete && "opacity-60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isComplete && "bg-green-500 text-white",
                            isActive && "bg-primary text-primary-foreground animate-pulse",
                            !isComplete && !isActive && "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <StepIcon className="h-4 w-4" />
                            )}
                          </div>
                          <span className={cn(
                            "text-sm",
                            isActive && "font-medium",
                            isComplete && "text-muted-foreground line-through"
                          )}>
                            {step.label}
                          </span>
                          {isActive && (
                            <div className="ml-auto flex items-center gap-2">
                              <Progress value={stepProgress} className="w-20 h-1" />
                              <span className="text-xs text-muted-foreground">{Math.round(stepProgress)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Job Banner */}
        {latestFailedJob && !isStudioActive && (
          <Card className="mb-8 border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">AI processing failed</p>
                    <p className="text-sm text-muted-foreground">
                      {latestFailedJob.error_message || 'An error occurred during processing'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRetryJob(latestFailedJob)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Run Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Full AI Post-Production */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Full AI Post-Production
              </CardTitle>
              <CardDescription>
                Complete automated enhancement pipeline for podcasts and videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Volume2 className="h-4 w-4 text-blue-500" />
                  <span>Audio Enhancement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4 text-green-500" />
                  <span>Filler Word Removal</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span>Video Enhancement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 text-orange-500" />
                  <span>Color Correction</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span>Chapter Detection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4 text-cyan-500" />
                  <span>Auto Transcript</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">Outputs Generated:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Enhanced Video/Audio</Badge>
                  <Badge variant="secondary">Chapters JSON</Badge>
                  <Badge variant="secondary">Full Transcript</Badge>
                  <Badge variant="secondary">SRT Captions</Badge>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={!selectedMedia || isProcessing || isStudioActive}
                onClick={() => handleStartProcessing('full')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Run Full AI Post-Production
              </Button>
            </CardContent>
          </Card>

          {/* AI Clip Generation */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-cyan-500" />
                Generate AI Clips
              </CardTitle>
              <CardDescription>
                Automatically create social media clips from your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span>Hook Detection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Film className="h-4 w-4 text-red-500" />
                  <span>High-Energy Moments</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4 text-green-500" />
                  <span>Auto Captions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span>Multi-Format Export</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">Export Formats:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">9:16 TikTok/Reels</Badge>
                  <Badge variant="secondary">1:1 Instagram</Badge>
                  <Badge variant="secondary">16:9 YouTube</Badge>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                disabled={!selectedMedia || isProcessing || isStudioActive}
                onClick={() => handleStartProcessing('clips')}
              >
                <Scissors className="h-4 w-4 mr-2" />
                Generate AI Clips
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Thumbnail Generation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Thumbnail Generation
            </CardTitle>
            <CardDescription>
              Generate or upload thumbnails for your processed content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                disabled={!selectedMedia || isGeneratingThumbnails}
                onClick={handleGenerateThumbnails}
              >
                {isGeneratingThumbnails ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                <span>Generate with AI</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => setShowThumbnailDialog(true)}
              >
                <Upload className="h-5 w-5" />
                <span>Upload Custom</span>
              </Button>
            </div>

            {/* Generated Thumbnails Preview */}
            {generatedThumbnails.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Generated Thumbnails</h4>
                <div className="grid grid-cols-4 gap-3">
                  {generatedThumbnails.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedThumbnail(url)}
                      className={cn(
                        "aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedThumbnail === url ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSetDefaultThumbnail} disabled={!selectedThumbnail}>
                    <Check className="h-4 w-4 mr-2" />
                    Set as Default
                  </Button>
                  <Button variant="outline" onClick={handleGenerateThumbnails}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing History */}
        {selectedMedia && processingJobs && processingJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing History</CardTitle>
              <CardDescription>Recent AI processing jobs for this media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processingJobs.slice(0, 10).map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => {
                      if (job.status === 'completed') {
                        setShowStudioView(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {job.status === 'processing' || job.status === 'queued' ? (
                        <div className="relative">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                        </div>
                      ) : job.status === 'completed' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {job.job_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'failed' && (
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleRetryJob(job);
                        }}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === 'completed' && (
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          setShowStudioView(true);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge 
                        variant={
                          job.status === 'completed' ? 'default' : 
                          job.status === 'failed' ? 'destructive' : 
                          job.status === 'processing' ? 'secondary' :
                          'outline'
                        }
                        className={cn(
                          job.status === 'completed' && 'bg-green-500',
                          job.status === 'processing' && 'bg-blue-500'
                        )}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Selector Dialog */}
        <Dialog open={showMediaSelector} onOpenChange={setShowMediaSelector}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Media</DialogTitle>
              <DialogDescription>
                Choose a video or audio file to process
              </DialogDescription>
            </DialogHeader>
            <Tabs value={mediaFilter} onValueChange={(v) => setMediaFilter(v as any)} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({mediaFiles?.length || 0})</TabsTrigger>
                <TabsTrigger value="video">Videos ({mediaFiles?.filter(f => f.file_type === 'video').length || 0})</TabsTrigger>
                <TabsTrigger value="audio">Audio ({mediaFiles?.filter(f => f.file_type === 'audio').length || 0})</TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1 mt-4">
                {loadingMedia ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredMedia?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No media files found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/studio/media')}
                    >
                      Go to Media Library
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filteredMedia?.map((file) => (
                      <MediaSelectItem 
                        key={file.id} 
                        file={file} 
                        selected={selectedMedia?.id === file.id}
                        onSelect={() => {
                          setSelectedMedia(file);
                          setShowMediaSelector(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Studio View Dialog - Before/After Comparison */}
        <Dialog open={showStudioView} onOpenChange={setShowStudioView}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Studio View</DialogTitle>
              <DialogDescription>
                Compare original and enhanced versions of your content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Comparison View */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex">
                  {/* Original */}
                  <div 
                    className="h-full overflow-hidden"
                    style={{ width: `${comparisonPosition}%` }}
                  >
                    {videoUrl && (
                      <video 
                        src={videoUrl} 
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.9) contrast(0.95)' }}
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-white text-sm">
                      Original
                    </div>
                  </div>
                  
                  {/* Enhanced */}
                  <div 
                    className="h-full overflow-hidden"
                    style={{ width: `${100 - comparisonPosition}%` }}
                  >
                    {videoUrl && (
                      <video 
                        src={videoUrl} 
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(1.1) contrast(1.05) saturate(1.1)' }}
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-primary/90 px-3 py-1 rounded text-white text-sm">
                      Enhanced
                    </div>
                  </div>
                </div>
                
                {/* Slider handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                  style={{ left: `${comparisonPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <ChevronRight className="h-4 w-4 text-black -ml-1" />
                    <ChevronRight className="h-4 w-4 text-black -ml-3 rotate-180" />
                  </div>
                </div>
              </div>
              
              {/* Comparison Slider */}
              <div className="px-4">
                <Slider
                  value={[comparisonPosition]}
                  onValueChange={([v]) => setComparisonPosition(v)}
                  min={10}
                  max={90}
                  step={1}
                />
              </div>

              {/* Download Links */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Enhanced Video
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Transcript
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Chapters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Thumbnail Upload Dialog */}
        <Dialog open={showThumbnailDialog} onOpenChange={setShowThumbnailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Thumbnail</DialogTitle>
              <DialogDescription>
                Upload a custom thumbnail for your content
              </DialogDescription>
            </DialogHeader>
            <div className="py-8">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <ImagePlus className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop an image, or click to browse
                </p>
                <Button variant="outline">Select Image</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Media Select Item Component
function MediaSelectItem({ 
  file, 
  selected, 
  onSelect 
}: { 
  file: MediaFile; 
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:bg-muted/50"
      )}
    >
      <div className="w-20 h-14 bg-muted rounded overflow-hidden flex items-center justify-center flex-shrink-0">
        {file.thumbnail_url ? (
          <img 
            src={file.thumbnail_url} 
            alt={file.file_name || 'Media'}
            className="w-full h-full object-cover"
          />
        ) : file.file_type === 'video' ? (
          <FileVideo className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileAudio className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.file_name || 'Untitled'}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(file.duration_seconds)}
          </span>
          <span>•</span>
          <span>{formatFileSize(file.file_size_bytes)}</span>
          <span>•</span>
          <span>{file.created_at ? formatDistanceToNow(new Date(file.created_at), { addSuffix: true }) : 'Unknown'}</span>
        </div>
      </div>
      <Badge variant="outline" className="flex-shrink-0 capitalize">
        {file.file_type || 'unknown'}
      </Badge>
      {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
    </button>
  );
}
