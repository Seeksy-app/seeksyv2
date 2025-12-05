import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, Link2, Film, Sparkles, ChevronLeft,
  Download, Loader2, Play, Heart, ThumbsDown,
  Calendar, Folder, Scissors, X, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";

// Platform icons for export
const PlatformIcons = {
  tiktok: () => <span className="text-[10px]">🎵</span>,
  instagram: () => <span className="text-[10px]">📸</span>,
  youtube: () => <span className="text-[10px]">▶️</span>,
  facebook: () => <span className="text-[10px]">📘</span>,
  x: () => <span className="text-[10px]">✖</span>,
};

interface Clip {
  id: string;
  user_id: string;
  source_media_id: string;
  ai_job_id: string | null;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number | null;
  storage_path: string | null;
  title: string | null;
  suggested_caption: string | null;
  virality_score: number | null;
  status: string;
  vertical_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  created_at: string;
}

interface MediaFile {
  id: string;
  file_name: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  cloudflare_uid: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
}

interface AIJob {
  id: string;
  status: string;
  error_message: string | null;
  processing_time_seconds: number | null;
}

type Step = "intake" | "processing" | "gallery";

const PROCESSING_STAGES = [
  { key: "init", label: "Initializing...", progress: 5 },
  { key: "transcribe", label: "Transcribing speech...", progress: 20 },
  { key: "analyze", label: "Analyzing key moments...", progress: 40 },
  { key: "detect", label: "Detecting speakers & hooks...", progress: 55 },
  { key: "score", label: "Scoring viral potential...", progress: 70 },
  { key: "generate", label: "Generating clips...", progress: 85 },
  { key: "finalize", label: "Finalizing clips...", progress: 95 },
  { key: "complete", label: "Complete!", progress: 100 },
];

