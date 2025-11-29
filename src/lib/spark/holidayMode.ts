/**
 * Holiday Mode Configuration
 * Global flag for enabling/disabling holiday features
 */

import { isHolidaySeason } from "./sparkAssets";

const HOLIDAY_MODE_KEY = "seeksy_holiday_mode";

/**
 * Check if holiday mode is enabled
 * Returns true during holiday season unless explicitly disabled
 */
export const isHolidayModeEnabled = (): boolean => {
  const savedPref = localStorage.getItem(HOLIDAY_MODE_KEY);
  
  // If user has set a preference, respect it
  if (savedPref !== null) {
    return savedPref === "true";
  }
  
  // Default: auto-enable during holiday season
  return isHolidaySeason();
};

/**
 * Enable holiday mode
 */
export const enableHolidayMode = () => {
  localStorage.setItem(HOLIDAY_MODE_KEY, "true");
  window.dispatchEvent(new Event("holiday-mode-changed"));
};

/**
 * Disable holiday mode
 */
export const disableHolidayMode = () => {
  localStorage.setItem(HOLIDAY_MODE_KEY, "false");
  window.dispatchEvent(new Event("holiday-mode-changed"));
};

/**
 * Toggle holiday mode
 */
export const toggleHolidayMode = () => {
  const current = isHolidayModeEnabled();
  if (current) {
    disableHolidayMode();
  } else {
    enableHolidayMode();
  }
  return !current;
};

/**
 * Subscribe to holiday mode changes
 */
export const subscribeToHolidayMode = (callback: () => void) => {
  window.addEventListener("holiday-mode-changed", callback);
  return () => window.removeEventListener("holiday-mode-changed", callback);
};
