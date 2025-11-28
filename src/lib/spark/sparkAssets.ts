/**
 * Seeksy Spark Asset Utilities
 * Handles dynamic asset selection based on theme and season
 */

export type SparkPose = 
  | "idle"
  | "happy"
  | "thinking"
  | "waving"
  | "idea"
  | "typing";

export type SparkSize = "full" | "icon-32" | "icon-20" | "icon-16";

/**
 * Check if we're in holiday season (December 1-31)
 */
export const isHolidaySeason = (): boolean => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed (11 = December)
  return month === 11; // December
};

/**
 * Detect current theme from DOM or system preference
 */
export const getCurrentTheme = (): "light" | "dark" => {
  // Check if data-theme is set on html element
  const htmlElement = document.documentElement;
  const dataTheme = htmlElement.getAttribute("data-theme");
  
  if (dataTheme === "dark") return "dark";
  if (dataTheme === "light") return "light";
  
  // Check class-based theme (Tailwind dark mode)
  if (htmlElement.classList.contains("dark")) return "dark";
  
  // Fallback to system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  
  return "light";
};

/**
 * Get the appropriate Spark asset path based on pose, theme, and season
 */
export const getSparkAsset = (
  pose: SparkPose = "idle",
  size: SparkSize = "full",
  forceTheme?: "light" | "dark",
  forceHoliday?: boolean
): string => {
  const theme = forceTheme || getCurrentTheme();
  const isHoliday = forceHoliday !== undefined ? forceHoliday : isHolidaySeason();
  
  // Icon sizes (simplified face only)
  if (size !== "full") {
    if (isHoliday) {
      return `/spark/icons/spark-santa-icon.png`;
    }
    return `/spark/icons/spark-icon-${size.replace("icon-", "")}.png`;
  }
  
  // Full character assets
  if (isHoliday) {
    // Holiday variants (santa mode)
    if (theme === "dark") {
      // Check if dark holiday variant exists for this pose
      const darkHolidayPoses = ["idle", "waving"];
      if (darkHolidayPoses.includes(pose)) {
        return `/spark/holiday/spark-santa-${pose}-dark.png`;
      }
      // Fallback to light holiday version
      return `/spark/holiday/spark-santa-${pose}.png`;
    }
    // Light holiday
    return `/spark/holiday/spark-santa-${pose}.png`;
  }
  
  // Regular assets (non-holiday)
  if (theme === "dark") {
    return `/spark/dark/spark-${pose}-dark.png`;
  }
  
  return `/spark/base/spark-${pose}.png`;
};

/**
 * Preload critical Spark assets for smoother animations
 */
export const preloadSparkAssets = () => {
  const theme = getCurrentTheme();
  const isHoliday = isHolidaySeason();
  
  const assetsToPreload = [
    getSparkAsset("idle", "full", theme, isHoliday),
    getSparkAsset("waving", "full", theme, isHoliday),
    getSparkAsset("thinking", "full", theme, isHoliday),
    getSparkAsset("typing", "full", theme, isHoliday),
  ];
  
  assetsToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
