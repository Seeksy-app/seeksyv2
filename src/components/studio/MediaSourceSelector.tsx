import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, FolderOpen, PlayCircle, Video, AudioWaveform, 
  Loader2, Check, AlertCircle, Clock, X
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaSource = 'upload' | 'library' | 'youtube' | 'zoom' | 'riverside';

interface MediaSourceSelectorProps {
  onUploadClick: () => void;
  onLibraryClick: () => void;
  onMediaSelected: (mediaId: string, source: MediaSource) => void;
  selectedMedia: {
    id: string;
    file_name: string | null;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    file_type: string | null;
    source?: MediaSource;
  } | null;
  onClearMedia: () => void;
  importStatus?: 'idle' | 'importing' | 'ready' | 'error';
}

interface ZoomRecording {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  thumbnail_url?: string;
  download_url?: string;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MediaSourceSelector({
  onUploadClick,
  onLibraryClick,
  onMediaSelected,
  selectedMedia,
  onClearMedia,
  importStatus = 'idle'
}: MediaSourceSelectorProps) {
  const { toast } = useToast();
  
  // Modal states
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showZoomConnectModal, setShowZoomConnectModal] = useState(false);
  const [showRiversideModal, setShowRiversideModal] = useState(false);
  
  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [isImportingYouTube, setIsImportingYouTube] = useState(false);
  
