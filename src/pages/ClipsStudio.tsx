import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipsStudioLayout } from "@/components/clips-studio/ClipsStudioLayout";
import { SourceSelector } from "@/components/clips-studio/SourceSelector";
import { Loader2 } from "lucide-react";

export interface ClipData {
  id: string;
  title: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  virality_score: number;
  hook_score?: number;
  flow_score?: number;
  value_score?: number;
  trend_score?: number;
  suggested_caption?: string;
  transcript_snippet?: string;
  storage_path?: string;
  status: string;
  aspect_ratio: string;
  template_id: string;
}

export interface SourceMedia {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  duration_seconds: number | null;
  cloudflare_uid?: string;
  created_at?: string;
  source?: string;
  edit_transcript?: any;
}

export default function ClipsStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'select' | 'analyze' | 'edit'>('select');
  const [sourceMedia, setSourceMedia] = useState<SourceMedia | null>(null);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for mediaId in URL params (from AI Post-Production flow)
  useEffect(() => {
    const mediaId = searchParams.get('mediaId');
    if (mediaId) {
      loadMediaAndAnalyze(mediaId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const loadMediaAndAnalyze = async (mediaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: media, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", mediaId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (media) {
        const mappedMedia: SourceMedia = {
          id: media.id,
          file_url: media.file_url,
          file_name: media.file_name,
          file_type: media.file_type,
          duration_seconds: media.duration_seconds,
          cloudflare_uid: media.cloudflare_uid || undefined,
          created_at: media.created_at,
          source: (media as any).source,
          edit_transcript: media.edit_transcript,
        };
        setSourceMedia(mappedMedia);
        
        // Check if clips already exist for this media
        const { data: existingClips } = await supabase
          .from("clips")
          .select("*")
          .eq("source_media_id", mediaId)
          .is("deleted_at", null)
          .order("virality_score", { ascending: false });

        if (existingClips && existingClips.length > 0) {
          setClips(existingClips as ClipData[]);
          setStep('edit');
        } else {
          setStep('analyze');
          analyzeVideo(mappedMedia);
        }
      }
    } catch (error) {
      console.error("Error loading media:", error);
      toast({
        title: "Error",
        description: "Failed to load media file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelect = async (media: SourceMedia) => {
    setSourceMedia(media);
    setStep('analyze');
    
    // Check for existing clips first
    const { data: existingClips } = await supabase
      .from("clips")
      .select("*")
      .eq("source_media_id", media.id)
      .is("deleted_at", null)
      .order("virality_score", { ascending: false });

    if (existingClips && existingClips.length > 0) {
      setClips(existingClips as ClipData[]);
      setStep('edit');
      toast({
        title: "Clips found",
        description: `Found ${existingClips.length} existing clips for this video`,
      });
    } else {
      analyzeVideo(media);
    }
  };

  const analyzeVideo = async (media: SourceMedia) => {
    setIsAnalyzing(true);
    
    try {
      const transcript = media.edit_transcript?.transcript || null;
      
      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: media.id,
          fileUrl: media.file_url,
          duration: media.duration_seconds,
          transcript,
        },
      });

      if (error) throw error;

      // Fetch the created clips from database
      const { data: createdClips, error: fetchError } = await supabase
        .from("clips")
        .select("*")
        .eq("source_media_id", media.id)
        .is("deleted_at", null)
        .order("virality_score", { ascending: false });

      if (fetchError) throw fetchError;

      setClips(createdClips as ClipData[] || []);
      setStep('edit');
      
      toast({
        title: "Analysis complete!",
        description: `Found ${createdClips?.length || 0} viral-worthy moments`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze video for clips",
        variant: "destructive",
      });
      setStep('select');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = () => {
    if (sourceMedia) {
      setStep('analyze');
      analyzeVideo(sourceMedia);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'select') {
    return (
      <SourceSelector 
        onMediaSelect={handleMediaSelect}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (step === 'analyze' && isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">AI is analyzing your video</h2>
          <p className="text-muted-foreground max-w-md">
            Finding viral-worthy moments with Hook, Flow, Value, and Trend scoring...
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Detecting key moments
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Scoring virality
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Generating captions
          </span>
        </div>
      </div>
    );
  }

  return (
    <ClipsStudioLayout
      sourceMedia={sourceMedia!}
      clips={clips}
      setClips={setClips}
      onReanalyze={handleReanalyze}
      onBack={() => setStep('select')}
    />
  );
}
