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
  forceTheme?: "light" | "dark"
): string => {
  const theme = forceTheme || getCurrentTheme();
  
  // Icon sizes
  if (size !== "full") {
    return `/spark/icons/spark-icon-${size.replace("icon-", "")}.png`;
  }
  
  // Regular assets
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
  
  const assetsToPreload = [
    getSparkAsset("idle", "full", theme),
    getSparkAsset("waving", "full", theme),
    getSparkAsset("thinking", "full", theme),
    getSparkAsset("typing", "full", theme),
  ];
  
  assetsToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};
