import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, Download, Image as ImageIcon } from "lucide-react";

interface ThumbnailManagerProps {
  mediaId: string;
  currentThumbnail?: string;
  onThumbnailUpdate?: (thumbnailUrl: string) => void;
}

export function ThumbnailManager({ mediaId, currentThumbnail, onThumbnailUpdate }: ThumbnailManagerProps) {
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(currentThumbnail || null);

  const handleGenerateThumbnail = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-thumbnail', {
        body: { 
          videoTitle: videoTitle || undefined,
          videoDescription: videoDescription || undefined,
          style: "eye-catching"
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedThumbnail(data.imageUrl);
        toast.success("Thumbnail generated successfully");
      }
    } catch (error: any) {
      console.error('Error generating thumbnail:', error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mediaId}-thumbnail-${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      setUploadedThumbnail(urlData.publicUrl);
      onThumbnailUpdate?.(urlData.publicUrl);
      toast.success("Thumbnail uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
    }
  };

  const saveThumbnail = async (thumbnailUrl: string) => {
    try {
      // Note: thumbnail storage is handled via metadata for now
      // In future, add thumbnail_url column to media_files table
      onThumbnailUpdate?.(thumbnailUrl);
      toast.success("Thumbnail saved");
    } catch (error: any) {
      console.error('Error saving thumbnail:', error);
      toast.error("Failed to save thumbnail");
    }
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Thumbnail</h3>
        <p className="text-xs text-muted-foreground">
          Upload or generate a thumbnail for your video
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Video Title (Optional)</Label>
            <Input
              placeholder="Enter video title for context..."
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Description (Optional)</Label>
            <Textarea
              placeholder="Brief description to help AI generate relevant thumbnail..."
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>

          <Button 
            onClick={handleGenerateThumbnail} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Thumbnail
              </>
            )}
          </Button>

          {generatedThumbnail && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <Label className="text-sm font-medium mb-2 block">Generated Thumbnail</Label>
                <img 
                  src={generatedThumbnail} 
                  alt="Generated thumbnail"
                  className="w-full h-auto rounded-md mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(generatedThumbnail)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveThumbnail(generatedThumbnail)}
                    className="flex-1"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Thumbnail</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 1920x1080px (16:9), max 5MB
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {uploadedThumbnail && !isUploading && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <Label className="text-sm font-medium mb-2 block">Uploaded Thumbnail</Label>
                <img 
                  src={uploadedThumbnail} 
                  alt="Uploaded thumbnail"
                  className="w-full h-auto rounded-md"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
