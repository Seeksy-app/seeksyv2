import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, Upload, FolderSync, Play, Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DropboxImportDialog } from "@/components/tv/DropboxImportDialog";
import { VideoUploadDialog } from "@/components/tv/VideoUploadDialog";
import { format } from "date-fns";

const AdminSeeksyTV = () => {
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: tvContent, isLoading, refetch } = useQuery({
    queryKey: ['admin-tv-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: importJobs } = useQuery({
    queryKey: ['dropbox-import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropbox_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPublishBadge = (isPublished: boolean) => {
    return isPublished 
      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Published</Badge>
      : <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tv className="h-8 w-8 text-primary" />
            Seeksy TV Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage video content for Seeksy TV platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDropboxOpen(true)}>
            <FolderSync className="h-4 w-4 mr-2" />
            Import from Dropbox
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tvContent?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tvContent?.filter(v => v.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {tvContent?.filter(v => !v.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {importJobs?.filter(j => j.status === 'pending' || j.status === 'processing').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Import Jobs */}
      {importJobs && importJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Import Jobs</CardTitle>
            <CardDescription>Status of Dropbox imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderSync className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{job.series_name || 'Untitled'}</span>
                      <p className="text-xs text-muted-foreground">{job.folder_path || 'Root'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {job.processed_files}/{job.total_files} files
                    </span>
                    {getStatusBadge(job.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Content Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
          <CardDescription>Manage your Seeksy TV content library</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading videos...</div>
          ) : tvContent && tvContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tvContent.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" variant="secondary">
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getPublishBadge(video.is_published)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}m` : 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.view_count || 0} views
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No videos yet</h3>
              <p className="text-muted-foreground mt-1">
                Import videos from Dropbox or upload directly to get started
              </p>
              <Button className="mt-4" onClick={() => setDropboxOpen(true)}>
                <FolderSync className="h-4 w-4 mr-2" />
                Import from Dropbox
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DropboxImportDialog 
        open={dropboxOpen} 
        onOpenChange={setDropboxOpen}
        onImportComplete={() => refetch()}
      />

      <VideoUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={() => refetch()}
      />
    </div>
  );
};

export default AdminSeeksyTV;
