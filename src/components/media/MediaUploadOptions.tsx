import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { 
  Upload, FolderOpen, PlayCircle, Video, AudioWaveform, 
  Loader2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomRecording {
  id: string;
  topic: string;
  start_time: string;
  duration_seconds: number;
  thumbnail_url?: string;
  download_url?: string;
}

interface MediaUploadOptionsProps {
  onUploadClick: () => void;
  onImportComplete?: () => void;
  showLibraryButton?: boolean;
  onLibraryClick?: () => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MediaUploadOptions({
  onUploadClick,
  onImportComplete,
  showLibraryButton = false,
  onLibraryClick,
  className,
  layout = 'horizontal'
}: MediaUploadOptionsProps) {
  const { toast: toastHook } = useToast();
  
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
      setYoutubeError('Please enter a valid YouTube URL (e.g., youtube.com/watch?v=...)');
      return;
    }
    
    setYoutubeError('');
    setIsImportingYouTube(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-youtube-video', {
        body: { youtube_url: youtubeUrl }
      });
      
      if (error) throw error;
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      toast.success("Import Started", {
        description: "Your YouTube video is being imported. This may take a few minutes.",
      });
      
      setShowYouTubeModal(false);
      setYoutubeUrl('');
      onImportComplete?.();
    } catch (error) {
      console.error('YouTube import error:', error);
      const message = error instanceof Error ? error.message : 'Could not import the YouTube video.';
      setYoutubeError(message);
      toast.error("Import Failed", {
        description: message,
      });
    } finally {
      setIsImportingYouTube(false);
    }
  };

  const handleZoomClick = async () => {
    setIsLoadingZoom(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('zoom-list-recordings');
      
      if (error) throw error;
      
      if (data.status === 'not_connected' || data.status === 'needs_reconnect') {
        setIsLoadingZoom(false);
        setShowZoomConnectModal(true);
        return;
      }
      
      if (data.status === 'ok') {
        setZoomRecordings(data.recordings || []);
        setShowZoomModal(true);
      } else {
        throw new Error(data.message || 'Failed to load recordings');
      }
    } catch (error) {
      console.error('Zoom error:', error);
      setShowZoomConnectModal(true);
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
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error('Zoom connect error:', error);
      toast.error("Connection Failed", {
        description: "Could not connect to Zoom. Please try again.",
      });
    } finally {
      setConnectingZoom(false);
    }
  };

  const handleZoomRecordingSelect = async (recording: ZoomRecording) => {
    setShowZoomModal(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-zoom-recording', {
        body: {
          zoom_recording_id: recording.id,
          topic: recording.topic,
          download_url: recording.download_url,
          duration_seconds: recording.duration_seconds,
          thumbnail_url: recording.thumbnail_url,
        }
      });
      
      if (error) throw error;
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      toast.success("Import Started", {
        description: "Your Zoom recording is being imported.",
      });
      
      onImportComplete?.();
    } catch (error) {
      console.error('Zoom import error:', error);
      toast.error("Import Failed", {
        description: "Could not import the Zoom recording.",
      });
    }
  };

  const handleRiversideClick = async () => {
    setShowRiversideModal(true);
  };

  const buttonClass = layout === 'vertical' 
    ? "w-full justify-start" 
    : "rounded-full px-4 py-2 h-auto gap-2 font-medium";

  return (
    <>
      <div className={cn(
        layout === 'vertical' 
          ? "flex flex-col gap-2" 
          : "flex flex-wrap gap-3 justify-center",
        className
      )}>
        {/* Upload Files */}
        <Button
          onClick={onUploadClick}
          className={cn(buttonClass, "hover:opacity-90 transition-opacity")}
          style={{ backgroundColor: '#FFC857', color: '#053877' }}
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>

        {/* From Media Library - optional */}
        {showLibraryButton && onLibraryClick && (
          <Button
            onClick={onLibraryClick}
            className={cn(buttonClass, "text-white hover:opacity-90 transition-opacity")}
            style={{ backgroundColor: '#053877' }}
          >
            <FolderOpen className="h-4 w-4" />
            From Media Library
          </Button>
        )}

        {/* Import from YouTube */}
        <Button
          onClick={() => setShowYouTubeModal(true)}
          variant="outline"
          className={cn(buttonClass, "border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700")}
        >
          <PlayCircle className="h-4 w-4" />
          Import from YouTube
        </Button>

        {/* Import from Zoom */}
        <Button
          onClick={handleZoomClick}
          disabled={isLoadingZoom}
          className={cn(buttonClass, "text-white hover:opacity-90 transition-opacity")}
          style={{ backgroundColor: '#2C6BED' }}
        >
          {isLoadingZoom ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Video className="h-4 w-4" />
          )}
          Import from Zoom
        </Button>

        {/* Import from Riverside */}
        <Button
          onClick={handleRiversideClick}
          variant="outline"
          className={cn(buttonClass, "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200")}
        >
          <AudioWaveform className="h-4 w-4" />
          Import from Riverside
        </Button>
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
              Paste a YouTube video URL to import it to your media library
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isImportingYouTube) {
                    handleYouTubeImport();
                  }
                }}
              />
              {youtubeError && (
                <p className="text-sm text-destructive">{youtubeError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This may take a few minutes while we fetch your video.
              </p>
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

      {/* Zoom Recordings Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Select Zoom Recording
            </DialogTitle>
            <DialogDescription>
              Choose a recording to import from your Zoom account
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {zoomRecordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No recordings found in your Zoom account</p>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {zoomRecordings.map((recording) => (
                  <div
                    key={recording.id}
                    onClick={() => handleZoomRecordingSelect(recording)}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="w-20 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                      {recording.thumbnail_url ? (
                        <img src={recording.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recording.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(recording.start_time).toLocaleDateString()} • {formatDuration(recording.duration_seconds)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Zoom Connect Modal */}
      <Dialog open={showZoomConnectModal} onOpenChange={setShowZoomConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Connect to Zoom
            </DialogTitle>
            <DialogDescription>
              Connect your Zoom account to import podcast recordings directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Many podcasters use Zoom to record their shows. Connect your account to easily import recordings.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowZoomConnectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConnectZoom}
                disabled={connectingZoom}
                style={{ backgroundColor: '#2C6BED' }}
                className="text-white"
              >
                {connectingZoom ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Zoom'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Riverside Coming Soon Modal */}
      <Dialog open={showRiversideModal} onOpenChange={setShowRiversideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AudioWaveform className="h-5 w-5 text-purple-500" />
              Riverside Integration
            </DialogTitle>
            <DialogDescription>
              Import recordings from Riverside.fm
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <AudioWaveform className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-lg font-semibold mb-2">Coming Soon!</p>
              <p className="text-sm text-muted-foreground">
                We're working on Riverside integration. You'll soon be able to import your podcast recordings directly.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowRiversideModal(false)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
