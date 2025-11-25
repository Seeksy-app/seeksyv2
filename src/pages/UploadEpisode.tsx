import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload as UploadIcon, Image as ImageIcon, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ImageUpload from "@/components/ImageUpload";

const UploadEpisode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeType, setEpisodeType] = useState("full");
  const [isExplicit, setIsExplicit] = useState(false);
  const [publishOption, setPublishOption] = useState("unpublished");
  const [scheduledDate, setScheduledDate] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [episodeArtwork, setEpisodeArtwork] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const uploadEpisode = useMutation({
    mutationFn: async () => {
      if (!user || !audioFile) throw new Error("Missing required data");
      
      // Upload audio file
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("podcast-audio")
        .upload(fileName, audioFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("podcast-audio")
        .getPublicUrl(fileName);
      
      // Determine published status and publish date
      const isPublished = publishOption === 'immediate';
      const publishDate = publishOption === 'scheduled' && scheduledDate 
        ? scheduledDate 
        : new Date().toISOString();
      
      // Create episode record
      const { data, error } = await supabase
        .from("episodes")
        .insert({
          podcast_id: id,
          title,
          description,
          audio_url: publicUrl,
          episode_artwork_url: episodeArtwork || null,
          episode_number: episodeNumber ? parseInt(episodeNumber) : null,
          season_number: seasonNumber ? parseInt(seasonNumber) : null,
          episode_type: episodeType,
          is_explicit: isExplicit,
          file_size_bytes: audioFile.size,
          is_published: isPublished,
          publish_date: publishDate,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Track storage usage (convert bytes to MB)
      const fileSizeMB = Math.ceil(audioFile.size / (1024 * 1024));
      try {
        await supabase.rpc('increment_usage', {
          _user_id: user.id,
          _feature_type: 'podcast_storage_mb',
          _increment: fileSizeMB
        });
      } catch (usageError) {
        console.error("Failed to track storage usage:", usageError);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success("Episode saved successfully!");
      navigate(`/podcasts/${id}`);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to save episode");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an episode title");
      return;
    }
    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }
    uploadEpisode.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select an audio file");
        return;
      }
      setAudioFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select an audio file");
        return;
      }
      setAudioFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/podcasts/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Podcast
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audio File Upload */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : audioFile
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-border'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {audioFile ? (
                  <div className="space-y-3">
                    <Check className="w-12 h-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium">{audioFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Drag audio file here or{" "}
                        <label className="text-primary cursor-pointer underline">
                          choose a file
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload an audio file or{" "}
                        <button
                          type="button"
                          onClick={() => navigate(`/podcasts/${id}`)}
                          className="text-primary underline"
                        >
                          skip and upload later
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="mt-4" />
              )}
            </CardContent>
          </Card>

          {/* Episode Details */}
          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Episode Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Episode"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Episode Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One or two sentences that describe your episode."
                  rows={5}
                  maxLength={3500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length > 0 && `${3500 - description.length} Characters Remaining`}
                </p>
              </div>

              {/* Episode Artwork */}
              <div>
                <Label>Episode Artwork</Label>
                <div className="flex gap-4 items-start mt-2">
                  {podcast?.cover_image_url && (
                    <div className="space-y-2">
                      <img
                        src={episodeArtwork || podcast.cover_image_url}
                        alt="Episode artwork"
                        className="w-24 h-24 rounded object-cover border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEpisodeArtwork("")}
                      >
                        Use Default
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <ImageUpload
                      onImageUploaded={(url) => setEpisodeArtwork(url)}
                      currentImage={episodeArtwork}
                      bucket="podcast-covers"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a custom image or use your podcast artwork.
                    </p>
                  </div>
                </div>
              </div>

              {/* Season & Episode Numbers */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="seasonNumber">Season #</Label>
                  <Input
                    id="seasonNumber"
                    type="number"
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Current season: 1</p>
                </div>
                <div>
                  <Label htmlFor="episodeNumber">Episode #</Label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Previous episode: -</p>
                </div>
                <div>
                  <Label htmlFor="episodeType">Type</Label>
                  <Select value={episodeType} onValueChange={setEpisodeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Explicit Content */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="explicit"
                  checked={isExplicit}
                  onChange={(e) => setIsExplicit(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="explicit" className="cursor-pointer">
                  This episode contains explicit material.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>When do you want to publish?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={publishOption} onValueChange={setPublishOption}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="unpublished" id="unpublished" />
                  <div className="flex-1">
                    <Label htmlFor="unpublished" className="cursor-pointer font-medium">
                      Leave Unpublished
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Manually publish when you're ready.
                    </p>
                  </div>
                  {publishOption === 'unpublished' && <Check className="w-5 h-5 text-primary" />}
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="flex-1">
                    <Label htmlFor="immediate" className="cursor-pointer font-medium">
                      Publish Immediately
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Goes live after processing is complete.
                    </p>
                  </div>
                  {publishOption === 'immediate' && <Check className="w-5 h-5 text-primary" />}
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <div className="flex-1">
                    <Label htmlFor="scheduled" className="cursor-pointer font-medium">
                      Schedule for Future
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Pick a date and time for release.
                    </p>
                    {publishOption === 'scheduled' && (
                      <Input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="mt-3"
                        required={publishOption === 'scheduled'}
                      />
                    )}
                  </div>
                  {publishOption === 'scheduled' && <Check className="w-5 h-5 text-primary" />}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/podcasts/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploadEpisode.isPending || !title.trim()}
              size="lg"
            >
              {uploadEpisode.isPending ? "Saving..." : "Save Episode Details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadEpisode;
