import { useParams } from "react-router-dom";
import { StudioRightSidebar } from "@/components/studio/StudioRightSidebar";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Moon, Users, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { DeviceTestDialog } from "@/components/meeting/DeviceTestDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MeetingStudio = () => {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showDeviceTest, setShowDeviceTest] = useState(true);
  const [showAINotes, setShowAINotes] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState<{
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  } | null>(null);

  const handleDeviceTestComplete = (devices: {
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  }) => {
    setSelectedDevices(devices);
    setShowDeviceTest(false);
  };

  // Request camera and microphone permissions and display stream
  useEffect(() => {
    if (!selectedDevices || showDeviceTest) return;

    let mounted = true;
    
    const startMediaStream = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDevices.videoDeviceId 
            ? { deviceId: { exact: selectedDevices.videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: selectedDevices.audioInputDeviceId
            ? { 
                deviceId: { exact: selectedDevices.audioInputDeviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Apply initial mute states
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) videoTrack.enabled = isVideoOn;
        if (audioTrack) audioTrack.enabled = isMicOn;
        
        localStorage.setItem('mediaPermissionsGranted', 'true');
      } catch (error) {
        console.error("Media permission error:", error);
        if (mounted) {
          toast.error("Unable to access camera or microphone. Please check your browser permissions.");
        }
      }
    };

    startMediaStream();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDevices, showDeviceTest]);

  // Toggle video track
  useEffect(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
        console.log('Video track enabled:', isVideoOn);
      }
    }
  }, [isVideoOn]);

  // Toggle audio track
  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        console.log('Audio track enabled:', isMicOn, 'Track state:', audioTrack.enabled);
      }
    }
  }, [isMicOn]);


  return (
    <>
      <DeviceTestDialog 
        open={showDeviceTest} 
        onContinue={handleDeviceTestComplete}
      />
      
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="h-16 bg-zinc-900 border-b border-border/40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Users className="h-4 w-4" />
              <span className="text-sm">1 participant</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="ai-notes"
                checked={showAINotes}
                onCheckedChange={setShowAINotes}
              />
              <Label htmlFor="ai-notes" className="text-white text-sm cursor-pointer flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI Notes
              </Label>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Moon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content with Resizable Panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Video Area */}
          <ResizablePanel defaultSize={40} minSize={15}>
            <div className="flex flex-col h-full">
              {/* Video Grid */}
              <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-white text-center">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg opacity-75">Camera Off</p>
                    </div>
                  </div>
                )}
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

          {/* Right Sidebar - Now twice as large */}
          <ResizablePanel defaultSize={60} minSize={30} maxSize={85}>
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
    </>
  );
};

export default MeetingStudio;