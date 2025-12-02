import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { VideoStudioHeader } from "@/components/studio/video/VideoStudioHeader";
import { VideoStudioScenes, SceneLayout } from "@/components/studio/video/VideoStudioScenes";
import { VideoStudioCanvas } from "@/components/studio/video/VideoStudioCanvas";
import { VideoStudioControls } from "@/components/studio/video/VideoStudioControls";
import { VideoStudioToolbar } from "@/components/studio/video/VideoStudioToolbar";
import { VideoPreJoinScreen } from "@/components/studio/video/VideoPreJoinScreen";
import { VideoStudioLoadingScreen } from "@/components/studio/video/VideoStudioLoadingScreen";
import { toast } from "sonner";

interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
}

type StudioPhase = "loading" | "prejoin" | "studio";
type ToolbarTab = "graphics" | "captions" | "qr" | "notes" | "chat" | "music" | "theme" | "help";

const defaultScenes: Scene[] = [
  { id: "welcome", name: "Welcome", layout: "host-only" },
  { id: "demo", name: "Demo", layout: "side-by-side" },
];

export default function VideoStudio() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Phase state
  const [phase, setPhase] = useState<StudioPhase>("loading");
  const [userName, setUserName] = useState("Side Stage One NYC");
  const [userTitle, setUserTitle] = useState("");
  
  // Studio state
  const [sessionTitle, setSessionTitle] = useState(`Live with Seeksy, ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit' })}`);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Scenes
  const [scenes, setScenes] = useState<Scene[]>(defaultScenes);
  const [activeSceneId, setActiveSceneId] = useState("welcome");
  const [currentLayout, setCurrentLayout] = useState<SceneLayout>("host-only");
  
  // Toolbar
  const [activeToolbarTab, setActiveToolbarTab] = useState<ToolbarTab | null>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("prejoin");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Start camera when entering studio
  useEffect(() => {
    if (phase !== "studio") return;
    
    async function startCamera() {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error starting camera:", err);
        toast.error("Could not access camera");
      }
    }
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [phase]);

  const handleEnterStudio = (name: string, title: string) => {
    setUserName(name);
    setUserTitle(title);
    setPhase("studio");
  };

  const handleGoLive = () => {
    toast.info("Go Live feature coming soon!");
  };

  const handleChannels = () => {
    toast.info("Channel management coming soon!");
  };

  const handleSchedule = () => {
    toast.info("Schedule feature coming soon!");
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `Scene ${scenes.length + 1}`,
      layout: "host-only",
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newScene.id);
  };

  const handleSceneMenu = (id: string) => {
    // TODO: Show scene context menu
  };

  const handleScreenShare = () => {
    toast.info("Screen share coming soon!");
  };

  const handleInviteGuest = () => {
    toast.info("Guest invite coming soon!");
  };

  const handleAddMedia = () => {
    toast.info("Add media coming soon!");
  };

  const handleSettings = () => {
    toast.info("Settings coming soon!");
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // Loading phase
  if (phase === "loading") {
    return <VideoStudioLoadingScreen />;
  }

  // Pre-join phase
  if (phase === "prejoin") {
    return (
      <VideoPreJoinScreen
        sessionTitle={sessionTitle}
        hostName={userName}
        onEnterStudio={handleEnterStudio}
        onBack={() => navigate("/studio")}
      />
    );
  }

  // Main studio phase
  return (
    <div className="h-screen bg-[#0d0f12] flex flex-col overflow-hidden">
      {/* Header */}
      <VideoStudioHeader
        sessionTitle={sessionTitle}
        onBack={() => navigate("/studio")}
        isRecording={isRecording}
        onRecordToggle={() => setIsRecording(!isRecording)}
        onGoLive={handleGoLive}
        onChannels={handleChannels}
        onSchedule={handleSchedule}
        onEditTitle={() => {
          const newTitle = prompt("Enter session title:", sessionTitle);
          if (newTitle) setSessionTitle(newTitle);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Scenes Panel */}
        <VideoStudioScenes
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          onAddScene={handleAddScene}
          onSceneMenu={handleSceneMenu}
        />

        {/* Center - Canvas + Controls */}
        <div className="flex-1 flex flex-col">
          <VideoStudioCanvas
            videoRef={videoRef}
            resolution="720p"
            isVideoOff={isVideoOff}
            layout={currentLayout}
            onFullscreen={handleFullscreen}
          />

          {/* Bottom Controls */}
          <VideoStudioControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMic={() => setIsMuted(!isMuted)}
            onToggleVideo={() => setIsVideoOff(!isVideoOff)}
            onScreenShare={handleScreenShare}
            onInviteGuest={handleInviteGuest}
            onAddMedia={handleAddMedia}
            onSettings={handleSettings}
          />
        </div>

        {/* Right - Toolbar */}
        <VideoStudioToolbar
          activeTab={activeToolbarTab}
          onTabChange={setActiveToolbarTab}
          notificationCount={3}
        />
      </div>
    </div>
  );
}
