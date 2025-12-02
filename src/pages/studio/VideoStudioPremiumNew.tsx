import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, VideoOff, Mic, MicOff, Square, CircleDot, Pause, Play,
  Flag, FileText, MessageSquare, Wifi, Users, Settings,
  Sparkles, Clock, LayoutGrid, User, Monitor, Presentation,
  Image, Type, Palette, Camera, Wand2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Scene presets
const scenePresets = [
  { id: "side-by-side", label: "Side by Side", icon: LayoutGrid },
  { id: "host-only", label: "Host Only", icon: User },
  { id: "speaker-switch", label: "Speaker Switch", icon: Users },
  { id: "presentation", label: "Presentation", icon: Presentation },
];

// Marker types
const markerTypes = [
  { id: "highlight", label: "Highlight", icon: "⭐", color: "bg-amber-500" },
  { id: "quote", label: "Great Quote", icon: "🎙️", color: "bg-blue-500" },
  { id: "ad-break", label: "Ad Break", icon: "📈", color: "bg-green-500" },
  { id: "viral", label: "Viral Moment", icon: "🔥", color: "bg-orange-500" },
  { id: "funny", label: "Funny Moment", icon: "😂", color: "bg-pink-500" },
  { id: "topic", label: "Topic Change", icon: "📌", color: "bg-purple-500" },
];

// Sample ad scripts
const adScripts = [
  { id: "1", type: "pre-roll", brand: "Seeksy Pro", script: "Hey creators! Before we dive in...", duration: "30s" },
  { id: "2", type: "mid-roll", brand: "AudioGear Co", script: "Speaking of quality...", duration: "45s" },
];

// Camera presets
const cameraPresets = [
  { id: "1", label: "Wide Shot" },
  { id: "2", label: "Close Up" },
  { id: "3", label: "Two Shot" },
  { id: "4", label: "Custom" },
];

