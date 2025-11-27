import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface PersonaVideoCardProps {
  name: string;
  role: string;
  tagline: string;
  videoUrl: string;
  thumbnailUrl?: string;
  onClick: () => void;
}

// CSS to completely hide video controls
const videoStyles = `
  video::-webkit-media-controls {
    display: none !important;
  }
  video::-webkit-media-controls-enclosure {
    display: none !important;
  }
  video::-webkit-media-controls-panel {
    display: none !important;
  }
  video::-webkit-media-controls-play-button {
    display: none !important;
  }
  video::-webkit-media-controls-start-playback-button {
    display: none !important;
  }
`;

export const PersonaVideoCard = ({
  name,
  role,
  tagline,
  videoUrl,
  thumbnailUrl,
  onClick,
}: PersonaVideoCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  // Autoplay video on mount
  useEffect(() => {
    if (videoRef.current && !isIframe) {
      videoRef.current.play().catch(console.error);
    }
  }, [isIframe]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <>
      <style>{videoStyles}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-black">
          {/* Video Container */}
          <div className="relative aspect-square overflow-hidden">
            {/* Video or Iframe - autoplay muted with no controls */}
            {videoUrl ? (
              isIframe ? (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}controls=0&autoplay=1&loop=1&muted=1`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    style={{ 
                      border: 'none',
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="absolute inset-0 w-full h-full"
                  loop
                  muted
                  playsInline
                  autoPlay
                  preload="auto"
                  disablePictureInPicture
                  style={{ 
                    objectFit: 'cover',
                    pointerEvents: 'none'
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
            )}

            {/* Gradient Overlay for Text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
            
            {/* "More about" hover overlay */}
            <div 
              className={`absolute top-6 left-6 transition-all duration-300 z-20 ${
                isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}
            >
              <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl">
                More about {name}
              </div>
            </div>
          </div>

          {/* Content - matching Paige card layout */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white z-10 pointer-events-none">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                {role}
              </p>
              <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
              <p className="text-base text-white/90 font-light">{tagline}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};