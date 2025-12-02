import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Video, Mic, MicOff, FileText, Bookmark, 
  Sparkles, CircleDot, Square, Play, Pause, MessageSquare,
  Settings, Users, Camera, CameraOff, Monitor, Clock, Wifi, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SceneLayout = "side-by-side" | "speaker-auto-focus";

export default function VideoStudioPremiumNew() {
  const navigate = useNavigate();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [activeLayout, setActiveLayout] = useState<SceneLayout>("side-by-side");
  const [markers, setMarkers] = useState<{id: string; time: number; label: string}[]>([]);
  const [rightTab, setRightTab] = useState("scripts");
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedMic, setSelectedMic] = useState("default");
  const [autoClips, setAutoClips] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Simulate auto-clip detection
  useEffect(() => {
    if (isRecording && recordingTime > 0 && recordingTime % 30 === 0) {
      setAutoClips(prev => prev + 1);
    }
  }, [recordingTime, isRecording]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const addMarker = (label: string) => {
    setMarkers(prev => [...prev, { id: `m-${Date.now()}`, time: recordingTime, label }]);
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    navigate("/studio/session/new");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm cursor-pointer hover:text-white" onClick={() => navigate("/studio")}>Back to Studio Home</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Video className="w-3 h-3 mr-1" /> Video Studio
          </Badge>
          {isRecording && autoClips > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300 font-medium">{autoClips} clips ready</span>
            </motion.div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/70">Excellent</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Camera/Mic/Layout */}
        <aside className="w-64 border-r border-white/10 p-4 space-y-5 overflow-y-auto hidden lg:block bg-black/20">
          {/* Camera */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Camera
            </h4>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Camera</SelectItem>
                <SelectItem value="built-in">Built-in Webcam</SelectItem>
                <SelectItem value="external">External USB Camera</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => setIsCameraOff(!isCameraOff)}
              className={cn("w-full h-11 rounded-xl justify-start gap-3", 
                isCameraOff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white border border-white/10"
              )}
            >
              {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              {isCameraOff ? "Camera Off" : "Camera On"}
            </Button>
          </div>

          {/* Microphone */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Microphone
            </h4>
            <Select value={selectedMic} onValueChange={setSelectedMic}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Microphone</SelectItem>
                <SelectItem value="built-in">Built-in Microphone</SelectItem>
                <SelectItem value="external">External USB Mic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Blur Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-white/60" />
                <Label className="text-sm text-white/70">Background Blur</Label>
              </div>
              <Switch checked={backgroundBlur} onCheckedChange={setBackgroundBlur} />
            </div>
          </div>

          {/* Layout Selection - Only 2 Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Layout
            </h4>
            <div className="space-y-2">
              <Button
                variant={activeLayout === "side-by-side" ? "default" : "outline"}
                className={cn("w-full justify-start gap-3 h-auto py-3",
                  activeLayout === "side-by-side" 
                    ? "bg-blue-500 hover:bg-blue-600 border-blue-500" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
                onClick={() => setActiveLayout("side-by-side")}
              >
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Side-by-Side</div>
                  <div className={`text-xs ${activeLayout === "side-by-side" ? "opacity-80" : "text-white/60"}`}>
                    Host + Guest equal view
                  </div>
                </div>
              </Button>
              <Button
                variant={activeLayout === "speaker-auto-focus" ? "default" : "outline"}
                className={cn("w-full justify-start gap-3 h-auto py-3",
                  activeLayout === "speaker-auto-focus" 
                    ? "bg-blue-500 hover:bg-blue-600 border-blue-500" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
                onClick={() => setActiveLayout("speaker-auto-focus")}
              >
                <Sparkles className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Speaker Auto-Focus</div>
                  <div className={`text-xs ${activeLayout === "speaker-auto-focus" ? "opacity-80" : "text-white/60"}`}>
                    AI switches to active speaker
                  </div>
                </div>
              </Button>
            </div>
            <p className="text-xs text-white/40 px-1">
              AI post-production handles auto-focus, lower thirds, and vertical clips.
            </p>
          </div>
        </aside>

        {/* Center - Video Preview */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-4xl">
            {/* Video Canvas */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative mb-6">
              {/* Video frames */}
              <div className={cn(
                "absolute inset-0 p-4 gap-4",
                activeLayout === "side-by-side" && "grid grid-cols-2",
                activeLayout === "speaker-auto-focus" && "flex items-center justify-center"
              )}>
                {/* Host frame */}
                <div className={cn(
                  "rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 flex items-center justify-center relative",
                  activeLayout === "speaker-auto-focus" && "w-full max-w-3xl aspect-video"
                )}>
                  {isCameraOff ? (
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40">Camera is off</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                        <User className="w-10 h-10 text-blue-400/50" />
                      </div>
                      <p className="text-white/50 text-sm">Host Camera</p>
                    </div>
                  )}
                  {/* Name tag */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                    <span className="text-sm text-white font-medium">You (Host)</span>
                  </div>
                </div>

                {/* Guest frame - Only in side-by-side */}
                {activeLayout === "side-by-side" && (
                  <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/10 flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                        <User className="w-10 h-10 text-purple-400/50" />
                      </div>
                      <p className="text-white/50 text-sm">Guest Camera</p>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                      <span className="text-sm text-white font-medium">Guest</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-red-400 font-medium">REC</span>
                </div>
              )}

              {/* Layout indicator */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/50 text-white/70 border-white/20 text-xs">
                  {activeLayout === "side-by-side" ? "Side-by-Side" : "Auto-Focus"}
                </Badge>
              </div>

              {/* PiP Preview (when in auto-focus) */}
              {activeLayout === "speaker-auto-focus" && (
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-black/60 rounded-lg border border-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-6 h-6 text-white/30 mx-auto" />
                    <span className="text-[10px] text-white/40">Guest PiP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn("w-11 h-11 rounded-xl", isMuted ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={cn("w-11 h-11 rounded-xl", isCameraOff ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
              >
                {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
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
                    onClick={() => { setIsRecording(true); setRecordingTime(0); setAutoClips(0); }}
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
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 animate-pulse"
                    >
                      <Square className="w-6 h-6 text-white fill-white" />
                    </Button>
                  </>
                )}
              </div>

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
          </div>
        </main>

        {/* Right Drawer - Scripts/Markers/Transcript */}
        <aside className="w-72 border-l border-white/10 flex flex-col hidden lg:flex bg-black/20">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger value="scripts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" /> Scripts
              </TabsTrigger>
              <TabsTrigger value="markers" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <Bookmark className="w-4 h-4 mr-2" /> Markers
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Transcript
              </TabsTrigger>
            </TabsList>
            <TabsContent value="scripts" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Episode Scripts</p>
                <p className="text-xs text-white/40 mb-4">Add scripts from Templates</p>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Browse Templates
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="markers" className="flex-1 p-4 m-0">
              {markers.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {markers.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-white/70">{m.label}</span>
                        <span className="text-xs text-white/40">{formatTime(m.time)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bookmark className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/60 mb-2">No Markers</p>
                  <p className="text-xs text-white/40">{isRecording ? "Click marker button to add" : "Start recording to add markers"}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="transcript" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Live Transcript</p>
                <p className="text-xs text-white/40">{isRecording ? "Transcript will appear here" : "Available after recording"}</p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
