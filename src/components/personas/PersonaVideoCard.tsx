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
      videoRef.current.play().catch(console.error);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current && !isIframe) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
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
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        {/* Video Container */}
        <div className="relative aspect-square overflow-hidden">
          {/* Video or Iframe */}
          {videoUrl ? (
            isIframe ? (
              <iframe
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src={videoUrl}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 'none' }}
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                preload="auto"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          )}

          {/* Gradient Overlay for Text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white z-10">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
              {role}
            </p>
            <h3 className="text-2xl font-bold">{name}</h3>
            <p className="text-sm text-white/80">{tagline}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};