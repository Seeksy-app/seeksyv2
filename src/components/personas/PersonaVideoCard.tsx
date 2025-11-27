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

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && !isIframe) {
      videoRef.current.play().catch(() => {});
    }
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
        className="group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay
                preload="auto"
                disablePictureInPicture
                poster={thumbnailUrl}
                style={{ 
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

            {/* Gradient Overlay for Text - emphasizes on hover */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none"
              animate={{ 
                opacity: isHovering ? 1 : 0.9 
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* "More about" hover overlay with animation */}
            <motion.div 
              className="absolute top-6 left-6 z-20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: isHovering ? 1 : 0,
                y: isHovering ? 0 : -10
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl whitespace-nowrap">
                More about {name}
              </div>
            </motion.div>
          </div>

          {/* Content - animated text overlay matching Paige card */}
          <motion.div 
            className="absolute inset-x-0 bottom-0 p-8 text-white z-10 pointer-events-none"
            animate={{ 
              y: isHovering ? -8 : 0 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="space-y-2">
              <motion.p 
                className="text-xs uppercase tracking-widest text-white/90 font-semibold"
                animate={{ opacity: isHovering ? 1 : 0.8 }}
              >
                {role}
              </motion.p>
              <motion.h3 
                className="text-4xl font-bold tracking-tight"
                animate={{ 
                  scale: isHovering ? 1.02 : 1 
                }}
                transition={{ duration: 0.3 }}
              >
                {name}
              </motion.h3>
              <motion.p 
                className="text-base text-white/90 font-light"
                animate={{ opacity: isHovering ? 1 : 0.85 }}
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