export default function VideoStudioPremiumNew() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedScene, setSelectedScene] = useState("side-by-side");
  const [markers, setMarkers] = useState<Array<{ id: string; type: string; time: number }>>([]);
  const [showMarkerMenu, setShowMarkerMenu] = useState(false);
  const [rightTab, setRightTab] = useState("scripts");
  const [leftTab, setLeftTab] = useState("scenes");
  const [autoClips, setAutoClips] = useState(0);
  const [aiEnhancement, setAiEnhancement] = useState(true);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
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

  const addMarker = (type: string) => {
    setMarkers(prev => [...prev, { id: Date.now().toString(), type, time: recordingTime }]);
    setShowMarkerMenu(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C] flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Video Studio</span>
          </div>
          
          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            isRecording ? "bg-red-500/20" : "bg-white/5"
          )}>
            {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            <Clock className="w-4 h-4 text-white/60" />
            <span className={cn(
              "font-mono text-lg",
              isRecording ? "text-red-400" : "text-white/60"
            )}>
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Auto clips counter */}
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
        </div>

        <div className="flex items-center gap-4">
          {/* Guest indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/70">2 Participants</span>
          </div>

          {/* Network status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/70">Excellent</span>
          </div>

          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-72 border-r border-white/5 bg-black/10 flex flex-col">
          <Tabs value={leftTab} onValueChange={setLeftTab} className="flex-1 flex flex-col">
            <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
              <TabsTrigger 
                value="scenes" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Scenes
              </TabsTrigger>
              <TabsTrigger 
                value="backgrounds"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Backgrounds
              </TabsTrigger>
              <TabsTrigger 
                value="overlays"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Overlays
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenes" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                    Scene Presets
                  </p>
                  {scenePresets.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                        selectedScene === scene.id
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedScene === scene.id ? "bg-blue-500/30" : "bg-white/10"
                      )}>
                        <scene.icon className={cn(
                          "w-5 h-5",
                          selectedScene === scene.id ? "text-blue-400" : "text-white/60"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedScene === scene.id ? "text-white" : "text-white/70"
                      )}>
                        {scene.label}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="backgrounds" className="flex-1 m-0 p-4">
              <div className="grid grid-cols-2 gap-2">
                {["Blur", "Gradient", "Office", "Studio", "Nature", "Custom"].map((bg) => (
                  <div
                    key={bg}
                    className="aspect-video rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 cursor-pointer flex items-center justify-center"
                  >
                    <span className="text-xs text-white/50">{bg}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="overlays" className="flex-1 m-0 p-4">
              <div className="space-y-3">
                {[
                  { icon: Type, label: "Lower Thirds" },
                  { icon: Image, label: "Logo Watermark" },
                  { icon: Palette, label: "Brand Colors" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">{item.label}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Video Canvas */}
        <div className="flex-1 flex flex-col p-6">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
            {/* Video frames */}
            <div className={cn(
              "absolute inset-0 p-4 gap-4",
              selectedScene === "side-by-side" && "grid grid-cols-2",
              selectedScene === "host-only" && "flex items-center justify-center",
              selectedScene === "speaker-switch" && "flex items-center justify-center",
              selectedScene === "presentation" && "grid grid-cols-[1fr_300px]"
            )}>
              {/* Host frame */}
              <div className={cn(
                "rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 flex items-center justify-center relative",
                selectedScene === "host-only" && "w-full max-w-3xl aspect-video"
              )}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                    <User className="w-10 h-10 text-blue-400/50" />
                  </div>
                  <p className="text-white/50 text-sm">Host Camera</p>
                </div>
                {/* Name tag */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                  <span className="text-sm text-white font-medium">You (Host)</span>
                </div>
              </div>

              {/* Guest frame */}
              {selectedScene !== "host-only" && (
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/10 flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                      <User className="w-10 h-10 text-purple-400/50" />
                    </div>
                    <p className="text-white/50 text-sm">Guest Camera</p>
                  </div>
                  {/* Name tag */}
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
          </div>

          {/* Camera presets */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {cameraPresets.map((preset) => (
              <Button
                key={preset.id}
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs"
              >
                <Camera className="w-3 h-3 mr-1.5" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-white/5 bg-black/10 flex flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
              <TabsTrigger 
                value="scripts" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Scripts
              </TabsTrigger>
              <TabsTrigger 
                value="markers"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Markers
              </TabsTrigger>
              <TabsTrigger 
                value="clips"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Auto-Clips
              </TabsTrigger>
              <TabsTrigger 
                value="transcript"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
              >
                Transcript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scripts" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {adScripts.map((script) => (
                    <div key={script.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={cn(
                          "text-[10px]",
                          script.type === "pre-roll" && "bg-blue-500/20 text-blue-400",
                          script.type === "mid-roll" && "bg-amber-500/20 text-amber-400"
                        )}>
                          {script.type}
                        </Badge>
                        <span className="text-xs text-white/40">{script.duration}</span>
                      </div>
                      <p className="text-sm font-medium text-white mb-1">{script.brand}</p>
                      <p className="text-xs text-white/50">{script.script}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="markers" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                {markers.length === 0 ? (
                  <div className="text-center py-12">
                    <Flag className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">No markers yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {markers.map((marker) => {
                      const markerType = markerTypes.find(t => t.id === marker.type);
                      return (
                        <div key={marker.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <span className="text-lg">{markerType?.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm text-white">{markerType?.label}</p>
                            <p className="text-xs text-white/40">{formatTime(marker.time)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="clips" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                {autoClips === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">AI is watching for viral moments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-white/50">✨ AI found {autoClips} viral moments</p>
                    {[...Array(autoClips)].map((_, i) => (
                      <div key={i} className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <p className="text-sm text-white font-medium">Clip {i + 1}</p>
                        <p className="text-xs text-white/40">High engagement potential</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <p className="text-sm text-white/70">Transcribing live...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">Start recording to see transcript</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-24 border-t border-white/5 bg-black/30 backdrop-blur-xl flex items-center justify-center gap-4 px-6">
        {/* Mic */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-14 h-14 rounded-2xl transition-all",
            isMuted 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        {/* Video */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={cn(
            "w-14 h-14 rounded-2xl transition-all",
            isVideoOff 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        {/* Marker button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMarkerMenu(!showMarkerMenu)}
            disabled={!isRecording}
            className="w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
          >
            <Flag className="w-6 h-6" />
          </Button>
          
          <AnimatePresence>
            {showMarkerMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-xl bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 shadow-xl"
              >
                <div className="grid grid-cols-2 gap-1">
                  {markerTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => addMarker(type.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 whitespace-nowrap"
                    >
                      <span>{type.icon}</span>
                      <span className="text-sm text-white/80">{type.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main record button */}
        <div className="mx-4">
          {!isRecording ? (
            <Button
              onClick={() => setIsRecording(true)}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
            >
              <CircleDot className="w-10 h-10 text-white" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsPaused(!isPaused)}
                className={cn(
                  "w-14 h-14 rounded-full",
                  isPaused 
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </Button>
              <Button
                onClick={() => setIsRecording(false)}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </Button>
            </div>
          )}
        </div>

        {/* AI Enhancement */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAiEnhancement(!aiEnhancement)}
          className={cn(
            "w-14 h-14 rounded-2xl transition-all",
            aiEnhancement 
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <Wand2 className="w-6 h-6" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
