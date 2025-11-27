import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Play, Trash2, Type, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Clip {
  id: string;
  title: string;
  clip_url: string | null;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  clip_type: string;
  text_overlay: string | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  source_media: {
    file_name: string;
    file_url: string;
  } | null;
}

export function ClipsGallery() {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: clips, isLoading, refetch } = useQuery({
    queryKey: ["media-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("media_clips")
        .select(`
          *,
          source_media:source_media_id (
            file_name,
            file_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Clip[];
    },
  });

  const handleDelete = async (clipId: string) => {
    try {
      const { error } = await supabase
        .from("media_clips")
        .delete()
        .eq("id", clipId);

      if (error) throw error;

      toast.success("Clip deleted");
      refetch();
    } catch (error) {
      console.error("Error deleting clip:", error);
      toast.error("Failed to delete clip");
    }
  };

  const handleDownload = async (clip: Clip) => {
    if (!clip.clip_url) {
      toast.error("Clip not yet processed");
      return;
    }

    try {
      const response = await fetch(clip.clip_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading clip:", error);
      toast.error("Failed to download clip");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clips || clips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Generated Clips
          </CardTitle>
          <CardDescription>
            Clips are automatically generated from your broadcasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No clips yet. Start a broadcast to generate clips automatically!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Clips ({clips.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <Card key={clip.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {clip.thumbnail_url ? (
                  <img
                    src={clip.thumbnail_url}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {clip.status === "processing" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="secondary">Processing...</Badge>
                  </div>
                )}
                {clip.text_overlay && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    <Type className="h-3 w-3 mr-1" />
                    Captions
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold line-clamp-2">{clip.title}</h4>
                  {clip.source_media && (
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {clip.source_media.file_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(clip.duration_seconds)}
                  </div>
                  {clip.clip_type === "ai_generated" && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedClip(clip);
                      setPreviewOpen(true);
                    }}
                    disabled={clip.status === "processing"}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(clip)}
                    disabled={clip.status === "processing"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(clip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.title}</DialogTitle>
            <DialogDescription>
              {selectedClip?.source_media?.file_name && (
                <>From: {selectedClip.source_media.file_name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClip?.clip_url ? (
            <div className="space-y-4">
              <video
                src={selectedClip.clip_url}
                controls
                className="w-full rounded-lg"
              />
              
              {selectedClip.text_overlay && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Caption Text:</p>
                  <p className="text-sm">{selectedClip.text_overlay}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                {selectedClip?.status === "processing" 
                  ? "Clip is being processed..."
                  : "Clip URL not available"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
