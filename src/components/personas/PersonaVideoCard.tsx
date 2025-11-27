import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface PersonaVideoCardProps {
  name: string;
  role: string;
  tagline: string;
  videoUrl: string;
  thumbnailUrl?: string;
  onClick: () => void;
  onHoverChange?: (isHovering: boolean) => void;
  tags?: Array<{ emoji: string; label: string }>;
}

// CSS to completely hide ALL video controls - most aggressive approach
const videoStyles = `
  .persona-video-card video {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  .persona-video-card video::-webkit-media-controls {
    display: none !important;
    -webkit-appearance: none !important;
  }
  .persona-video-card video::-webkit-media-controls-enclosure {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-panel {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-play-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-start-playback-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-timeline {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-current-time-display {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-time-remaining-display {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-volume-slider {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-mute-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-overlay-play-button {
    display: none !important;
  }
  .persona-video-card video::-internal-media-controls-overlay-cast-button {
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
  onHoverChange,
  tags = [],
}: PersonaVideoCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHoverChange?.(false);
  };

  return (
    <>
      <style>{videoStyles}</style>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="persona-video-card group cursor-pointer relative overflow-hidden rounded-2xl shadow-2xl bg-black aspect-square"
        style={{ padding: 0, margin: 0, width: '100%', height: '100%' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* Video Container - absolutely positioned to fill entire card */}
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
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 w-full h-full block"
              loop
              muted
              playsInline
              autoPlay
              preload="auto"
              poster={thumbnailUrl}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              style={{ 
                objectFit: 'cover',
                pointerEvents: 'none',
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none',
                outline: 'none',
                width: '100%',
                height: '110%',
                top: '-5%'
              }}
              onCanPlay={(e) => {
                const video = e.currentTarget;
                video.controls = false;
                video.muted = true;
                video.removeAttribute('controls');
                video.play().catch(() => {});
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                video.controls = false;
                video.muted = true;
                video.removeAttribute('controls');
                video.play().catch(() => {});
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
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

        {/* Content - animated text overlay Fruitful style */}
        <motion.div 
          className="absolute inset-x-0 bottom-0 p-8 text-white z-10 pointer-events-none"
          animate={{ 
            y: isHovering ? -6 : 0 
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="space-y-3">
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
            
            {/* Description Pills - Fruitful style */}
            {tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-2 pt-2"
                animate={{ opacity: isHovering ? 1 : 0.9 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              >
                {tags.map((tag, index) => (
                  <motion.div
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/95 text-sm font-medium"
                    whileHover={{ 
                      y: -2,
                      backgroundColor: "rgba(255, 255, 255, 0.25)"
                    }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};