import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";

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
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary/10 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300">
        {/* Video Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
          {/* Thumbnail (shown when not hovering) */}
          {thumbnailUrl && !isHovering && (
            <img
              src={thumbnailUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Video (shown on hover) */}
          <video
            ref={videoRef}
            src={videoUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovering && isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
          />

          {/* Play Icon Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${
              isHovering ? "opacity-0" : "opacity-100"
            }`}
          >
            <PlayCircle className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform" />
          </div>

          {/* Gradient Overlay for Text */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
              {role}
            </p>
            <h3 className="text-2xl font-bold">{name}</h3>
            <p className="text-sm text-white/80 line-clamp-2">{tagline}</p>
          </div>
        </div>

        {/* Hover Effect Border */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/50 transition-colors duration-300"
          initial={false}
        />
      </div>
    </motion.div>
  );
};