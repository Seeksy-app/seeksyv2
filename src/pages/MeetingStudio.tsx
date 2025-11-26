import { useParams } from "react-router-dom";
import { StudioRightSidebar } from "@/components/studio/StudioRightSidebar";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Calendar, Moon, Users, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MeetingStudio = () => {
  const { id } = useParams();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showAINotes, setShowAINotes] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Request camera and microphone permissions on mount
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Store permission grant
        localStorage.setItem('mediaPermissionsGranted', 'true');
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
        
        toast.success("Camera and microphone access granted");
      } catch (error) {
        console.error("Media permission error:", error);
        toast.error("Could not access camera or microphone. Please check your browser settings.");
      }
    };

    // Check if permissions were already granted
    const permissionsGranted = localStorage.getItem('mediaPermissionsGranted');
    if (!permissionsGranted) {
      requestMediaPermissions();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="h-16 bg-zinc-900 border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4" />
            <span className="text-sm">1 participant</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Moon className="h-5 w-5" />
          </Button>

          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Schedule meeting functionality coming soon...</p>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Switch 
              id="ai-notes" 
              checked={showAINotes}
              onCheckedChange={setShowAINotes}
            />
            <Label htmlFor="ai-notes" className="text-white cursor-pointer flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI Notes
            </Label>
          </div>
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Video Area */}
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="flex flex-col h-full">
            {/* Video Grid */}
            <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg opacity-75">Meeting Studio</p>
                  <p className="text-sm opacity-50 mt-2">Meeting ID: {id}</p>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="h-20 bg-zinc-900 border-t border-border/40 flex items-center justify-center gap-4 px-6">
              <Button
                variant={isMicOn ? "default" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
          <StudioRightSidebar
            currentViewerCount={2}
            onAdSelect={() => {}}
            selectedAd={null}
            markers={[]}
            onAddMarker={() => {}}
            isRecording={true}
            selectedChannels={{
              myPage: false,
              facebook: false,
              linkedin: false,
              tiktok: false,
              twitch: false,
              youtube: false,
            }}
            onToggleChannel={() => {}}
            channelsExpanded={false}
            onToggleChannelsExpanded={() => {}}
            meetingId={id}
            showAINotes={showAINotes}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MeetingStudio;