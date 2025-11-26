import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Tag {
  icon: string;
  label: string;
}

interface PersonaCardProps {
  name: string;
  role: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: Tag[];
  description: string;
  onSelect?: () => void;
}

export const PersonaCard = ({
  name,
  role,
  videoUrl,
  tags,
  onSelect,
}: PersonaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    onSelect?.();
  };

  return (
    <motion.div
      className="relative w-full h-[500px] cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative w-full h-full">
          {/* Video background */}
          {videoUrl ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={videoUrl}
              muted
              loop
              playsInline
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Content - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.h3
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {name}
            </motion.h3>

            <p className="text-lg text-white/80 mb-4">{role}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <motion.div
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium flex items-center gap-1.5"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Hover hint */}
          {!isHovered && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/60 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-center">Hover to preview • Click to learn more</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
