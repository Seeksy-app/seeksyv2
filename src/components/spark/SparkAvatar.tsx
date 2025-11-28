/**
 * SparkAvatar Component
 * Displays Seeksy Spark with dynamic theme, season, and animation support
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSparkAsset, preloadSparkAssets, type SparkPose, type SparkSize } from "@/lib/spark/sparkAssets";

interface SparkAvatarProps {
  pose?: SparkPose;
  size?: SparkSize | number; // number = custom pixel size
  className?: string;
  animated?: boolean;
  onClick?: () => void;
  alt?: string;
}

export const SparkAvatar = ({
  pose = "idle",
  size = "full",
  className,
  animated = false,
  onClick,
  alt = "Seeksy Spark"
}: SparkAvatarProps) => {
  const [assetPath, setAssetPath] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Preload assets on mount
    preloadSparkAssets();
    
    // Get initial asset
    updateAsset();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateAsset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"]
    });

    return () => observer.disconnect();
  }, [pose, size]);

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
    <img
      src={assetPath}
      alt={alt}
      className={cn(
        "object-contain select-none",
        animated && "transition-all duration-200",
        animated && isHovering && "scale-105",
        onClick && "cursor-pointer",
        className
      )}
      style={sizeStyles}
      onClick={onClick}
      onMouseEnter={() => animated && setIsHovering(true)}
      onMouseLeave={() => animated && setIsHovering(false)}
      draggable={false}
    />
  );
};
