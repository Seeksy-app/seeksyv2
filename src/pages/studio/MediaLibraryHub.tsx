import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Upload, FolderOpen, Video, Mic, Scissors, 
  MoreHorizontal, Play, Clock, Download,
  Grid3X3, List, ChevronLeft, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { UploadMediaDialog } from "@/components/media/UploadMediaDialog";

type MediaFilter = "all" | "audio" | "video" | "clips";

interface MediaFile {
  id: string;
  file_name: string;
  file_type: string;
  duration_seconds: number | null;
  created_at: string;
  cloudflare_download_url: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
}

interface Clip {
  id: string;
  title: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  vertical_url: string | null;
  thumbnail_url: string | null;
}

export default function MediaLibraryHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: mediaFiles, isLoading: loadingMedia } = useQuery({
    queryKey: ["media-library-hub"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      return (data || []) as unknown as MediaFile[];
    },
  });

  const { data: clips, isLoading: loadingClips } = useQuery({
    queryKey: ["clips-library-hub"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return (data || []) as unknown as Clip[];
    },
  });

  const isLoading = loadingMedia || loadingClips;

  const audioFiles = mediaFiles?.filter(m => m.file_type?.includes("audio")) || [];
  const videoFiles = mediaFiles?.filter(m => m.file_type?.includes("video")) || [];

  const filters = [
    { id: "all", label: "All", count: (mediaFiles?.length || 0) + (clips?.length || 0) },
    { id: "audio", label: "Audio", count: audioFiles.length },
    { id: "video", label: "Video", count: videoFiles.length },
    { id: "clips", label: "Clips", count: clips?.length || 0 },
  ];

  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase();
    
    if (activeFilter === "clips") {
      return clips?.filter(c => c.title?.toLowerCase().includes(query)) || [];
    }
    
    let files = mediaFiles || [];
    if (activeFilter === "audio") files = audioFiles;
    if (activeFilter === "video") files = videoFiles;
    
    return files.filter(f => f.file_name?.toLowerCase().includes(query));
  };

  const filteredItems = getFilteredItems();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return "";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("video")) return Video;
    if (fileType?.includes("audio")) return Mic;
    return FolderOpen;
  };

  const renderClipCard = (clip: Clip) => (
    <div
      key={clip.id}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer shadow-sm"
      onClick={() => navigate(`/studio/clips?clipId=${clip.id}`)}
    >
      <div className="aspect-[9/16] max-h-48 bg-muted relative flex items-center justify-center">
        {clip.thumbnail_url ? (
          <img src={clip.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Scissors className="w-10 h-10 text-muted-foreground/40" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {clip.status === "processing" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
            <p className="text-xs text-white/70">Rendering...</p>
            <Progress value={65} className="w-20 h-1 mt-2" />
          </div>
        )}
        <Badge className="absolute bottom-2 right-2 text-xs tabular-nums bg-black/60 text-white border-0">
          {formatDuration(clip.duration_seconds)}
        </Badge>
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-foreground truncate">{clip.title || "Untitled Clip"}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  const renderMediaCard = (file: MediaFile) => {
    const FileIcon = getFileIcon(file.file_type);
    return (
      <div
        key={file.id}
        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer shadow-sm"
        onClick={() => navigate(`/studio/clips?mediaId=${file.id}`)}
      >
        <div className="aspect-video bg-muted relative flex items-center justify-center">
          {file.thumbnail_url ? (
            <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileIcon className="w-10 h-10 text-muted-foreground/40" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <Badge className="absolute bottom-2 right-2 text-xs tabular-nums bg-black/60 text-white border-0">
            {formatDuration(file.duration_seconds)}
          </Badge>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm text-foreground truncate">{file.file_name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
            </p>
            {file.file_size_bytes && file.file_size_bytes > 0 && (
              <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size_bytes)}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => navigate("/studio")}>Back to Studio Home</span>
        </div>
        <h1 className="font-semibold text-foreground">Media Library</h1>
        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4" />
          Upload Media
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as MediaFilter)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeFilter === filter.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {filter.label}
                <span className="ml-1.5 text-xs opacity-60">({filter.count})</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-none", viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground")}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-none", viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground")}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No media files yet</p>
            <p className="text-sm text-muted-foreground mb-4">Upload or record to get started</p>
            <Button onClick={() => navigate("/studio")} className="bg-primary hover:bg-primary/90">
              Go to Studio
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className={cn(
            "grid gap-4",
            activeFilter === "clips" ? "grid-cols-6" : "grid-cols-4"
          )}>
            {activeFilter === "clips" 
              ? (filteredItems as Clip[]).map(renderClipCard)
              : (filteredItems as MediaFile[]).map(renderMediaCard)
            }
          </div>
        ) : (
          <div className="border border-border rounded-xl divide-y divide-border bg-card">
            {(filteredItems as (MediaFile | Clip)[]).map((item) => {
              const isClip = 'title' in item;
              const FileIcon = isClip ? Scissors : getFileIcon((item as MediaFile).file_type);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(isClip ? `/studio/clips?clipId=${item.id}` : `/studio/clips?mediaId=${item.id}`)}
                >
                  <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {(isClip ? (item as Clip).thumbnail_url : (item as MediaFile).thumbnail_url) ? (
                      <img 
                        src={isClip ? (item as Clip).thumbnail_url! : (item as MediaFile).thumbnail_url!} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <FileIcon className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {isClip ? (item as Clip).title || "Untitled Clip" : (item as MediaFile).file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs tabular-nums">
                    {formatDuration(isClip ? (item as Clip).duration_seconds : (item as MediaFile).duration_seconds)}
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

      <UploadMediaDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["media-library-hub"] });
        }}
      />
    </div>
  );
}
