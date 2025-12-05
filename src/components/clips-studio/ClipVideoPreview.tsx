import { useState, useRef, useEffect } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX,
  Smartphone, Monitor, Square, RectangleHorizontal, Scissors, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipVideoPreviewProps {
  clip: ClipData | null;
  sourceMedia: SourceMedia;
}

const aspectRatios = [
  { id: "9:16", label: "9:16", icon: Smartphone, platforms: "TikTok, Reels, Shorts" },
  { id: "1:1", label: "1:1", icon: Square, platforms: "Instagram Feed" },
  { id: "16:9", label: "16:9", icon: Monitor, platforms: "YouTube, Website" },
  { id: "4:5", label: "4:5", icon: RectangleHorizontal, platforms: "Instagram Portrait" },
];

export function ClipVideoPreview({ clip, sourceMedia }: ClipVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [showTrimHandles, setShowTrimHandles] = useState(false);

  const clipDuration = clip ? (clip.end_seconds - clip.start_seconds) : 0;

  useEffect(() => {
    if (videoRef.current && clip) {
      videoRef.current.currentTime = clip.start_seconds;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [clip?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip) return;

    const handleTimeUpdate = () => {
      const relativeTime = video.currentTime - clip.start_seconds;
      setCurrentTime(Math.max(0, Math.min(relativeTime, clipDuration)));
      
      if (video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
        if (!isPlaying) {
          video.pause();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [clip, clipDuration, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !clip) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < clip.start_seconds || video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !clip) return;
    
    const seekTime = clip.start_seconds + (value[0] / 100) * clipDuration;
    video.currentTime = seekTime;
    setCurrentTime(value[0] / 100 * clipDuration);
  };

  const skipBack = () => {
    const video = videoRef.current;
    if (!video || !clip) return;
    video.currentTime = Math.max(clip.start_seconds, video.currentTime - 5);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video || !clip) return;
    video.currentTime = Math.min(clip.end_seconds, video.currentTime + 5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPreviewDimensions = () => {
    switch (selectedRatio) {
      case "9:16": return { width: "280px", height: "498px" };
      case "1:1": return { width: "360px", height: "360px" };
      case "16:9": return { width: "560px", height: "315px" };
      case "4:5": return { width: "320px", height: "400px" };
      default: return { width: "280px", height: "498px" };
    }
  };

  if (!clip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Select a clip to preview</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Choose from the clips on the left</p>
        </div>
      </div>
    );
  }

  const dimensions = getPreviewDimensions();

  return (
    <div className="flex-1 flex flex-col bg-muted/5 overflow-hidden">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          className="relative"
          layout
          transition={{ duration: 0.3 }}
        >
          {/* Phone frame for vertical videos */}
          {selectedRatio === "9:16" && (
            <div className="absolute -inset-3 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-[3rem] shadow-2xl" />
          )}
          
          {/* Video container */}
          <div 
            className={cn(
              "relative bg-black overflow-hidden shadow-2xl",
              selectedRatio === "9:16" ? "rounded-[2.5rem]" : "rounded-xl"
            )}
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <video
              ref={videoRef}
              src={sourceMedia.cloudflare_download_url || sourceMedia.file_url}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
            />
            
            {/* Caption overlay preview */}
            {clip.suggested_caption && (
              <div className="absolute bottom-12 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-xl">
                  <p className="text-white text-center text-base font-semibold leading-relaxed">
                    {clip.suggested_caption}
                  </p>
                </div>
              </div>
            )}

            {/* Scene markers */}
            {clip.scenes && clip.scenes.length > 0 && (
              <div className="absolute top-4 right-4 space-y-2">
                {clip.scenes.slice(0, 3).map((scene, i) => (
                  <Badge 
                    key={i}
                    className={cn(
                      "text-xs",
                      scene.type === 'hook' && "bg-yellow-500/80 text-black",
                      scene.type === 'key_point' && "bg-blue-500/80 text-white",
                      scene.type === 'cta' && "bg-green-500/80 text-white"
                    )}
                  >
                    {scene.type === 'hook' ? '⚡ Hook' : 
                     scene.type === 'key_point' ? '💡 Key Point' : 
                     scene.type === 'cta' ? '🎯 CTA' : scene.type}
                  </Badge>
                ))}
              </div>
            )}

            {/* Play button overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </button>
            )}

            {/* Preview badge */}
            <Badge className="absolute top-4 left-4 bg-black/60 text-white border-0 text-xs">
              PREVIEW
            </Badge>

            {/* Time indicator */}
            <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-xs text-white font-mono">
              {formatTime(currentTime)} / {formatTime(clipDuration)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="border-t bg-card/80 backdrop-blur-sm p-4 space-y-4">
        {/* Playback controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={skipBack} className="h-9 w-9">
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#053877] hover:bg-[#053877]/90 text-white"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="white" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={skipForward} className="h-9 w-9">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 px-2">
            <Slider 
              value={[clipDuration > 0 ? (currentTime / clipDuration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <span className="text-sm text-muted-foreground font-mono w-28 text-right">
            {formatTime(currentTime)} / {formatTime(clipDuration)}
          </span>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-9 w-9"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowTrimHandles(!showTrimHandles)}
              className={cn("h-9 w-9", showTrimHandles && "bg-muted")}
            >
              <Scissors className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex items-center justify-center gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setSelectedRatio(ratio.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
                selectedRatio === ratio.id
                  ? "bg-[#053877] text-white shadow-lg"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <ratio.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
