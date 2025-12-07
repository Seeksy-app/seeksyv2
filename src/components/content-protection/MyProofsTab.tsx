import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileAudio, FileVideo, FileText, Shield, Loader2, Music, Youtube, Download } from "lucide-react";
import { toast } from "sonner";
import { useSpotifyConnect } from "@/hooks/useSpotifyConnect";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";

export const MyProofsTab = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    contentType: "audio",
    fileUrl: "",
  });

  const { connectSpotify, importPodcasts, isConnecting: isSpotifyConnecting, isImporting: isSpotifyImporting } = useSpotifyConnect();
  const { connectYouTubeForContentProtection, importVideos, isConnecting: isYouTubeConnecting, isImporting: isYouTubeImporting } = useYouTubeConnect();

  // Check if Spotify is connected for content protection
  const { data: spotifyConnection } = useQuery({
    queryKey: ["spotify-connection-content-protection"],
    queryFn: async (): Promise<{ id: string } | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;
      const result = await (supabase
        .from("social_media_profiles") as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "spotify")
        .maybeSingle();
      return result.data as { id: string } | null;
    },
  });

  // Check if YouTube is connected for content protection (either purpose)
  const { data: youtubeConnection } = useQuery({
    queryKey: ["youtube-connection-content-protection"],
    queryFn: async (): Promise<{ id: string; purpose: string } | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;
      
      // First check for content_protection specific connection
      let result = await (supabase
        .from("social_media_profiles") as any)
        .select("id, purpose")
        .eq("user_id", user.id)
        .eq("platform", "youtube")
        .eq("purpose", "content_protection")
        .maybeSingle();
      
      if (result.data) return result.data as { id: string; purpose: string };
      
      // Fallback to analytics connection
      result = await (supabase
        .from("social_media_profiles") as any)
        .select("id, purpose")
        .eq("user_id", user.id)
        .eq("platform", "youtube")
        .eq("purpose", "analytics")
        .maybeSingle();
      
      return result.data as { id: string; purpose: string } | null;
    },
  });

  const { data: protectedContent, isLoading } = useQuery({
    queryKey: ["protected-content"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("protected_content")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const addContentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Not authenticated");

      const fileHash = await generateHash(data.fileUrl || data.title);

      const { data: newContent, error } = await supabase
        .from("protected_content")
        .insert({
          user_id: user.id,
          title: data.title,
          content_type: data.contentType,
          file_url: data.fileUrl || null,
          file_hash: fileHash,
        })
        .select()
        .single();

      if (error) throw error;
      return newContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protected-content"] });
      setIsAddDialogOpen(false);
      setFormData({ title: "", contentType: "audio", fileUrl: "" });
      toast.success("Content registered for protection");
    },
    onError: (error) => {
      toast.error("Failed to register content: " + error.message);
    },
  });

  const generateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + Date.now());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "audio":
        return FileAudio;
      case "video":
        return FileVideo;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSpotifyImport = async () => {
    const result = await importPodcasts();
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["protected-content"] });
    }
  };

  const handleYouTubeImport = async () => {
    const result = await importVideos();
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["protected-content"] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Options Card */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Import Content for Protection
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your accounts to auto-import podcasts and videos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {spotifyConnection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSpotifyImport}
                disabled={isSpotifyImporting}
              >
                {isSpotifyImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Music className="h-4 w-4 mr-2 text-green-500" />
                )}
                Import from Spotify
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connectSpotify}
                disabled={isSpotifyConnecting}
              >
                {isSpotifyConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Music className="h-4 w-4 mr-2 text-green-500" />
                )}
                Connect Spotify
              </Button>
            )}
            {youtubeConnection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleYouTubeImport}
                disabled={isYouTubeImporting}
              >
                {isYouTubeImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Youtube className="h-4 w-4 mr-2 text-red-500" />
                )}
                Import from YouTube
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connectYouTubeForContentProtection}
                disabled={isYouTubeConnecting}
              >
                {isYouTubeConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Youtube className="h-4 w-4 mr-2 text-red-500" />
                )}
                Connect YouTube
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Protected Content</h2>
          <p className="text-sm text-muted-foreground">
            Register your content to protect it from unauthorized use
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Protect Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register Content for Protection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Episode title, video name, etc."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) => setFormData({ ...formData, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio (Podcast, Music)</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="transcript">Transcript</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>File URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => addContentMutation.mutate(formData)}
                disabled={!formData.title || addContentMutation.isPending}
              >
                {addContentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Register & Protect
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {protectedContent && protectedContent.length > 0 ? (
        <div className="grid gap-4">
          {protectedContent.map((content) => {
            const Icon = getContentTypeIcon(content.content_type);
            return (
              <Card key={content.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{content.title}</h3>
                      {content.file_hash && (
                        <Badge variant="outline" className="text-xs">
                          Fingerprinted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Type: {content.content_type}</span>
                      <span>
                        Registered: {new Date(content.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Protected Content Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Register your podcasts, videos, and recordings to protect them.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Protect Your First Content
          </Button>
        </Card>
      )}
    </div>
  );
};
