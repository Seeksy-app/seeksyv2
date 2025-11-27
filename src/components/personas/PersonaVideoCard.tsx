import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface PersonaVideoCardProps {
  name: string;
  role: string;
  tagline: string;
  videoUrl: string;
  thumbnailUrl?: string;
  onClick: () => void;
}

// CSS to completely hide ALL video controls
const videoStyles = `
  video::-webkit-media-controls {
    display: none !important;
    opacity: 0 !important;
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
  video::-webkit-media-controls-timeline {
    display: none !important;
  }
  video::-webkit-media-controls-current-time-display {
    display: none !important;
  }
  video::-webkit-media-controls-time-remaining-display {
    display: none !important;
  }
  video::-webkit-media-controls-volume-slider {
    display: none !important;
  }
  video::-webkit-media-controls-mute-button {
    display: none !important;
  }
  video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  video::--webkit-media-controls-overlay-play-button {
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
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <>
      <style>{videoStyles}</style>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={onClick}
      >
        <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-black aspect-square">
          {/* Video Container */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
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
                controlsList="nodownload nofullscreen noremoteplayback"
                poster={thumbnailUrl}
                style={{ 
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
                onLoadedData={(e) => {
                  const video = e.currentTarget;
                  video.play().catch(() => {});
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
            )}

            {/* Gradient Overlay for Text - Fruitful style */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"
              animate={{ 
                opacity: isHovering ? 0.25 : 0.15
              }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />
            
            {/* "More about" pill that follows cursor - Fruitful style */}
            <motion.div 
              className="absolute z-20 pointer-events-none"
              animate={{ 
                opacity: isHovering ? 1 : 0,
                left: cursorPosition.x + 12,
                top: cursorPosition.y + 12,
              }}
              transition={{ 
                opacity: { duration: 0.12, ease: "easeOut" },
                left: { duration: 0.15, ease: "easeOut" },
                top: { duration: 0.15, ease: "easeOut" }
              }}
              style={{
                willChange: 'transform, opacity'
              }}
            >
              <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl whitespace-nowrap">
                More about {name}
              </div>
            </motion.div>
          </div>

          {/* Content - animated text overlay Fruitful style */}
          <motion.div 
            className="absolute inset-x-0 bottom-0 p-8 text-white z-10 pointer-events-none"
            animate={{ 
              y: isHovering ? -6 : 0 
            }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="space-y-2">
              <motion.p 
                className="text-xs uppercase tracking-widest text-white/90 font-semibold"
                animate={{ opacity: isHovering ? 1 : 0.85 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              >
                {role}
              </motion.p>
              <motion.h3 
                className="text-4xl font-bold tracking-tight"
                animate={{ opacity: isHovering ? 1 : 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {name}
              </motion.h3>
              <motion.p 
                className="text-base text-white/90 font-light"
                animate={{ opacity: isHovering ? 1 : 0.85 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              >
                {tagline}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};