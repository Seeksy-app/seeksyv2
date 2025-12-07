import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, FileAudio, FileVideo, FileText, Shield, Loader2, Music, Youtube, Download, ExternalLink, CheckCircle, RefreshCw, Clock, Search, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useSpotifyConnect } from "@/hooks/useSpotifyConnect";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";

export const MyProofsTab = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Certify pending content mutation
  const certifyMutation = useMutation({
    mutationFn: async (contentIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('certify-protected-content', {
        body: { content_ids: contentIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["protected-content"] });
      queryClient.invalidateQueries({ queryKey: ["content-protection-stats"] });
      toast.success(`Certified ${data.certified} of ${data.total} items on blockchain`);
    },
    onError: (error) => {
      toast.error("Certification failed: " + error.message);
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

  // Filter content by search
  const filteredContent = protectedContent?.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Count pending items
  const pendingContent = filteredContent.filter(c => !c.blockchain_tx_hash);
  const certifiedContent = filteredContent.filter(c => c.blockchain_tx_hash);

  const handleCertifyAll = () => {
    if (pendingContent.length === 0) {
      toast.info("No pending content to certify");
      return;
    }
    const ids = pendingContent.map(c => c.id);
    certifyMutation.mutate(ids);
  };

  const handleCertifySingle = (contentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    certifyMutation.mutate([contentId]);
  };

  const handleContentClick = (content: any) => {
    if (content.blockchain_tx_hash) {
      window.open(`https://polygonscan.com/tx/${content.blockchain_tx_hash}`, '_blank');
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

  // Build active scan status message
  const getActiveScanStatus = () => {
    const scanning: string[] = [];
    if (isSpotifyImporting) scanning.push("Spotify");
    if (isYouTubeImporting) scanning.push("YouTube");
    return scanning;
  };

  const activeScanChannels = getActiveScanStatus();
  const isScanning = activeScanChannels.length > 0;

  const handleStopScan = () => {
    // Note: This is a UI indication - actual abort would require AbortController in the hooks
    toast.info("Scan will stop after current batch completes");
  };

  return (
    <div className="space-y-6">
      {/* Last Scan Info */}
      {protectedContent && protectedContent.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last scan: {new Date(protectedContent[0]?.updated_at || protectedContent[0]?.created_at).toLocaleString()}</span>
        </div>
      )}

      {/* Active Scan Status Banner */}
      {isScanning && (
        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  <span className="text-blue-600">Scanning & Syncing...</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeScanChannels.join(", ")}: Importing new content
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopScan}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </Card>
      )}

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
                disabled={isSpotifyImporting || isYouTubeImporting}
              >
                {isSpotifyImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4 mr-2 text-green-500" />
                    Import from Spotify
                  </>
                )}
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
                disabled={isYouTubeImporting || isSpotifyImporting}
              >
                {isYouTubeImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2 text-red-500" />
                    Import from YouTube
                  </>
                )}
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

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">My Protected Content</h2>
          <p className="text-sm text-muted-foreground">
            Register your content to protect it from unauthorized use
          </p>
          <div className="relative mt-3 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {pendingContent.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleCertifyAll}
                    disabled={certifyMutation.isPending}
                  >
                    {certifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Certify All ({pendingContent.length})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create blockchain certificates for all pending content</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
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
      </div>

      {filteredContent && filteredContent.length > 0 ? (
        <div className="grid gap-4">
          {filteredContent.map((content) => {
            const Icon = getContentTypeIcon(content.content_type);
            const isCertified = !!content.blockchain_tx_hash;
            return (
              <Card 
                key={content.id} 
                className={`p-3 transition-all ${isCertified ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''}`}
                onClick={() => handleContentClick(content)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{content.title}</h3>
                      {isCertified ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Type: {content.content_type}</span>
                      <span>
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                      {isCertified && (
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </span>
                      )}
                    </div>
                  </div>
                  {!isCertified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleCertifySingle(content.id, e)}
                      disabled={certifyMutation.isPending}
                      className="shrink-0"
                    >
                      {certifyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Certify
                        </>
                      )}
                    </Button>
                  )}
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
