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
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHoverChange?.(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <style>{videoStyles}</style>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="persona-video-card group cursor-pointer relative overflow-hidden rounded-2xl shadow-2xl bg-black aspect-[3/4]"
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
              preload="auto"
              poster={thumbnailUrl}
              controls={false}
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
                height: '100%'
              }}
              onCanPlay={(e) => {
                const video = e.currentTarget;
                video.controls = false;
                video.muted = true;
                video.removeAttribute('controls');
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                video.controls = false;
                video.muted = true;
                video.removeAttribute('controls');
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        )}

      </motion.div>
    </>
  );
};