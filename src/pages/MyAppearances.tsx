import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Search, 
  RefreshCw, 
  Youtube, 
  Music2, 
  ExternalLink, 
  Clock, 
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Mic2
} from "lucide-react";
import { format } from "date-fns";

interface GuestAppearance {
  id: string;
  platform: string;
  external_id: string;
  title: string;
  show_name: string | null;
  description: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  detection_method: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
}

export default function MyAppearances() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const [searchName, setSearchName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["youtube", "spotify"]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Fetch appearances
  const { data: appearances, isLoading } = useQuery({
    queryKey: ["guest-appearances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_appearance_scans")
        .select("*")
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data as GuestAppearance[];
    },
    enabled: !!user,
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!searchName.trim()) {
        throw new Error("Please enter your name to search");
      }

      const { data, error } = await supabase.functions.invoke("scan-guest-appearances", {
        body: { 
          searchName: searchName.trim(),
          platforms: selectedPlatforms 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.count} potential appearances!`);
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Scan failed");
    },
  });

  // Toggle verified status
  const toggleVerified = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .update({ is_verified: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
      toast.success(currentStatus ? "Unmarked as verified" : "Marked as verified");
    }
  };

  // Toggle hidden status
  const toggleHidden = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .update({ is_hidden: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
    }
  };

  // Delete appearance
  const deleteAppearance = async (id: string) => {
    const { error } = await supabase
      .from("guest_appearance_scans")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-appearances"] });
      toast.success("Removed from list");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube": return <Youtube className="h-4 w-4 text-red-500" />;
      case "spotify": return <Music2 className="h-4 w-4 text-green-500" />;
      default: return <Mic2 className="h-4 w-4" />;
    }
  };

  const filteredAppearances = appearances?.filter(a => {
    if (activeTab === "verified") return a.is_verified && !a.is_hidden;
    if (activeTab === "hidden") return a.is_hidden;
    return !a.is_hidden;
  });

  const stats = {
    total: appearances?.filter(a => !a.is_hidden).length || 0,
    verified: appearances?.filter(a => a.is_verified && !a.is_hidden).length || 0,
    youtube: appearances?.filter(a => a.platform === "youtube" && !a.is_hidden).length || 0,
    spotify: appearances?.filter(a => a.platform === "spotify" && !a.is_hidden).length || 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Appearances</h1>
          <p className="text-muted-foreground">
            Track your podcast and video guest appearances across platforms
          </p>
        </div>
      </div>

      {/* Search Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Scan for Appearances
          </CardTitle>
          <CardDescription>
            Enter your name to search YouTube and Spotify for podcast episodes where you appeared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter your name (e.g., John Smith)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => scanMutation.mutate()}
              disabled={scanMutation.isPending || !searchName.trim()}
            >
              {scanMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scan Platforms
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-sm font-medium">Platforms:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedPlatforms.includes("youtube")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPlatforms([...selectedPlatforms, "youtube"]);
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== "youtube"));
                  }
                }}
              />
              <Youtube className="h-4 w-4 text-red-500" />
              <span className="text-sm">YouTube</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedPlatforms.includes("spotify")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPlatforms([...selectedPlatforms, "spotify"]);
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== "spotify"));
                  }
                }}
              />
              <Music2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Spotify</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Appearances</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.youtube}</div>
            <p className="text-sm text-muted-foreground">YouTube</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.spotify}</div>
            <p className="text-sm text-muted-foreground">Spotify</p>
          </CardContent>
        </Card>
      </div>

      {/* Appearances List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
          <TabsTrigger value="hidden">Hidden</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredAppearances?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {activeTab === "all" ? (
                  <>
                    <Mic2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No appearances found yet.</p>
                    <p className="text-sm">Enter your name above and scan to find your guest appearances.</p>
                  </>
                ) : (
                  <p>No {activeTab} appearances.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppearances?.map((appearance) => (
                <Card key={appearance.id} className={appearance.is_verified ? "border-green-500/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {appearance.thumbnail_url && (
                        <img
                          src={appearance.thumbnail_url}
                          alt={appearance.title}
                          className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getPlatformIcon(appearance.platform)}
                              {appearance.is_verified && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold line-clamp-1">{appearance.title}</h3>
                            {appearance.show_name && (
                              <p className="text-sm text-muted-foreground">{appearance.show_name}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleVerified(appearance.id, appearance.is_verified)}
                              title={appearance.is_verified ? "Unverify" : "Mark as verified"}
                            >
                              <CheckCircle2 className={`h-4 w-4 ${appearance.is_verified ? "text-green-600" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleHidden(appearance.id, appearance.is_hidden)}
                              title={appearance.is_hidden ? "Show" : "Hide"}
                            >
                              {appearance.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAppearance(appearance.id)}
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {appearance.external_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={appearance.external_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {appearance.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(appearance.published_at), "MMM d, yyyy")}
                            </span>
                          )}
                          {appearance.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(appearance.duration_seconds)}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {appearance.detection_method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
