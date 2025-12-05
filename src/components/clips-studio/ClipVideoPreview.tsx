import { useState, useRef, useEffect, useMemo } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX,
  Smartphone, Monitor, Square, RectangleHorizontal, Scissors, AlertCircle, Youtube
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

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function ClipVideoPreview({ clip, sourceMedia }: ClipVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [showTrimHandles, setShowTrimHandles] = useState(false);

  const clipDuration = clip ? (clip.end_seconds - clip.start_seconds) : 0;

  // Check if source is YouTube
  const isYouTubeSource = sourceMedia.source === 'youtube' || 
    (sourceMedia.file_url && sourceMedia.file_url.includes('youtube.com'));
  const youtubeVideoId = useMemo(() => 
    isYouTubeSource ? getYouTubeVideoId(sourceMedia.file_url) : null,
    [sourceMedia.file_url, isYouTubeSource]
  );
  
  // Check if we have a playable video URL (Cloudflare or direct file)
  const hasPlayableVideo = !!sourceMedia.cloudflare_download_url || 
    (sourceMedia.file_url && !isYouTubeSource);

  useEffect(() => {
    if (videoRef.current && clip && hasPlayableVideo) {
      videoRef.current.currentTime = clip.start_seconds;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [clip?.id, hasPlayableVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip || !hasPlayableVideo) return;

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
  }, [clip, clipDuration, isPlaying, hasPlayableVideo]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !clip) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < clip.start_seconds || video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
      }
      video.play();
      setIsPlaying(true);
    }
  };

  // Sync isPlaying state with video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

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

  // Larger dimensions without phone frame
  const getPreviewDimensions = () => {
    switch (selectedRatio) {
      case "9:16": return { width: 320, height: 568 };
      case "1:1": return { width: 400, height: 400 };
      case "16:9": return { width: 560, height: 315 };
      case "4:5": return { width: 360, height: 450 };
      default: return { width: 320, height: 568 };
    }
  };

  if (!clip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Scissors className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Select a clip to preview</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Choose from the clips on the left</p>
        </div>
      </div>
    );
  }

  const dimensions = getPreviewDimensions();

  return (
    <div className="flex-1 flex items-start justify-center bg-muted/5 overflow-y-auto py-6">
      {/* Sticky preview container */}
      <div className="sticky top-6 flex flex-col items-center gap-4">
        {/* Video Container - No phone frame */}
        <motion.div 
          className="relative"
          layout
          transition={{ duration: 0.3 }}
        >
          {/* Video container */}
          <div 
            className="relative bg-black overflow-hidden rounded-xl shadow-2xl"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            {/* YouTube embed for YouTube sources */}
            {isYouTubeSource && youtubeVideoId ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?start=${clip.start_seconds}&end=${clip.end_seconds}&autoplay=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Overlay info for YouTube */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span>YouTube • {formatTime(clip.start_seconds)} - {formatTime(clip.end_seconds)}</span>
                  </div>
                  {clip.suggested_caption && (
                    <p className="text-white text-xs font-medium line-clamp-2">{clip.suggested_caption}</p>
                  )}
                </div>
              </div>
            ) : hasPlayableVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={sourceMedia.cloudflare_download_url || sourceMedia.file_url}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  playsInline
                  onClick={togglePlay}
                />
                
                {/* Caption overlay preview */}
                {clip.suggested_caption && (
                  <div className="absolute bottom-12 left-3 right-3">
                    <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-white text-center text-sm font-semibold leading-relaxed line-clamp-3">
                        {clip.suggested_caption}
                      </p>
                    </div>
                  </div>
                )}

                {/* Play button overlay */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-0.5" fill="white" />
                    </div>
                  </button>
                )}
              </>
            ) : (
              // No playable source - show message
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-12 w-12 text-yellow-500 mb-3" />
                <p className="text-white font-medium mb-1">Video not playable</p>
                <p className="text-white/60 text-sm">
                  Download required for rendering.
                </p>
              </div>
            )}

            {/* Scene markers - only for playable videos */}
            {hasPlayableVideo && clip.scenes && clip.scenes.length > 0 && (
              <div className="absolute top-3 right-3 space-y-1">
                {clip.scenes.slice(0, 2).map((scene, i) => (
                  <Badge 
                    key={i}
                    className={cn(
                      "text-xs px-2 py-0.5",
                      scene.type === 'hook' && "bg-yellow-500/80 text-black",
                      scene.type === 'key_point' && "bg-blue-500/80 text-white",
                      scene.type === 'cta' && "bg-green-500/80 text-white"
                    )}
                  >
                    {scene.type === 'hook' ? '⚡' : 
                     scene.type === 'key_point' ? '💡' : 
                     scene.type === 'cta' ? '🎯' : scene.type}
                  </Badge>
                ))}
              </div>
            )}

            {/* Preview badge */}
            <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0 text-xs px-2 py-0.5">
              PREVIEW
            </Badge>

            {/* Time indicator - only for non-YouTube sources */}
            {!isYouTubeSource && hasPlayableVideo && (
              <div className="absolute top-10 left-3 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                {formatTime(currentTime)} / {formatTime(clipDuration)}
              </div>
            )}
          </div>
        </motion.div>

        {/* Controls - directly under video */}
        <div className="w-full max-w-[400px] bg-card/90 backdrop-blur-sm rounded-xl border p-4 space-y-4">
          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={skipBack} className="h-9 w-9">
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#F5C242] hover:bg-[#F5C242]/90 text-black"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={skipForward} className="h-9 w-9">
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1 px-2">
              <Slider 
                value={[clipDuration > 0 ? (currentTime / clipDuration) * 100 : 0]}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(clipDuration)}
            </span>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowTrimHandles(!showTrimHandles)}
                className={cn("h-8 w-8", showTrimHandles && "bg-muted")}
              >
                <Scissors className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm",
                  selectedRatio === ratio.id
                    ? "bg-[#053877] text-white shadow-lg"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                <ratio.icon className="h-4 w-4" />
                <span className="font-medium">{ratio.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