export default function ClipEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { deductCredit } = useCredits();
  const [searchParams] = useSearchParams();
  const mediaIdParam = searchParams.get("media");
  
  const [step, setStep] = useState<Step>("intake");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(mediaIdParam);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"all" | "video" | "audio">("all");

  // Fetch user credits
  const { data: userCredits } = useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  // Fetch media library with filters
  const { data: mediaFiles } = useQuery({
    queryKey: ["media-files-for-clips", mediaFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      
      const { data } = await query;
      return (data || []) as MediaFile[];
    },
  });

  // Filter media by type
  const filteredMedia = mediaFiles?.filter(m => {
    if (mediaFilter === "all") return true;
    const ext = (m.file_name || "").toLowerCase();
    if (mediaFilter === "video") return ext.includes(".mp4") || ext.includes(".mov") || ext.includes(".webm") || m.cloudflare_uid;
    if (mediaFilter === "audio") return ext.includes(".mp3") || ext.includes(".wav") || ext.includes(".m4a");
    return true;
  });

  // Fetch selected media
  const { data: selectedMedia } = useQuery({
    queryKey: ["selected-media-clip", selectedMediaId],
    queryFn: async () => {
      if (!selectedMediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes")
        .eq("id", selectedMediaId)
        .single();
      return data as MediaFile | null;
    },
    enabled: !!selectedMediaId,
  });

  // Fetch clips for selected media
  const { data: clips, refetch: refetchClips } = useQuery({
    queryKey: ["clips-for-media", selectedMediaId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("virality_score", { ascending: false });
      
      if (selectedMediaId) {
        query = query.eq("source_media_id", selectedMediaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Clip[];
    },
    enabled: step === "gallery",
  });

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    const poll = async () => {
      const { data: job, error } = await supabase
        .from("ai_jobs")
        .select("id, status, error_message, processing_time_seconds")
        .eq("id", jobId)
        .single();
      
      if (error) {
        console.error("Error polling job:", error);
        return;
      }
      
      if (job.status === "completed") {
        setCurrentStageIndex(PROCESSING_STAGES.length - 1);
        setProcessingProgress(100);
        setProcessingStage("Complete!");
        
        // Deduct credits based on clips created
        const { count } = await supabase
          .from("clips")
          .select("*", { count: "exact", head: true })
          .eq("ai_job_id", jobId);
        
        const clipCount = count || 0;
        if (clipCount > 0) {
          try {
            await deductCredit("ai_clips", `Generated ${clipCount} AI clips`, { clipCount, jobId });
          } catch (e) {
            console.error("Credit deduction failed:", e);
          }
        }
        
        toast({ title: `${clipCount} clips generated!`, description: "Your clips are ready." });
        
        setTimeout(() => {
          setStep("gallery");
          refetchClips();
        }, 1000);
        
        return;
      }
      
      if (job.status === "failed") {
        setError(job.error_message || "Clip generation failed");
        setStep("intake");
        toast({ 
          title: "Clip generation failed", 
          description: job.error_message || "Please try again",
          variant: "destructive"
        });
        return;
      }
      
      // Still processing - update UI
      attempts++;
      if (attempts < maxAttempts) {
        // Simulate progress through stages
        const stageIndex = Math.min(
          Math.floor(attempts / (maxAttempts / PROCESSING_STAGES.length)),
          PROCESSING_STAGES.length - 2
        );
        setCurrentStageIndex(stageIndex);
        setProcessingStage(PROCESSING_STAGES[stageIndex].label);
        setProcessingProgress(PROCESSING_STAGES[stageIndex].progress);
        
        setTimeout(poll, 2000);
      } else {
        setError("Processing timed out. Please try again.");
        setStep("intake");
      }
    };
    
    poll();
  }, [toast, deductCredit, refetchClips]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast({ 
      title: "Upload to Media Library first", 
      description: "Please upload your video in Media Library, then select it here.",
      variant: "destructive"
    });
  };

  const handleYoutubeUrl = () => {
    if (!youtubeUrl.trim()) return;
    toast({ 
      title: "YouTube import coming soon", 
      description: "This feature is being developed.",
    });
  };

  const handleSelectMedia = (media: MediaFile) => {
    setSelectedMediaId(media.id);
    setShowMediaSelector(false);
    setError(null);
  };

  const handleStartProcessing = async () => {
    if (!selectedMediaId || !selectedMedia) {
      toast({ title: "Please select a video first", variant: "destructive" });
      return;
    }

    // Check credits
    const estimatedClips = 5;
    const requiredCredits = estimatedClips * 3;
    if (userCredits && userCredits.balance < requiredCredits) {
      toast({ 
        title: "Insufficient credits", 
        description: `You need at least ${requiredCredits} credits. You have ${userCredits.balance}.`,
        variant: "destructive",
      });
      navigate("/credits");
      return;
      return;
    }

    setError(null);
    setStep("processing");
    setProcessingProgress(5);
    setCurrentStageIndex(0);
    setProcessingStage(PROCESSING_STAGES[0].label);

    try {
      // Get file URL
      const fileUrl = selectedMedia.cloudflare_download_url || selectedMedia.file_url;
      if (!fileUrl) {
        throw new Error("No video URL available for this media");
      }

      // Call the analyze-clips edge function
      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: selectedMediaId,
          fileUrl,
          duration: selectedMedia.duration_seconds || 0,
        },
      });

      if (error) throw error;
      
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        pollJobStatus(data.jobId);
      } else {
        // Job completed immediately
        toast({ title: `${data.clipsCreated || 0} clips generated!` });
        setStep("gallery");
        refetchClips();
      }
    } catch (err: any) {
      console.error("Error starting clip generation:", err);
      setError(err.message || "Failed to start clip generation");
      setStep("intake");
      toast({ 
        title: "Failed to generate clips", 
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    handleStartProcessing();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getPlayableUrl = (clip: Clip) => {
    // Priority: vertical_url > storage_path > source media with time fragment
    if (clip.vertical_url) return clip.vertical_url;
    if (clip.storage_path && !clip.storage_path.includes("#t=")) return clip.storage_path;
    
    // Fallback to source media with time fragment
    if (selectedMedia) {
      const baseUrl = selectedMedia.cloudflare_download_url || selectedMedia.file_url;
      if (baseUrl) {
        return `${baseUrl}#t=${clip.start_seconds},${clip.end_seconds}`;
      }
    }
    return null;
  };

  const getThumbnailUrl = (clip: Clip) => {
    if (clip.thumbnail_url) return clip.thumbnail_url;
    if (selectedMedia?.thumbnail_url) return selectedMedia.thumbnail_url;
    return null;
  };

  // INTAKE SCREEN
  if (step === "intake") {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/studio")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                AI Clip Engine
              </h1>
              <p className="text-sm text-white/50">Turn long videos into viral clips automatically</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Create Viral Clips in One Click</h2>
            <p className="text-white/60 text-lg">
              Drop a long video, paste a YouTube link, or choose from your recordings
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-400">Clip generation failed</p>
                <p className="text-sm text-white/60 mt-1">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRetry}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Selected Media Preview */}
          {selectedMedia && (
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
              {selectedMedia.thumbnail_url ? (
                <img 
                  src={selectedMedia.thumbnail_url} 
                  alt="" 
                  className="w-20 h-14 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-14 bg-white/10 rounded-lg flex items-center justify-center">
                  <Film className="w-6 h-6 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedMedia.file_name || "Untitled"}</p>
                <p className="text-sm text-white/50">
                  {formatDuration(selectedMedia.duration_seconds)}
                  {selectedMedia.file_size_bytes && ` • ${formatFileSize(selectedMedia.file_size_bytes)}`}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedMediaId(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Upload */}
            <label className="group cursor-pointer">
              <input 
                type="file" 
                accept="video/*,audio/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <div className="h-40 rounded-xl border-2 border-dashed border-white/20 hover:border-emerald-400/50 transition-all flex flex-col items-center justify-center gap-3 group-hover:bg-white/5">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-400/20">
                  <Upload className="w-6 h-6 text-white/60 group-hover:text-emerald-400" />
                </div>
                <span className="font-medium">Upload Video</span>
                <span className="text-xs text-white/40">MP4, MOV, MP3</span>
              </div>
            </label>

            {/* Choose from Studio */}
            <button 
              onClick={() => setShowMediaSelector(true)}
              className="group h-40 rounded-xl border-2 border-dashed border-white/20 hover:border-emerald-400/50 transition-all flex flex-col items-center justify-center gap-3 hover:bg-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-400/20">
                <Film className="w-6 h-6 text-white/60 group-hover:text-emerald-400" />
              </div>
              <span className="font-medium">Choose from Studio</span>
              <span className="text-xs text-white/40">Your recordings</span>
            </button>

            {/* Paste URL */}
            <div className="h-40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white/60" />
              </div>
              <span className="font-medium">Paste URL</span>
              <Input
                placeholder="YouTube link..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="h-8 text-xs bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handleStartProcessing}
              disabled={!selectedMediaId && !youtubeUrl}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8"
            >
              <Sparkles className="w-5 h-5" />
              Generate Clips
            </Button>
            <p className="text-xs text-white/40 mt-3">
              3 credits per clip • {userCredits?.balance || 0} credits available
            </p>
          </div>
        </div>

        {/* Media Selector Modal */}
        {showMediaSelector && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
              <div className="p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Choose from Media Library</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowMediaSelector(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                {/* Filter tabs */}
                <div className="flex gap-2">
                  {(["all", "video", "audio"] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setMediaFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-all",
                        mediaFilter === filter 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredMedia?.map(media => {
                    // Generate thumbnail URL from cloudflare_uid if no thumbnail_url
                    const thumbnailSrc = media.thumbnail_url || 
                      (media.cloudflare_uid ? `https://customer-typiggwc4l6lm7r2.cloudflarestream.com/${media.cloudflare_uid}/thumbnails/thumbnail.jpg?time=5s&width=320` : null);
                    
                    return (
                      <button
                        key={media.id}
                        onClick={() => handleSelectMedia(media)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all hover:bg-white/5",
                          selectedMediaId === media.id 
                            ? "border-emerald-400 bg-emerald-400/10" 
                            : "border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {thumbnailSrc ? (
                            <img 
                              src={thumbnailSrc} 
                              alt="" 
                              className="w-16 h-12 object-cover rounded-lg bg-white/5"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={cn(
                            "w-16 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0",
                            thumbnailSrc && "hidden"
                          )}>
                            <Film className="w-5 h-5 text-white/40" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{media.file_name || "Untitled"}</p>
                            <p className="text-xs text-white/50">
                              {formatDuration(media.duration_seconds)}
                              {media.file_size_bytes && ` • ${formatFileSize(media.file_size_bytes)}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {(!filteredMedia || filteredMedia.length === 0) && (
                    <div className="col-span-2 text-center py-12 text-white/50">
                      <Film className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No {mediaFilter !== "all" ? mediaFilter : ""} files in your library yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PROCESSING SCREEN
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Creating Your Clips</h1>
              <p className="text-sm text-white/50">AI is analyzing your video...</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Video Preview */}
          {selectedMedia && (
            <div className="mb-8 relative">
              <div className="w-64 h-36 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                {selectedMedia.thumbnail_url ? (
                  <img 
                    src={selectedMedia.thumbnail_url} 
                    alt="" 
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white/80 truncate">{selectedMedia.file_name}</p>
                </div>
              </div>
              {/* Ripple animation */}
              <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/30 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
          )}

          {/* Progress Section */}
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">{Math.round(processingProgress)}%</h2>
              <p className="text-white/60">{processingStage}</p>
            </div>

            {/* Progress Bar */}
            <Progress value={processingProgress} className="h-2 mb-8" />

            {/* Steps */}
            <div className="space-y-3">
              {PROCESSING_STAGES.slice(0, -1).map((stage, idx) => (
                <div 
                  key={stage.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    idx === currentStageIndex && "bg-emerald-500/10 border border-emerald-500/30",
                    idx < currentStageIndex && "opacity-60"
                  )}
                >
                  {idx < currentStageIndex ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : idx === currentStageIndex ? (
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/30" />
                  )}
                  <span className={cn(
                    "text-sm",
                    idx <= currentStageIndex ? "text-white" : "text-white/40"
                  )}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GALLERY SCREEN
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setStep("intake");
                setSelectedMediaId(null);
              }}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Your Clips
              </h1>
              <p className="text-sm text-white/50">{clips?.length || 0} clips generated</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setStep("intake");
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate More
            </Button>
          </div>
        </div>
      </div>

      {/* Clips Grid */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6">
          {clips && clips.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {clips.map((clip) => (
                <div 
                  key={clip.id} 
                  className="group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                >
                  {/* Thumbnail */}
                  <div 
                    className="aspect-[9/16] relative cursor-pointer"
                    onClick={() => setPlayingClipId(clip.id)}
                  >
                    {getThumbnailUrl(clip) ? (
                      <img 
                        src={getThumbnailUrl(clip)!} 
                        alt={clip.title || "Clip"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-purple-900/30 flex items-center justify-center">
                        <Film className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>

                    {/* Score Badge */}
                    {clip.virality_score && (
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {clip.virality_score}
                      </div>
                    )}

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                      {formatDuration(clip.duration_seconds || (clip.end_seconds - clip.start_seconds))}
                    </div>

                    {/* Status Badge */}
                    {clip.status !== "ready" && clip.status !== "pending" && (
                      <div className="absolute top-2 right-2">
                        <Badge variant={clip.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                          {clip.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 mb-2">{clip.title || "Untitled Clip"}</p>
                    
                    {/* Caption/Hook */}
                    {clip.suggested_caption && (
                      <p className="text-xs text-yellow-400 font-medium truncate mb-2">
                        "{clip.suggested_caption}"
                      </p>
                    )}

                    {/* Platform Icons */}
                    <div className="flex items-center gap-1">
                      {Object.entries(PlatformIcons).slice(0, 3).map(([key, Icon]) => (
                        <div key={key} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                          <Icon />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Scissors className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-semibold mb-2">No clips yet</h3>
              <p className="text-white/50 mb-6">Generate clips from your videos to get started</p>
              <Button onClick={() => setStep("intake")} className="bg-emerald-500 hover:bg-emerald-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Clips
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Video Player Dialog */}
      <Dialog open={!!playingClipId} onOpenChange={() => setPlayingClipId(null)}>
        <DialogContent className="max-w-4xl bg-[#1a1f2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {clips?.find(c => c.id === playingClipId)?.title || "Clip"}
            </DialogTitle>
          </DialogHeader>
          {playingClipId && (
            <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-lg overflow-hidden">
              {(() => {
                const clip = clips?.find(c => c.id === playingClipId);
                const url = clip ? getPlayableUrl(clip) : null;
                if (url) {
                  return (
                    <video 
                      src={url}
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }
                return (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <div className="text-center">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                      <p>Video not available yet</p>
                      <p className="text-xs mt-1">Clip is still processing</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
