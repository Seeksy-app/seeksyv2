import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { UploadMediaDialog } from "@/components/media/UploadMediaDialog";
import { 
  Wand2, Scissors, ArrowLeft, Clock, FileVideo, 
  Sparkles, Volume2, Type, Layers, Upload, Check, Loader2, 
  AlertCircle, Film, Mic, Palette, Sun, X, RefreshCw, Download, Eye,
  ChevronRight, Zap, RotateCcw, Video, ExternalLink, FileText, Share2, FolderOpen
} from "lucide-react";
import { MediaSourceSelector, MediaSource } from "@/components/studio/MediaSourceSelector";
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
  source?: string | null;
}

interface ProcessingJob {
  id: string;
  status: string;
  job_type: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// Processing steps
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
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AIPostProduction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processVideo, isProcessing } = useVideoProcessing();
  
  // Wizard step: 1 = Select, 2 = Processing, 3 = Success
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'audio'>('all');
  
  // Processing state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // AI Analytics state
  const [aiAnalytics, setAiAnalytics] = useState({
    fillerWordsRemoved: 0,
    pausesRemoved: 0,
    silencesTrimmed: 0,
    audioLevelNormalized: 0,
    noiseReduced: 0,
    colorGraded: false,
    chaptersDetected: 0,
    transcriptWords: 0,
    totalTimeSaved: 0,
    originalDuration: 0,
    finalDuration: 0,
  });
  
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
        .select('id, file_name, file_type, file_url, cloudflare_download_url, duration_seconds, created_at, thumbnail_url, edit_status, file_size_bytes, source')
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
    refetchInterval: wizardStep === 2 ? 2000 : false
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
          
          const job = payload.new as any;
          if (job) {
            if (job.status === 'completed') {
              setWizardStep(3);
              setCurrentStep(PROCESSING_STEPS.length);
              setStepProgress(100);
              setProcessingStatus('Complete!');
            } else if (job.status === 'failed') {
              setWizardStep(1);
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
    if (wizardStep !== 2) return;
    
    const mediaDuration = selectedMedia?.duration_seconds || 300;
    setAiAnalytics(prev => ({
      ...prev,
      originalDuration: mediaDuration,
      finalDuration: mediaDuration,
    }));

    let isActive = true;
    
    const interval = setInterval(() => {
      if (!isActive) {
        clearInterval(interval);
        return;
      }
      
      setStepProgress(prev => {
        const increment = Math.random() * 10 + 3;
        const newProgress = Math.min(100, prev + increment);
        
        if (newProgress >= 100 && prev < 100) {
          setCurrentStep(step => {
            // Update analytics based on completed step
            setAiAnalytics(analytics => {
              const updates = { ...analytics };
              switch (step) {
                case 0:
                  updates.audioLevelNormalized = Math.round(Math.random() * 15 + 5);
                  updates.noiseReduced = Math.round(Math.random() * 40 + 20);
                  break;
                case 1:
                  updates.colorGraded = true;
                  break;
                case 2:
                  updates.fillerWordsRemoved = Math.round(Math.random() * 30 + 15);
                  updates.totalTimeSaved += Math.round(Math.random() * 20 + 10);
                  updates.finalDuration = Math.max(updates.originalDuration - updates.totalTimeSaved, updates.originalDuration * 0.85);
                  break;
                case 3:
                  updates.pausesRemoved = Math.round(Math.random() * 25 + 10);
                  updates.silencesTrimmed = Math.round(Math.random() * 40 + 20);
                  updates.totalTimeSaved += Math.round(Math.random() * 15 + 8);
                  updates.finalDuration = Math.max(updates.originalDuration - updates.totalTimeSaved, updates.originalDuration * 0.8);
                  break;
                case 5:
                  updates.transcriptWords = Math.round(analytics.originalDuration * 2.5);
                  break;
                case 6:
                  updates.chaptersDetected = Math.round(Math.random() * 5 + 3);
                  break;
              }
              return updates;
            });
            
            const nextStep = step + 1;
            
            if (nextStep < PROCESSING_STEPS.length) {
              setProcessingStatus(PROCESSING_STEPS[nextStep].label + '...');
              setStepProgress(0);
              return nextStep;
            } else {
              isActive = false;
              clearInterval(interval);
              setWizardStep(3);
              setProcessingStatus('Complete!');
              return step;
            }
          });
          
          return 100;
        }
        
        return newProgress;
      });
    }, 700);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [wizardStep, selectedMedia?.duration_seconds]);

  const handleStartProcessing = async () => {
    if (!selectedMedia) {
      toast({
        title: "No media selected",
        description: "Please select a video or audio file first",
        variant: "destructive"
      });
      return;
    }

    try {
      setWizardStep(2);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      setAiAnalytics({
        fillerWordsRemoved: 0,
        pausesRemoved: 0,
        silencesTrimmed: 0,
        audioLevelNormalized: 0,
        noiseReduced: 0,
        colorGraded: false,
        chaptersDetected: 0,
        transcriptWords: 0,
        totalTimeSaved: 0,
        originalDuration: selectedMedia.duration_seconds || 300,
        finalDuration: selectedMedia.duration_seconds || 300,
      });
      
      await processVideo(selectedMedia.id, 'ai_edit');
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
      
      // Auto-scroll to processing section
      setTimeout(() => {
        document.getElementById('processing-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Processing error:', error);
      setWizardStep(1);
      setProcessingStatus('Failed');
    }
  };

  const handleRetryJob = async (job: ProcessingJob) => {
    if (!selectedMedia) return;
    
    try {
      setWizardStep(2);
      setCurrentStep(0);
      setStepProgress(0);
      setProcessingStatus(PROCESSING_STEPS[0].label + '...');
      setAiAnalytics({
        fillerWordsRemoved: 0,
        pausesRemoved: 0,
        silencesTrimmed: 0,
        audioLevelNormalized: 0,
        noiseReduced: 0,
        colorGraded: false,
        chaptersDetected: 0,
        transcriptWords: 0,
        totalTimeSaved: 0,
        originalDuration: selectedMedia.duration_seconds || 300,
        finalDuration: selectedMedia.duration_seconds || 300,
      });
      
      await processVideo(selectedMedia.id, job.job_type as any);
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
    } catch (error) {
      setWizardStep(1);
      toast({ title: "Retry failed", variant: "destructive" });
    }
  };

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media);
    setShowMediaSelector(false);
    // Auto-scroll to step 2 area
    setTimeout(() => {
      document.getElementById('processing-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const handleChangeMedia = () => {
    setSelectedMedia(null);
    setWizardStep(1);
    setCurrentStep(0);
    setStepProgress(0);
  };

  const latestFailedJob = processingJobs?.find(j => j.status === 'failed');
  const videoUrl = selectedMedia?.cloudflare_download_url || selectedMedia?.file_url;
  const overallProgress = Math.min(100, Math.round((currentStep / PROCESSING_STEPS.length) * 100 + (stepProgress / PROCESSING_STEPS.length)));

  // Filter media files
  const filteredMedia = mediaFiles?.filter(f => {
    if (mediaFilter === 'all') return true;
    return f.file_type === mediaFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio/media')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Post-Production</h1>
            <p className="text-sm text-muted-foreground">
              Enhance your content in 3 simple steps
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                wizardStep >= step 
                  ? "bg-[#053877] text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {wizardStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium",
                wizardStep >= step ? "text-foreground" : "text-muted-foreground"
              )}>
                {step === 1 ? 'Select' : step === 2 ? 'Enhance' : 'Complete'}
              </span>
              {step < 3 && <div className="w-8 h-px bg-border mx-3" />}
            </div>
          ))}
        </div>

        {/* ========== STEP 1: SELECT MEDIA ========== */}
        {!selectedMedia ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#053877] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <h2 className="text-lg font-semibold">Select Your Media</h2>
              </div>
              <MediaSourceSelector
                onUploadClick={() => setShowUploadDialog(true)}
                onLibraryClick={() => setShowMediaSelector(true)}
                onMediaSelected={(mediaId, source) => {
                  const media = mediaFiles?.find(m => m.id === mediaId);
                  if (media) {
                    handleMediaSelect({ ...media, source } as MediaFile);
                  } else {
                    queryClient.invalidateQueries({ queryKey: ['media-files-for-processing'] });
                    handleMediaSelect({
                      id: mediaId,
                      file_name: `Importing from ${source}...`,
                      file_type: 'video',
                      file_url: null,
                      cloudflare_download_url: null,
                      duration_seconds: null,
                      created_at: new Date().toISOString(),
                      thumbnail_url: null,
                      edit_status: 'pending',
                      file_size_bytes: null,
                      source
                    });
                  }
                }}
                selectedMedia={null}
                onClearMedia={() => {}}
                importStatus="idle"
              />
            </CardContent>
          </Card>
        ) : (
          /* Collapsed Selection Header */
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border mb-6" style={{ borderColor: 'rgba(5,56,119,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-muted rounded overflow-hidden flex items-center justify-center">
                {selectedMedia.thumbnail_url ? (
                  <img src={selectedMedia.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Video className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  🎥 Selected: {selectedMedia.file_name || 'Untitled'}
                  {selectedMedia.duration_seconds && (
                    <span className="text-muted-foreground">({formatDuration(selectedMedia.duration_seconds)})</span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleChangeMedia}>
              Change Video
            </Button>
          </div>
        )}

        {/* ========== STEP 2: PROCESSING ========== */}
        <div id="processing-section">
          {selectedMedia && wizardStep === 1 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#053877] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <h2 className="text-lg font-semibold">Start Enhancement</h2>
                </div>
                
                {/* Failed Job Banner */}
                {latestFailedJob && (
                  <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm text-destructive font-medium">
                        Previous processing failed: {latestFailedJob.error_message || 'Unknown error'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRetryJob(latestFailedJob)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}

                <p className="text-muted-foreground mb-4">
                  AI will enhance your video with noise reduction, filler word removal, chapter detection, and more.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary" className="gap-1"><Volume2 className="h-3 w-3" /> Audio Enhancement</Badge>
                  <Badge variant="secondary" className="gap-1"><Mic className="h-3 w-3" /> Filler Removal</Badge>
                  <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> Pause Trimming</Badge>
                  <Badge variant="secondary" className="gap-1"><Sun className="h-3 w-3" /> Color Correction</Badge>
                  <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" /> Chapters</Badge>
                  <Badge variant="secondary" className="gap-1"><Type className="h-3 w-3" /> Transcript</Badge>
                </div>

                <Button 
                  className="w-full text-white"
                  style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
                  size="lg"
                  disabled={isProcessing}
                  onClick={handleStartProcessing}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start AI Enhancement
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Processing State */}
          {wizardStep === 2 && selectedMedia && (
            <Card className="mb-6 border-2" style={{ borderColor: '#2C6BED' }}>
              <CardContent className="pt-6">
                {/* Sticky Overall Progress */}
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}>
                  <div className="flex items-center justify-between text-white mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Overall Progress
                    </span>
                    <span className="font-bold">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2 bg-white/20" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {videoUrl ? (
                      <video src={videoUrl} className="w-full h-full object-contain" autoPlay muted loop />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileVideo className="h-16 w-16 text-white/20" />
                      </div>
                    )}
                    
                    {/* Processing Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-[#2C6BED]/30 flex items-center justify-center">
                          {(() => {
                            const StepIcon = PROCESSING_STEPS[currentStep]?.icon || Wand2;
                            return <StepIcon className="h-7 w-7 text-[#2C6BED] animate-pulse" />;
                          })()}
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#2C6BED]/50 animate-ping" />
                      </div>
                      <p className="mt-3 text-white font-medium">{processingStatus}</p>
                      <p className="text-white/60 text-sm">Step {currentStep + 1} of {PROCESSING_STEPS.length}</p>
                    </div>
                  </div>

                  {/* Step Progress */}
                  <div className="space-y-2">
                    {PROCESSING_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isComplete = index < currentStep;
                      const isActive = index === currentStep;
                      
                      return (
                        <div 
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-all",
                            isActive && "bg-[#2C6BED]/10 ring-1 ring-[#2C6BED]/30",
                            isComplete && "opacity-60"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                            isComplete && "bg-green-500 text-white",
                            isActive && "bg-[#2C6BED] text-white animate-pulse",
                            !isComplete && !isActive && "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                          </div>
                          <span className={cn(
                            "text-sm flex-1",
                            isActive && "font-medium",
                            isComplete && "text-muted-foreground line-through"
                          )}>
                            {step.label}
                          </span>
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <Progress value={stepProgress} className="w-16 h-1" />
                              <span className="text-xs text-muted-foreground w-8">{Math.round(stepProgress)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* AI Processing Analytics - Live */}
                <div className="mt-6 p-4 bg-muted/50 rounded-xl border">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-[#2C6BED]" />
                    <h4 className="font-semibold">AI Processing Analytics</h4>
                    <Badge variant="outline" className="ml-auto text-xs animate-pulse" style={{ borderColor: '#2C6BED', color: '#2C6BED' }}>Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <AnalyticsCard icon={Mic} label="Filler Words" value={aiAnalytics.fillerWordsRemoved} unit="removed" color="text-orange-500" />
                    <AnalyticsCard icon={Zap} label="Pauses" value={aiAnalytics.pausesRemoved} unit="trimmed" color="text-yellow-500" />
                    <AnalyticsCard icon={Volume2} label="Silences" value={aiAnalytics.silencesTrimmed} unit="cut" color="text-blue-500" />
                    <AnalyticsCard icon={Sun} label="Noise Reduced" value={aiAnalytics.noiseReduced} unit="%" color="text-green-500" />
                    <AnalyticsCard icon={Clock} label="Time Saved" value={Math.round(aiAnalytics.totalTimeSaved)} unit="sec" color="text-purple-500" />
                    <AnalyticsCard icon={Layers} label="Chapters" value={aiAnalytics.chaptersDetected} unit="detected" color="text-pink-500" />
                  </div>
                  
                  {/* Duration Comparison */}
                  {aiAnalytics.totalTimeSaved > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20 flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Original: {formatDuration(aiAnalytics.originalDuration)} → Enhanced: {formatDuration(aiAnalytics.finalDuration)}
                      </span>
                      <Badge className="bg-green-500 text-white">
                        -{Math.round((aiAnalytics.totalTimeSaved / aiAnalytics.originalDuration) * 100)}% shorter
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== STEP 3: SUCCESS ========== */}
          {wizardStep === 3 && selectedMedia && (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="p-6 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">🎉 Your Video Has Been Successfully Enhanced</h2>
                    <p className="text-white/80 text-sm">Your enhanced content is ready. Choose what you'd like to do next.</p>
                  </div>
                </div>
              </div>

              {/* Analytics Summary */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2C6BED]" />
                    Enhancement Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                    <AnalyticsCard icon={Mic} label="Filler Words" value={aiAnalytics.fillerWordsRemoved} unit="removed" color="text-green-600" bg="bg-green-50" />
                    <AnalyticsCard icon={Zap} label="Pauses" value={aiAnalytics.pausesRemoved} unit="trimmed" color="text-green-600" bg="bg-green-50" />
                    <AnalyticsCard icon={Volume2} label="Silences" value={aiAnalytics.silencesTrimmed} unit="cut" color="text-green-600" bg="bg-green-50" />
                    <AnalyticsCard icon={Sun} label="Noise Reduced" value={aiAnalytics.noiseReduced} unit="%" color="text-blue-600" bg="bg-blue-50" />
                    <AnalyticsCard icon={Layers} label="Chapters" value={aiAnalytics.chaptersDetected} unit="detected" color="text-blue-600" bg="bg-blue-50" />
                    <AnalyticsCard icon={Clock} label="Time Saved" value={Math.round(aiAnalytics.totalTimeSaved)} unit="sec" color="text-amber-600" bg="bg-amber-50" />
                  </div>
                  
                  {aiAnalytics.totalTimeSaved > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          Duration: {formatDuration(aiAnalytics.originalDuration)} → {formatDuration(aiAnalytics.finalDuration)}
                        </span>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        {Math.round((aiAnalytics.totalTimeSaved / aiAnalytics.originalDuration) * 100)}% improvement
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Download Actions */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Download Your Files</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                      <Download className="h-5 w-5 text-[#2C6BED]" />
                      <span className="text-xs">Enhanced Video</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                      <FileText className="h-5 w-5 text-[#2C6BED]" />
                      <span className="text-xs">Transcript</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                      <Layers className="h-5 w-5 text-[#2C6BED]" />
                      <span className="text-xs">Chapters JSON</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                      <Type className="h-5 w-5 text-[#2C6BED]" />
                      <span className="text-xs">SRT Captions</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Next Steps</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start h-auto py-3 text-white"
                      style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
                      onClick={() => navigate(`/studio/ai-clips?mediaId=${selectedMedia.id}`)}
                    >
                      <Scissors className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">✂️ Generate AI Clips from This Video</div>
                        <div className="text-xs text-white/70">Create viral short clips automatically</div>
                      </div>
                      <ChevronRight className="h-5 w-5 ml-auto" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start" onClick={() => setShowComparisonModal(true)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Compare Original vs Enhanced
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => navigate('/studio/media')}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        View in Media Library
                      </Button>
                    </div>
                    
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share or Copy Link
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Recent Activity - Only when media selected and not in success state */}
        {selectedMedia && processingJobs && processingJobs.length > 0 && wizardStep !== 3 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {processingJobs.filter(j => j.status === 'completed').slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Enhancement Complete</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => navigate('/studio/media')}>
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
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
              <DialogDescription>Choose a video or audio file to process</DialogDescription>
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
                    <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Media
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filteredMedia?.map((file) => (
                      <div 
                        key={file.id}
                        onClick={() => handleMediaSelect(file)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                          selectedMedia?.id === file.id && "ring-2 ring-[#2C6BED] bg-[#2C6BED]/5"
                        )}
                      >
                        <div className="w-20 h-12 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0">
                          {file.thumbnail_url ? (
                            <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : file.file_type === 'video' ? (
                            <Video className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <Volume2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.file_name || 'Untitled'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {file.duration_seconds && <span>{formatDuration(file.duration_seconds)}</span>}
                            {file.source && <Badge variant="outline" className="text-xs">{file.source}</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Comparison Modal */}
        <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-[#053877] to-[#2C6BED] px-6 py-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-white text-lg font-semibold">Compare Original vs Enhanced</DialogTitle>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowComparisonModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="h-full overflow-hidden relative" style={{ width: `${comparisonPosition}%` }}>
                    {videoUrl && (
                      <video src={videoUrl} className="w-full h-full object-cover" style={{ filter: 'brightness(0.9) contrast(0.95)' }} autoPlay muted loop />
                    )}
                    <div className="absolute top-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium">Original</div>
                  </div>
                  
                  <div className="h-full overflow-hidden relative" style={{ width: `${100 - comparisonPosition}%` }}>
                    {videoUrl && (
                      <video src={videoUrl} className="w-full h-full object-cover" style={{ filter: 'brightness(1.1) contrast(1.05) saturate(1.1)' }} autoPlay muted loop />
                    )}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-[#053877] to-[#2C6BED] px-3 py-1.5 rounded-lg text-white text-sm font-medium">Enhanced</div>
                  </div>
                </div>
                
                <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg" style={{ left: `${comparisonPosition}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <ChevronRight className="h-4 w-4 text-gray-700 -ml-0.5" />
                    <ChevronRight className="h-4 w-4 text-gray-700 -ml-3 rotate-180" />
                  </div>
                </div>
              </div>
              
              <div className="px-4">
                <Slider value={[comparisonPosition]} onValueChange={([v]) => setComparisonPosition(v)} min={10} max={90} step={1} />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['media-files-for-processing'] });
            setShowUploadDialog(false);
          }}
        />
      </div>
    </div>
  );
}

// Analytics Card Component
function AnalyticsCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  color,
  bg = "bg-background"
}: { 
  icon: any; 
  label: string; 
  value: number; 
  unit: string; 
  color: string;
  bg?: string;
}) {
  return (
    <div className={cn("p-3 rounded-lg border", bg)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold", color)}>
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </div>
  );
}