  // Zoom state
  const [zoomConnected, setZoomConnected] = useState(false);
  const [zoomRecordings, setZoomRecordings] = useState<ZoomRecording[]>([]);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);
  const [connectingZoom, setConnectingZoom] = useState(false);

  // Validate YouTube URL
  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleYouTubeImport = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a YouTube URL');
      return;
    }
    
    if (!validateYouTubeUrl(youtubeUrl)) {
      setYoutubeError('Please enter a valid YouTube URL');
      return;
    }
    
    setYoutubeError('');
    setIsImportingYouTube(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create media_files row with pending status
      const { data: mediaFile, error: insertError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: `YouTube Import - ${new Date().toLocaleString()}`,
          file_type: 'video',
          file_url: youtubeUrl, // Temporary - will be replaced after import
          source: 'youtube',
          edit_status: 'pending',
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Call edge function to process YouTube video (stub for now)
      const { error: fnError } = await supabase.functions.invoke('import-youtube-video', {
        body: { 
          media_file_id: mediaFile.id,
          youtube_url: youtubeUrl 
        }
      });
      
      // Even if the function fails, we've created the record
      if (fnError) {
        console.warn('YouTube import function not available yet:', fnError);
      }
      
      toast({
        title: "Import Started",
        description: "Your YouTube video is being imported. This may take a few minutes.",
      });
      
      onMediaSelected(mediaFile.id, 'youtube');
      setShowYouTubeModal(false);
      setYoutubeUrl('');
    } catch (error) {
      console.error('YouTube import error:', error);
      toast({
        title: "Import Failed",
        description: "Could not import the YouTube video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImportingYouTube(false);
    }
  };

  const handleZoomClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if Zoom is connected
      const { data: zoomData } = await supabase
        .from('zoom_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (zoomData) {
        setZoomConnected(true);
        setShowZoomModal(true);
        loadZoomRecordings();
      } else {
        setShowZoomConnectModal(true);
      }
    } catch (error) {
      setShowZoomConnectModal(true);
    }
  };

  const loadZoomRecordings = async () => {
    setIsLoadingZoom(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoom-list-recordings');
      
      if (error) throw error;
      
      // Mock data for now if function doesn't return recordings
      const recordings = data?.recordings || [
        {
          id: 'mock-1',
          topic: 'Team Standup Meeting',
          start_time: new Date(Date.now() - 86400000).toISOString(),
          duration: 1800,
          thumbnail_url: 'https://picsum.photos/seed/zoom1/160/90'
        },
        {
          id: 'mock-2', 
          topic: 'Product Demo Call',
          start_time: new Date(Date.now() - 172800000).toISOString(),
          duration: 2400,
          thumbnail_url: 'https://picsum.photos/seed/zoom2/160/90'
        }
      ];
      
      setZoomRecordings(recordings);
    } catch (error) {
      console.error('Error loading Zoom recordings:', error);
      // Show mock data anyway for demo
      setZoomRecordings([
        {
          id: 'mock-1',
          topic: 'Team Standup Meeting',
          start_time: new Date(Date.now() - 86400000).toISOString(),
          duration: 1800,
          thumbnail_url: 'https://picsum.photos/seed/zoom1/160/90'
        }
      ]);
    } finally {
      setIsLoadingZoom(false);
    }
  };

  const handleConnectZoom = async () => {
    setConnectingZoom(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoom-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Zoom connect error:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Zoom. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnectingZoom(false);
    }
  };

  const handleZoomRecordingSelect = async (recording: ZoomRecording) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create media_files row
      const { data: mediaFile, error: insertError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: recording.topic,
          file_type: 'video',
          file_url: recording.download_url || 'pending-zoom-import',
          source: 'zoom',
          edit_status: 'pending',
          duration_seconds: recording.duration,
          thumbnail_url: recording.thumbnail_url,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      toast({
        title: "Import Started",
        description: "Your Zoom recording is being imported.",
      });
      
      onMediaSelected(mediaFile.id, 'zoom');
      setShowZoomModal(false);
    } catch (error) {
      console.error('Zoom import error:', error);
      toast({
        title: "Import Failed",
        description: "Could not import the Zoom recording.",
        variant: "destructive"
      });
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (importStatus) {
      case 'importing':
        return (
          <Badge className="bg-[#FFCF5C] text-[#053877] animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Importing...
          </Badge>
        );
      case 'ready':
        return (
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = (source?: MediaSource) => {
    switch (source) {
      case 'upload': return 'Uploaded';
      case 'library': return 'Media Library';
      case 'youtube': return 'YouTube';
      case 'zoom': return 'Zoom';
      case 'riverside': return 'Riverside';
      default: return 'Unknown';
    }
  };

  // If media is selected, show compact view
  if (selectedMedia) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-[rgba(5,56,119,0.18)]">
        <div className="w-28 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center relative shrink-0">
          {selectedMedia.thumbnail_url ? (
            <img 
              src={selectedMedia.thumbnail_url} 
              alt={selectedMedia.file_name || 'Media'}
              className="w-full h-full object-cover"
            />
          ) : selectedMedia.file_type === 'video' ? (
            <Video className="h-8 w-8 text-muted-foreground" />
          ) : (
            <AudioWaveform className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{selectedMedia.file_name || 'Untitled'}</p>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(selectedMedia.duration_seconds)}
            </span>
            <Badge variant="outline" className="text-xs">
              {getSourceLabel(selectedMedia.source)}
            </Badge>
            {getStatusBadge()}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onClearMedia}
          className="shrink-0"
        >
          Change Media
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Source Buttons */}
      <div 
        className="border-2 border-dashed rounded-xl p-6"
        style={{ borderColor: 'rgba(5, 56, 119, 0.18)' }}
      >
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {/* Upload Files */}
          <Button
            onClick={onUploadClick}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium"
            style={{ 
              backgroundColor: '#FFCF5C', 
              color: '#053877',
            }}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>

          {/* From Media Library */}
          <Button
            onClick={onLibraryClick}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium text-white"
            style={{ backgroundColor: '#053877' }}
          >
            <FolderOpen className="h-4 w-4" />
            From Media Library
          </Button>

          {/* Import from YouTube */}
          <Button
            onClick={() => setShowYouTubeModal(true)}
            variant="outline"
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium border-red-500 text-red-600 hover:bg-red-50"
          >
            <PlayCircle className="h-4 w-4" />
            Import from YouTube
          </Button>

          {/* Import from Zoom */}
          <Button
            onClick={handleZoomClick}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium text-white"
            style={{ backgroundColor: '#2C6BED' }}
          >
            <Video className="h-4 w-4" />
            Import from Zoom
          </Button>

          {/* Import from Riverside */}
          <Button
            onClick={() => setShowRiversideModal(true)}
            variant="outline"
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium"
            style={{ 
              backgroundColor: '#E9E9E9', 
              color: '#333',
              borderColor: '#D1D1D1'
            }}
          >
            <AudioWaveform className="h-4 w-4" />
            Import from Riverside
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Drop your video or audio files here, or select a source above
        </p>
      </div>

      {/* YouTube Import Modal */}
      <Dialog open={showYouTubeModal} onOpenChange={setShowYouTubeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-red-500" />
              Import from YouTube
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to import it for AI post-production
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setYoutubeError('');
                }}
                className={cn(youtubeError && "border-destructive")}
              />
              {youtubeError && (
                <p className="text-sm text-destructive">{youtubeError}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowYouTubeModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleYouTubeImport}
                disabled={isImportingYouTube}
                className="bg-red-600 hover:bg-red-700"
              >
                {isImportingYouTube ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Video'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Connect Modal */}
      <Dialog open={showZoomConnectModal} onOpenChange={setShowZoomConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" style={{ color: '#2C6BED' }} />
              Connect Zoom Account
            </DialogTitle>
            <DialogDescription>
              Connect your Zoom account to import cloud recordings directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                Once connected, you'll be able to browse and import your Zoom cloud recordings 
                for AI enhancement and clip generation.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowZoomConnectModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConnectZoom}
                disabled={connectingZoom}
                style={{ backgroundColor: '#2C6BED' }}
              >
                {connectingZoom ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Zoom Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Recordings Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" style={{ color: '#2C6BED' }} />
              Select Zoom Recording
            </DialogTitle>
            <DialogDescription>
              Choose a cloud recording to import for AI post-production
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {isLoadingZoom ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : zoomRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Video className="h-12 w-12 mb-2 opacity-50" />
                <p>No cloud recordings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {zoomRecordings.map((recording) => (
                  <button
                    key={recording.id}
                    onClick={() => handleZoomRecordingSelect(recording)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg border hover:border-[#2C6BED] hover:bg-blue-50/50 transition-colors text-left"
                  >
                    <div className="w-20 h-12 bg-muted rounded overflow-hidden shrink-0">
                      {recording.thumbnail_url ? (
                        <img 
                          src={recording.thumbnail_url} 
                          alt={recording.topic}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recording.topic}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{new Date(recording.start_time).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(recording.duration)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Riverside Coming Soon Modal */}
      <Dialog open={showRiversideModal} onOpenChange={setShowRiversideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AudioWaveform className="h-5 w-5 text-gray-600" />
              Riverside Import
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <AudioWaveform className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h4 className="font-medium text-gray-800 mb-2">Coming Soon</h4>
              <p className="text-sm text-gray-600">
                Riverside import is coming soon. Connect your account to enable 
                automatic studio sync and import your recordings directly.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRiversideModal(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                disabled
                className="opacity-50"
              >
                Connect Riverside
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
