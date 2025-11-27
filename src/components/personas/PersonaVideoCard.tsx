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

// CSS to completely hide ALL video controls
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
  const [isFlipped, setIsFlipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHoverChange?.(true);
    if (videoRef.current && !isFlipped) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHoverChange?.(false);
    if (videoRef.current && !isFlipped) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <>
      <style>{videoStyles}</style>
      <div className="perspective-1000 w-full aspect-[3/4]">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            rotateY: isFlipped ? 180 : 0
          }}
          transition={{ 
            opacity: { duration: 0.5 },
            y: { duration: 0.5 },
            rotateY: { duration: 0.6, ease: "easeInOut" }
          }}
          className="persona-video-card relative w-full h-full preserve-3d cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Side - Video */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl shadow-2xl bg-black overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
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
                    className="absolute w-full h-full block"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center center',
                      pointerEvents: 'none',
                      display: 'block',
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '100%'
                    }}
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={thumbnailUrl}
                    controls={false}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
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
          </div>

          {/* Back Side - Info */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-primary via-accent to-primary/80 p-8 flex flex-col justify-between"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="space-y-4"
            >
              <motion.p 
                className="text-xs uppercase tracking-widest text-white/90 font-semibold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {role}
              </motion.p>
              <motion.h3 
                className="text-5xl font-bold text-white tracking-tight"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {name}
              </motion.h3>
              <motion.p 
                className="text-lg text-white/90 font-light leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: isFlipped ? 1 : 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {tagline}
              </motion.p>
            </motion.div>

            {/* Tags on back */}
            {tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                {tags.map((tag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isFlipped ? 1 : 0, scale: isFlipped ? 1 : 0.8 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.2 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="w-full py-4 px-6 bg-white text-primary rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Start Journey with {name}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};
