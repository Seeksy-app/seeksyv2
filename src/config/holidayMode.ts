/**
 * Holiday Mode Configuration
 * Single toggle to enable/disable all holiday features
 */

export const HOLIDAY_MODE = false;

// Optional snowfall effect (independent of HOLIDAY_MODE)
export const HOLIDAY_SNOW = false;

// Holiday season dates (can be adjusted)
export const HOLIDAY_START_DATE = new Date('2024-11-25');
export const HOLIDAY_END_DATE = new Date('2025-01-02');

/**
 * Check if current date is within holiday season
 */
export const isHolidaySeason = (): boolean => {
  if (!HOLIDAY_MODE) return false;
  
  const now = new Date();
  return now >= HOLIDAY_START_DATE && now <= HOLIDAY_END_DATE;
};
