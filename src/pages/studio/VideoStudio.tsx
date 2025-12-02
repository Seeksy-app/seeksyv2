import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Users, FileText, Bookmark, Sparkles, 
  Wifi, MessageSquare, Maximize, Minimize, Mic, MicOff,
  Video, VideoOff, CircleDot, Square, Play, Pause, Settings,
  User, LayoutGrid, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GreenRoom } from "@/components/studio/GreenRoom";

type ScenePreset = "side-by-side" | "speaker-auto" | "host-only";

const scenePresets: { id: ScenePreset; label: string; desc: string; icon: typeof LayoutGrid }[] = [
  { id: "side-by-side", label: "Side-by-Side", desc: "Equal split layout", icon: LayoutGrid },
  { id: "speaker-auto", label: "Speaker Auto-Focus", desc: "AI switches to active speaker", icon: Sparkles },
  { id: "host-only", label: "Host Only", desc: "Single camera view", icon: User },
];

export default function VideoStudio() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [inGreenRoom, setInGreenRoom] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [currentScene, setCurrentScene] = useState<ScenePreset>("host-only");
  const [markers, setMarkers] = useState<{id: string; time: number; label: string}[]>([]);
  const [autoClips, setAutoClips] = useState<any[]>([]);
  const [rightTab, setRightTab] = useState("scripts");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [guestJoined, setGuestJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && !isPaused && recordingTime > 0 && recordingTime % 45 === 0) {
      setAutoClips(prev => [...prev, {
        id: `clip-${Date.now()}`,
        timestamp: formatTime(recordingTime - 30),
        duration: "30s",
        type: ["energy", "reaction", "insight"][Math.floor(Math.random() * 3)],
        confidence: 0.85 + Math.random() * 0.15,
      }]);
    }
  }, [recordingTime, isRecording, isPaused]);

  // Start camera when leaving green room
  useEffect(() => {
    if (inGreenRoom) return;
    
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
      }
    }
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [inGreenRoom]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addMarker = (label: string) => {
    setMarkers(prev => [...prev, { id: `m-${Date.now()}`, time: recordingTime, label }]);
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    // Navigate to studio post-recording page
    navigate("/studio/complete", { 
      state: { 
        duration: recordingTime, 
        markers: markers.length,
        autoClips: autoClips.length,
        type: "video"
      } 
    });
  };

  if (inGreenRoom) {
    return <GreenRoom mode="video" onJoin={() => setInGreenRoom(false)} />;
  }

  return (
    <div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm cursor-pointer hover:text-white" onClick={() => navigate("/studio")}>Back to Studio Home</span>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Video className="w-3 h-3 mr-1" /> Video Podcast
        </Badge>
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
              {isPaused && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">PAUSED</Badge>}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Wifi className="w-4 h-4" />
            <span className="text-xs">Excellent</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />{guestJoined ? "2" : "1"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Scene Presets */}
        <aside className="w-56 border-r border-white/10 p-4 space-y-4 overflow-y-auto hidden lg:block">
          <h4 className="text-sm font-medium text-white">Scene Layout</h4>
          <div className="space-y-2">
            {scenePresets.map(scene => (
              <button
                key={scene.id}
                onClick={() => setCurrentScene(scene.id)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all",
                  currentScene === scene.id 
                    ? "bg-blue-500/20 border border-blue-500/50" 
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <scene.icon className="w-4 h-4 text-white/70" />
                  <p className="text-sm font-medium text-white">{scene.label}</p>
                </div>
                <p className="text-xs text-white/50">{scene.desc}</p>
              </button>
            ))}
          </div>

          {markers.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-sm font-medium text-white">Markers ({markers.length})</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2 pr-2">
                  {markers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                      <span className="text-white/70">{m.label}</span>
                      <span className="text-xs text-white/40">{formatTime(m.time)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>

        {/* Center - Video Canvas */}
        <main className="flex-1 flex flex-col p-4 lg:p-6">
          <div className={cn(
            "flex-1 relative rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border border-white/10"
          )}>
            <div className="absolute inset-0">
              {isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold text-white/60">Y</span>
                    </div>
                    <p className="text-white/50">Camera Off</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
            </div>

            {/* PiP for guest (only show if guest joined) */}
            {guestJoined && (
              <div className="absolute bottom-4 right-4 w-40 h-28 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center overflow-hidden">
                <span className="text-xs text-white/50">Guest</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 bg-black/40 text-white hover:bg-black/60"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>

            {currentScene === "speaker-auto" && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Auto-Switch Active
                </span>
              </div>
            )}

            {isRecording && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">[Live Transcript]</span> AI is transcribing in real-time...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls - Identical to Audio */}
          <div className="mt-4 flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={cn("w-11 h-11 rounded-xl", isMuted ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {isRecording && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addMarker("Marker")}
                className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            )}

            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={() => { setIsRecording(true); setRecordingTime(0); }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/30"
                >
                  <CircleDot className="w-7 h-7 text-white" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsPaused(!isPaused)}
                    className={cn("w-11 h-11 rounded-full", isPaused ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white")}
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={handleStop}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30"
                  >
                    <Square className="w-6 h-6 text-white fill-white" />
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn("w-11 h-11 rounded-xl", isVideoOff ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
            >
              <Sparkles className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </main>

        {/* Right - Scripts/Transcript/Clips */}
        <aside className="w-72 border-l border-white/10 flex flex-col hidden lg:flex">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger value="scripts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-1" />
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-1" />
              </TabsTrigger>
              <TabsTrigger value="clips" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <Sparkles className="w-4 h-4 mr-1" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scripts" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Scripts & Ad Reads</p>
                <p className="text-xs text-white/40 mb-4">Add from Templates</p>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Browse Templates
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Live Transcript</p>
                <p className="text-xs text-white/40">{isRecording ? "Transcribing..." : "Start recording"}</p>
              </div>
            </TabsContent>

            <TabsContent value="clips" className="flex-1 p-4 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Auto-Clips</h3>
                  <Badge className="bg-blue-500/20 text-blue-400 border-0">{autoClips.length}</Badge>
                </div>
                {autoClips.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">AI will capture moments during recording</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2 pr-2">
                      {autoClips.map(clip => (
                        <div key={clip.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white capitalize">{clip.type}</span>
                            <span className="text-xs text-white/40">{clip.timestamp}</span>
                          </div>
                          <p className="text-xs text-white/50">{clip.duration}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
