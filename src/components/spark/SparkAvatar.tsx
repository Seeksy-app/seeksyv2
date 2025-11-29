/**
 * SparkAvatar Component
 * Displays Seeksy Spark with dynamic theme, season, and animation support
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSparkAsset, preloadSparkAssets, type SparkPose, type SparkSize } from "@/lib/spark/sparkAssets";

interface SparkAvatarProps {
  pose?: SparkPose;
  size?: SparkSize | number;
  className?: string;
  animated?: boolean;
  triggerAnimation?: boolean; // External trigger for single animation
  onAnimationComplete?: () => void; // Callback when animation finishes
  onClick?: () => void;
  alt?: string;
}

export const SparkAvatar = ({
  pose = "idle",
  size = "full",
  className,
  animated = false,
  triggerAnimation,
  onAnimationComplete,
  onClick,
  alt = "Seeksy Spark"
}: SparkAvatarProps) => {
  const [assetPath, setAssetPath] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    preloadSparkAssets();
    updateAsset();
    
    const observer = new MutationObserver(updateAsset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"]
    });

    return () => observer.disconnect();
  }, [pose, size]);

  // Single entrance animation on load
  useEffect(() => {
    if (hasLoaded && animated && !shouldAnimate) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
        onAnimationComplete?.();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [hasLoaded, animated, onAnimationComplete]);

  // External animation trigger
  useEffect(() => {
    if (triggerAnimation) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
        onAnimationComplete?.();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [triggerAnimation, onAnimationComplete]);

  const updateAsset = () => {
    const actualSize = typeof size === "number" ? "full" : size;
    setAssetPath(getSparkAsset(pose, actualSize));
  };

  const sizeStyles = typeof size === "number" 
    ? { width: `${size}px`, height: `${size}px` }
    : size === "full"
    ? { width: "auto", height: "auto", maxWidth: "100%" }
    : size === "icon-32"
    ? { width: "32px", height: "32px" }
    : size === "icon-20"
    ? { width: "20px", height: "20px" }
    : { width: "16px", height: "16px" };

  return (
    <div className="relative inline-block">
      <img
        src={assetPath}
        alt={alt}
        className={cn(
          "object-contain select-none pointer-events-none",
          "mix-blend-normal bg-transparent",
          shouldAnimate && "animate-bounce-once",
          animated && "transition-all duration-300 ease-in-out",
          animated && isHovering && "scale-110 brightness-110",
          onClick && "cursor-pointer pointer-events-auto",
          className
        )}
        style={{ ...sizeStyles, background: 'transparent' }}
        onClick={onClick}
        onLoad={() => setHasLoaded(true)}
        onMouseEnter={() => animated && setIsHovering(true)}
        onMouseLeave={() => animated && setIsHovering(false)}
        draggable={false}
      />
    </div>
  );
};