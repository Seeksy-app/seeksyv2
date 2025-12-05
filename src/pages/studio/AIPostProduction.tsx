import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { 
  Wand2, 
  Scissors, 
  ArrowLeft,
  Play,
  Clock,
  FileVideo,
  FileAudio,
  Sparkles,
  Volume2,
  Type,
  Layers,
  Image,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Film,
  Mic,
  Palette,
  Sun
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MediaFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  duration_seconds: number | null;
  created_at: string;
  thumbnail_url: string | null;
  edit_status: string | null;
}

interface ProcessingJob {
  id: string;
  status: string;
  job_type: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AIPostProduction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processVideo, isProcessing } = useVideoProcessing();
  
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [processingMode, setProcessingMode] = useState<'full' | 'clips' | null>(null);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);

  // Fetch user's media files
  const { data: mediaFiles, isLoading: loadingMedia } = useQuery({
    queryKey: ['media-files-for-processing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, file_url, duration_seconds, created_at, thumbnail_url, edit_status')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .in('file_type', ['video', 'audio'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaFile[];
    }
  });

  // Fetch processing jobs for selected media
  const { data: processingJobs } = useQuery({
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
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      const hasActiveJob = jobs.some(j => j.status === 'processing' || j.status === 'queued');
      return hasActiveJob ? 3000 : false;
    }
  });

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
      setProcessingMode(mode);
      
      const jobType = mode === 'full' ? 'ai_edit' : 'full_process';
      await processVideo(selectedMedia.id, jobType);
      
      queryClient.invalidateQueries({ queryKey: ['processing-jobs', selectedMedia.id] });
      
      toast({
        title: "Processing started",
        description: `AI ${mode === 'full' ? 'post-production' : 'clip generation'} has begun. This may take a few minutes.`
      });
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setProcessingMode(null);
    }
  };

  const latestJob = processingJobs?.[0];
  const isCurrentlyProcessing = latestJob?.status === 'processing' || latestJob?.status === 'queued';

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
                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                  {selectedMedia.thumbnail_url ? (
                    <img 
                      src={selectedMedia.thumbnail_url} 
                      alt={selectedMedia.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedMedia.file_type === 'video' ? (
                    <FileVideo className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FileAudio className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedMedia.file_name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(selectedMedia.duration_seconds)}
                    </span>
                    <Badge variant="outline">{selectedMedia.file_type}</Badge>
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
                disabled={!selectedMedia || isProcessing || isCurrentlyProcessing}
                onClick={() => handleStartProcessing('full')}
              >
                {processingMode === 'full' || (isCurrentlyProcessing && latestJob?.job_type === 'full_enhancement') ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Full AI Post-Production
                  </>
                )}
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
                disabled={!selectedMedia || isProcessing || isCurrentlyProcessing}
                onClick={() => handleStartProcessing('clips')}
              >
                {processingMode === 'clips' || (isCurrentlyProcessing && latestJob?.job_type === 'analysis') ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4 mr-2" />
                    Generate AI Clips
                  </>
                )}
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
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "AI thumbnail generation will be available soon"
                  });
                }}
              >
                <Sparkles className="h-5 w-5" />
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
          </CardContent>
        </Card>

        {/* Processing Status */}
        {selectedMedia && processingJobs && processingJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing History</CardTitle>
              <CardDescription>Recent AI processing jobs for this media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processingJobs.slice(0, 5).map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {job.status === 'processing' || job.status === 'queued' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
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
                    <Badge 
                      variant={
                        job.status === 'completed' ? 'default' : 
                        job.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Selector Dialog */}
        <Dialog open={showMediaSelector} onOpenChange={setShowMediaSelector}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Media</DialogTitle>
              <DialogDescription>
                Choose a video or audio file to process
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto mt-4">
                {loadingMedia ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : mediaFiles?.length === 0 ? (
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
                  <TabsContent value="all" className="mt-0 space-y-2">
                    {mediaFiles?.map((file) => (
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
                  </TabsContent>
                )}
                <TabsContent value="video" className="mt-0 space-y-2">
                  {mediaFiles?.filter(f => f.file_type === 'video').map((file) => (
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
                </TabsContent>
                <TabsContent value="audio" className="mt-0 space-y-2">
                  {mediaFiles?.filter(f => f.file_type === 'audio').map((file) => (
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
                </TabsContent>
              </div>
            </Tabs>
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
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
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
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'border-transparent hover:bg-muted/50'
      }`}
    >
      <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center flex-shrink-0">
        {file.thumbnail_url ? (
          <img 
            src={file.thumbnail_url} 
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        ) : file.file_type === 'video' ? (
          <FileVideo className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileAudio className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDuration(file.duration_seconds)}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      <Badge variant="outline" className="flex-shrink-0">
        {file.file_type}
      </Badge>
      {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
    </button>
  );
}
