import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Upload, FolderOpen, Video, Mic, Scissors, 
  FileText, MoreHorizontal, Play, Clock, Download,
  Grid3X3, List, Filter, ChevronLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type MediaCategory = "all" | "podcasts" | "videos" | "clips" | "uploads" | "templates";

interface MediaFile {
  id: string;
  file_name: string;
  file_type: string;
  duration_seconds: number | null;
  created_at: string;
  cloudflare_download_url: string | null;
  thumbnail_url: string | null;
}

export default function MediaLibraryHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<MediaCategory>("all");

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ["media-library-hub", activeCategory],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (activeCategory !== "all") {
        // Filter by category based on file type or tags
        if (activeCategory === "videos") {
          query = query.ilike("file_type", "%video%");
        } else if (activeCategory === "podcasts") {
          query = query.ilike("file_type", "%audio%");
        }
      }

      const { data } = await query;
      return (data || []) as unknown as MediaFile[];
    },
  });

  const { data: clips } = useQuery({
    queryKey: ["clips-library-hub"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return data || [];
    },
  });

  const categories = [
    { id: "all", label: "All Media", icon: FolderOpen, count: mediaFiles?.length || 0 },
    { id: "podcasts", label: "Podcast Recordings", icon: Mic, count: mediaFiles?.filter(m => m.file_type?.includes("audio")).length || 0 },
    { id: "videos", label: "Video Recordings", icon: Video, count: mediaFiles?.filter(m => m.file_type?.includes("video")).length || 0 },
    { id: "clips", label: "AI Clips", icon: Scissors, count: clips?.length || 0 },
    { id: "uploads", label: "Raw Uploads", icon: Upload, count: 0 },
    { id: "templates", label: "Templates", icon: FileText, count: 0 },
  ];

  const filteredMedia = mediaFiles?.filter(file => 
    file.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("video")) return Video;
    if (fileType?.includes("audio")) return Mic;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Media Library</h1>
              <p className="text-sm text-muted-foreground">All your recordings and media files</p>
            </div>
          </div>
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Media
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <div className="w-56 shrink-0">
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as MediaCategory)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeCategory === cat.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{cat.label}</span>
                  <span className="text-xs opacity-60">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Grid/List */}
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">Loading...</div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-20">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">No media files yet</p>
                <p className="text-sm text-muted-foreground mb-4">Upload or record to get started</p>
                <Button onClick={() => navigate("/studio")}>
                  Go to Studio
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredMedia.map((file) => {
                  const FileIcon = getFileIcon(file.file_type);
                  return (
                    <div
                      key={file.id}
                      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/studio/ai-clips?mediaId=${file.id}`)}
                    >
                      <div className="aspect-video bg-muted relative flex items-center justify-center">
                        {file.thumbnail_url ? (
                          <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <Badge className="absolute bottom-2 right-2 text-xs tabular-nums">
                          {formatDuration(file.duration_seconds)}
                        </Badge>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-border rounded-xl divide-y divide-border">
                {filteredMedia.map((file) => {
                  const FileIcon = getFileIcon(file.file_type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/studio/ai-clips?mediaId=${file.id}`)}
                    >
                      <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {file.thumbnail_url ? (
                          <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs tabular-nums">
                        {formatDuration(file.duration_seconds)}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
