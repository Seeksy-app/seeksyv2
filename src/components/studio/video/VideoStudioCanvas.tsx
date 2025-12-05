import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SceneLayout } from "./VideoStudioScenes";

interface VideoStudioCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  resolution: string;
  isVideoOff: boolean;
  layout: SceneLayout;
  brandLogo?: string;
  onFullscreen: () => void;
}

// Layout switcher removed - using visual layout panel in footer instead

export function VideoStudioCanvas({
  videoRef,
  resolution,
  isVideoOff,
  layout,
  brandLogo,
  onFullscreen,
}: VideoStudioCanvasProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#0d0f12] p-4">
      {/* Resolution Badge */}
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant="outline" 
          className="border-white/20 text-white/60 text-xs"
        >
          {resolution}
        </Badge>
      </div>

      {/* Main Canvas */}
      <div className={cn(
        "flex-1 relative rounded-lg overflow-hidden",
        "bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-blue-900/60"
      )}>
        {/* Video Element */}
        {!isVideoOff ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white/60">Y</span>
              </div>
              <p className="text-white/40 text-sm">Camera Off</p>
            </div>
          </div>
        )}

        {/* Brand Logo Overlay */}
        {brandLogo && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 bg-black/40 hover:bg-black/60 text-white/60"
            >
              <X className="w-3 h-3" />
            </Button>
            <img 
              src={brandLogo} 
              alt="Brand" 
              className="h-8 object-contain"
            />
          </div>
        )}

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onFullscreen}
          className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 text-white"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {/* User Avatar Overlay (when in studio) */}
        <div className="absolute bottom-4 right-20 flex items-center">
          <div className="w-12 h-12 rounded-full border-2 border-green-500 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        </div>
      </div>

    </div>
  );
}
