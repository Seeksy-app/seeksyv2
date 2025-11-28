import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, 
  Upload, 
  Music,
  FileAudio,
  Sparkles,
  PlayCircle
} from "lucide-react";
import { toast } from "sonner";

interface PodcastStudioTabProps {
  podcastId: string;
  userId: string;
}

export const PodcastStudioTab = ({ podcastId, userId }: PodcastStudioTabProps) => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        toast.success("Audio file selected");
      } else {
        toast.error("Please upload an audio file");
      }
    }
  };

  const handleGoToFullStudio = () => {
    navigate("/podcast-studio", {
      state: { podcastId }
    });
  };

  const handleCreateEpisode = () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }
    
    navigate(`/podcasts/${podcastId}/episodes/new-from-studio`, {
      state: {
        audioFile: uploadedFile,
        title: episodeTitle,
        description: episodeDescription,
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={handleGoToFullStudio}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Full Recording Studio</CardTitle>
                <CardDescription>Multi-track recording with AI features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Open Studio
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Quick Upload</CardTitle>
                <CardDescription>Upload pre-recorded audio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Have a recording ready? Upload it directly below.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload & Create Episode</CardTitle>
          <CardDescription>
            Upload your audio file and we'll help you prepare it for publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audio-upload">Audio File</Label>
            <div className="mt-2">
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="audio-upload"
                className="flex items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-center">
                  {uploadedFile ? (
                    <>
                      <FileAudio className="w-12 h-12 mx-auto mb-2 text-primary" />
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">Click to upload audio file</p>
                      <p className="text-sm text-muted-foreground">MP3, WAV, M4A up to 500MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {uploadedFile && (
            <>
              <div>
                <Label htmlFor="episode-title">Episode Title</Label>
                <Input
                  id="episode-title"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="Enter episode title"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="episode-description">Episode Description</Label>
                <Textarea
                  id="episode-description"
                  value={episodeDescription}
                  onChange={(e) => setEpisodeDescription(e.target.value)}
                  placeholder="Describe your episode..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Tools */}
      <Card>
        <CardHeader>
          <CardTitle>AI Enhancement Tools</CardTitle>
          <CardDescription>
            Available after uploading your audio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <Music className="w-8 h-8 mb-2 text-muted-foreground" />
              <h4 className="font-medium mb-1">Remove Filler Words</h4>
              <p className="text-sm text-muted-foreground">
                Auto-detect and remove "um", "uh", etc.
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <Sparkles className="w-8 h-8 mb-2 text-muted-foreground" />
              <h4 className="font-medium mb-1">Generate Show Notes</h4>
              <p className="text-sm text-muted-foreground">
                AI-powered episode summary and chapters
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <FileAudio className="w-8 h-8 mb-2 text-muted-foreground" />
              <h4 className="font-medium mb-1">Enhance Audio Quality</h4>
              <p className="text-sm text-muted-foreground">
                Noise reduction and audio normalization
              </p>
            </div>
          </div>

          <Button 
            className="w-full mt-4" 
            size="lg"
            disabled={!uploadedFile}
            onClick={handleCreateEpisode}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Create Episode with AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};