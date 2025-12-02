import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, MicOff, Square, CircleDot, Pause, Play, 
  Flag, FileText, MessageSquare, Wifi, Users,
  Volume2, Sparkles, Settings, ChevronDown,
  Wand2, Clock, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Marker types
const markerTypes = [
  { id: "highlight", label: "Highlight", icon: "⭐", color: "bg-amber-500" },
  { id: "quote", label: "Great Quote", icon: "🎙️", color: "bg-blue-500" },
  { id: "ad-break", label: "Ad Break", icon: "📈", color: "bg-green-500" },
  { id: "viral", label: "Viral Moment", icon: "🔥", color: "bg-orange-500" },
  { id: "funny", label: "Funny Moment", icon: "😂", color: "bg-pink-500" },
  { id: "topic", label: "Topic Change", icon: "📌", color: "bg-purple-500" },
];

// Mic presets
const micPresets = [
  { id: "sm7b", name: "Shure SM7B", description: "Broadcast standard" },
  { id: "podmicro", name: "Rode PodMic", description: "Podcaster favorite" },
  { id: "re20", name: "Electro-Voice RE20", description: "Radio broadcast" },
  { id: "at2020", name: "Audio-Technica AT2020", description: "Studio versatile" },
  { id: "custom", name: "Custom", description: "Your settings" },
];

// Sample ad scripts
const adScripts = [
  { id: "1", type: "pre-roll", brand: "Seeksy Pro", script: "Hey creators! Before we dive in, I want to tell you about Seeksy Pro...", duration: "30s" },
  { id: "2", type: "mid-roll", brand: "AudioGear Co", script: "Speaking of quality, let me tell you about AudioGear Co...", duration: "45s" },
  { id: "3", type: "post-roll", brand: "Creator Academy", script: "Thanks for listening! Check out Creator Academy...", duration: "20s" },
];

export default function AudioStudioPremiumNew() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micLevel, setMicLevel] = useState(75);
  const [selectedPreset, setSelectedPreset] = useState("sm7b");
  const [markers, setMarkers] = useState<Array<{ id: string; type: string; time: number }>>([]);
  const [showMarkerMenu, setShowMarkerMenu] = useState(false);
  const [rightTab, setRightTab] = useState("scripts");
  const [clipNotification, setClipNotification] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  // Simulate audio waveform
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        setAudioLevels(prev => {
          const newLevels = [...prev, Math.random() * 100];
          if (newLevels.length > 100) newLevels.shift();
          return newLevels;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused]);

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

  // Simulate clip detection
  useEffect(() => {
    if (isRecording && recordingTime > 0 && recordingTime % 45 === 0) {
      setClipNotification(true);
      setTimeout(() => setClipNotification(false), 4000);
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
            <Mic className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-white">Audio Studio</span>
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

          {/* Audio Levels */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-white/40" />
            <div className="flex items-end gap-0.5 h-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-75",
                    i < 4 ? "bg-green-500" : i < 8 ? "bg-yellow-500" : "bg-red-500",
                    isRecording ? "opacity-100" : "opacity-30"
                  )}
                  style={{ 
                    height: `${Math.min(100, (audioLevels[audioLevels.length - 1] || 0) * (1 - i * 0.08))}%`,
                    minHeight: "4px"
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Guest indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/70">Solo</span>
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
        {/* Left Controls */}
        <div className="w-72 border-r border-white/5 bg-black/10 p-6 flex flex-col gap-6">
          {/* Mic Preset */}
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">
              Microphone Preset
            </label>
            <div className="space-y-2">
              {micPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    selectedPreset === preset.id
                      ? "bg-teal-500/20 border border-teal-500/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  )}
                >
                  <Mic className={cn(
                    "w-4 h-4",
                    selectedPreset === preset.id ? "text-teal-400" : "text-white/50"
                  )} />
                  <div className="text-left">
                    <p className={cn(
                      "text-sm font-medium",
                      selectedPreset === preset.id ? "text-white" : "text-white/70"
                    )}>
                      {preset.name}
                    </p>
                    <p className="text-xs text-white/40">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mic Gain */}
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">
              Mic Gain
            </label>
            <div className="space-y-3">
              <Slider
                value={[micLevel]}
                onValueChange={(v) => setMicLevel(v[0])}
                max={100}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>0%</span>
                <span className="text-teal-400">{micLevel}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Audio Enhancements */}
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">
              Enhancements
            </label>
            <div className="space-y-2">
              {[
                { label: "Noise Reduction", active: true },
                { label: "Voice Enhancement", active: true },
                { label: "De-Sibilance", active: false },
                { label: "Auto Leveling", active: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg",
                    "bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  )}
                >
                  <span className="text-sm text-white/70">{item.label}</span>
                  <div className={cn(
                    "w-8 h-5 rounded-full p-0.5 transition-colors",
                    item.active ? "bg-teal-500" : "bg-white/20"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform",
                      item.active ? "translate-x-3" : "translate-x-0"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Waveform */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Waveform Visualizer */}
          <div className="w-full max-w-4xl h-64 relative">
            {/* Waveform container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center gap-0.5">
                {isRecording ? (
                  audioLevels.map((level, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${level}%` }}
                      transition={{ duration: 0.05 }}
                      className="w-1 rounded-full bg-gradient-to-t from-teal-500 to-cyan-400"
                      style={{ minHeight: "4px" }}
                    />
                  ))
                ) : (
                  [...Array(100)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full bg-white/20"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Center pulse when not recording */}
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-teal-500/10 animate-pulse flex items-center justify-center">
                  <Mic className="w-12 h-12 text-teal-400/50" />
                </div>
              </div>
            )}
          </div>

          {/* Recording status */}
          <p className="mt-8 text-white/40 text-sm">
            {isRecording 
              ? isPaused 
                ? "Recording paused" 
                : "Recording in progress..."
              : "Press record to begin"
            }
          </p>

          {/* Clip notification */}
          <AnimatePresence>
            {clipNotification && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-xl shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="text-white font-medium">Clip Candidate Detected — Saved for Post Production</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-white/5 bg-black/10 flex flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
              <TabsTrigger 
                value="scripts" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger 
                value="markers"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"
              >
                <Flag className="w-4 h-4 mr-2" />
                Markers
              </TabsTrigger>
              <TabsTrigger 
                value="transcript"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
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
                          script.type === "mid-roll" && "bg-amber-500/20 text-amber-400",
                          script.type === "post-roll" && "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {script.type}
                        </Badge>
                        <span className="text-xs text-white/40">{script.duration}</span>
                      </div>
                      <p className="text-sm font-medium text-white mb-1">{script.brand}</p>
                      <p className="text-xs text-white/50 line-clamp-2">{script.script}</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="mt-3 w-full text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        Generate Variations
                      </Button>
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
                    <p className="text-xs text-white/30 mt-1">Press M to add markers</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {markers.map((marker) => {
                      const markerType = markerTypes.find(t => t.id === marker.type);
                      return (
                        <div key={marker.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
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

            <TabsContent value="transcript" className="flex-1 m-0 p-4">
              <ScrollArea className="h-full">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <p className="text-sm text-white/70">Transcribing in real-time...</p>
                      <div className="mt-2 h-2 w-3/4 bg-white/10 rounded" />
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
        {/* Mute */}
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
          
          {/* Marker menu */}
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
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
                className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/30 animate-pulse"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Noise reduction */}
        <Button
          variant="ghost"
          size="icon"
          className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"
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
