import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppAudioPlayerProps {
  appId: string;
  audioUrl?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export const AppAudioPlayer = ({ appId, audioUrl, className, size = "sm" }: AppAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("loadstart", () => setIsLoading(true));
      audioRef.current.addEventListener("loadeddata", () => setIsLoading(false));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("ended", () => setIsPlaying(false));
        audioRef.current.removeEventListener("loadstart", () => setIsLoading(true));
        audioRef.current.removeEventListener("loadeddata", () => setIsLoading(false));
      }
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!audioUrl) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePlay}
      className={cn(buttonSize, "shrink-0", className)}
      title="Play audio description"
    >
      {isLoading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : isPlaying ? (
        <VolumeX className={iconSize} />
      ) : (
        <Volume2 className={iconSize} />
      )}
    </Button>
  );
};
