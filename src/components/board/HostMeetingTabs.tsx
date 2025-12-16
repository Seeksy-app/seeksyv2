import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MonitorPlay, 
  Film, 
  StickyNote,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Move
} from "lucide-react";
import { toast } from "sonner";

interface HostMeetingTabsProps {
  meetingId: string;
  isHost: boolean;
  onMediaPlayStateChange?: (isPlaying: boolean) => void;
}

interface WhiteboardBlock {
  id: string;
  type: 'text' | 'heading' | 'bullet';
  content: string;
  x: number;
  y: number;
}

export function HostMeetingTabs({ 
  meetingId, 
  isHost, 
  onMediaPlayStateChange,
}: HostMeetingTabsProps) {
  const [activeTab, setActiveTab] = useState("screen");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [whiteboardBlocks, setWhiteboardBlocks] = useState<WhiteboardBlock[]>([]);
  const [newBlockContent, setNewBlockContent] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Screen sharing
  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setIsScreenSharing(true);
      toast.success("Screen sharing started");
      
      // Handle when user stops sharing via browser controls
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        toast.info("Screen sharing stopped");
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to start screen sharing");
      }
    }
  };

  const handleStopScreenShare = () => {
    setIsScreenSharing(false);
    toast.info("Screen sharing stopped");
  };

  // Media playback
  const handleMediaPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsMediaPlaying(true);
      onMediaPlayStateChange?.(true);
    }
  };

  const handleMediaPause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsMediaPlaying(false);
      onMediaPlayStateChange?.(false);
    }
  };

  const handleMediaEnded = () => {
    setIsMediaPlaying(false);
    onMediaPlayStateChange?.(false);
  };

  // Whiteboard
  const addWhiteboardBlock = (type: WhiteboardBlock['type']) => {
    if (!newBlockContent.trim()) return;
    
    const newBlock: WhiteboardBlock = {
      id: crypto.randomUUID(),
      type,
      content: newBlockContent,
      x: 50 + Math.random() * 200,
      y: 50 + whiteboardBlocks.length * 60,
    };
    
    setWhiteboardBlocks([...whiteboardBlocks, newBlock]);
    setNewBlockContent("");
  };

  const removeBlock = (id: string) => {
    setWhiteboardBlocks(whiteboardBlocks.filter(b => b.id !== id));
  };

  if (!isHost) {
    // Non-host view - show what host is presenting
    return (
      <div className="space-y-4">
        {isScreenSharing && (
          <Card>
            <CardContent className="p-6 text-center">
              <MonitorPlay className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Host is sharing their screen</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="screen" className="flex items-center gap-1">
          <MonitorPlay className="w-4 h-4" />
          <span className="hidden sm:inline">Screen</span>
          {isScreenSharing && <Badge variant="default" className="ml-1 h-4 px-1 text-xs">Live</Badge>}
        </TabsTrigger>
        <TabsTrigger value="media" className="flex items-center gap-1">
          <Film className="w-4 h-4" />
          <span className="hidden sm:inline">Media</span>
          {isMediaPlaying && <Badge variant="default" className="ml-1 h-4 px-1 text-xs">▶</Badge>}
        </TabsTrigger>
        <TabsTrigger value="whiteboard" className="flex items-center gap-1">
          <StickyNote className="w-4 h-4" />
          <span className="hidden sm:inline">Notes</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="screen" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Screen Share</CardTitle>
          </CardHeader>
          <CardContent>
            {!isScreenSharing ? (
              <div className="text-center py-8">
                <MonitorPlay className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Share your screen with meeting participants
                </p>
                <Button onClick={handleStartScreenShare}>
                  <MonitorPlay className="w-4 h-4 mr-2" />
                  Start Screen Share
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Badge variant="default" className="mb-4 animate-pulse">
                  Screen Sharing Active
                </Badge>
                <p className="text-muted-foreground mb-4">
                  Participants can see your screen
                </p>
                <Button variant="destructive" onClick={handleStopScreenShare}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Sharing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="media" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Media Player</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMedia ? (
              <div className="text-center py-8">
                <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Select a video or audio file to play for participants
                </p>
                <Input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedMedia(URL.createObjectURL(file));
                    }
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  src={selectedMedia}
                  className="w-full rounded-lg bg-black"
                  onEnded={handleMediaEnded}
                  onPause={() => {
                    setIsMediaPlaying(false);
                    onMediaPlayStateChange?.(false);
                  }}
                  onPlay={() => {
                    setIsMediaPlaying(true);
                    onMediaPlayStateChange?.(true);
                  }}
                />
                <div className="flex items-center justify-center gap-2">
                  {!isMediaPlaying ? (
                    <Button onClick={handleMediaPlay}>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                  ) : (
                    <Button onClick={handleMediaPause}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleMediaPause();
                      setSelectedMedia(null);
                    }}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  AI capture is {isMediaPlaying ? "paused" : "active"} during media playback
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="whiteboard" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meeting Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add new block */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWhiteboardBlock('text')}
                />
                <Button
                  size="sm"
                  onClick={() => addWhiteboardBlock('text')}
                  disabled={!newBlockContent.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Block type buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addWhiteboardBlock('heading')}
                  disabled={!newBlockContent.trim()}
                >
                  Heading
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addWhiteboardBlock('bullet')}
                  disabled={!newBlockContent.trim()}
                >
                  Bullet
                </Button>
              </div>

              {/* Blocks display */}
              <div className="min-h-[200px] bg-muted/30 rounded-lg p-4 space-y-2">
                {whiteboardBlocks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notes yet. Add your first note above.
                  </p>
                ) : (
                  whiteboardBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-start gap-2 p-2 bg-background rounded border group"
                    >
                      <Move className="w-4 h-4 mt-1 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1">
                        {block.type === 'heading' ? (
                          <h4 className="font-semibold">{block.content}</h4>
                        ) : block.type === 'bullet' ? (
                          <p className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                            {block.content}
                          </p>
                        ) : (
                          <p>{block.content}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
