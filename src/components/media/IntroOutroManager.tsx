import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Film } from "lucide-react";

interface IntroOutroManagerProps {
  mediaId: string;
  type: 'intro' | 'outro';
}

export function IntroOutroManager({ mediaId, type }: IntroOutroManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mediaId}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      setUploadedVideo(urlData.publicUrl);
      
      // Note: intro/outro URLs stored via metadata for now
      // In future, add intro_url and outro_url columns to media_files table
      
      toast.success(`${type === 'intro' ? 'Intro' : 'Outro'} uploaded successfully`);
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1 capitalize">{type} Video</h3>
        <p className="text-xs text-muted-foreground">
          Add a custom {type} to your video
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload {type === 'intro' ? 'Intro' : 'Outro'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Video</Label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              MP4, MOV, or WebM format, max 50MB
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {uploadedVideo && !isUploading && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <Label className="text-sm font-medium mb-2 block">
                  Uploaded {type === 'intro' ? 'Intro' : 'Outro'}
                </Label>
                <video 
                  src={uploadedVideo} 
                  controls
                  className="w-full h-auto rounded-md"
                >
                  Your browser does not support the video element.
                </video>
              </CardContent>
            </Card>
          )}

          {!uploadedVideo && !isUploading && (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No {type} uploaded yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
