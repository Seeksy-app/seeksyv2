/**
 * SparkSnowfall Component
 * Optional holiday snowfall effect for December
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isHolidaySeason } from "@/lib/spark/sparkAssets";
import "@/styles/sparkSnowfall.css";

export const SparkSnowfall = () => {
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);

  // Disable snowfall on studio and AI editing pages
  const isStudioOrEditing = 
    location.pathname.startsWith('/studio') ||
    location.pathname.startsWith('/podcast-studio') ||
    location.pathname.includes('/meeting-studio/') ||
    location.pathname === '/post-production-studio' ||
    location.pathname.includes('/studio/session/') ||
    location.pathname.includes('/studio/broadcast/') ||
    location.pathname.match(/\/podcasts\/[^/]+\/studio/);

  useEffect(() => {
    // Check if snowfall should be enabled
    const isHoliday = isHolidaySeason();
    const userPref = localStorage.getItem("spark_snowfall_enabled");
    
    // Auto-enable during December unless explicitly disabled
    if (isHoliday && userPref !== "false") {
      setEnabled(true);
    }
  }, []);

  if (!enabled || isStudioOrEditing) return null;

  return (
    <div className="spark-snowfall" aria-hidden="true">
      <div className="spark-snowflake">❄</div>
      <div className="spark-snowflake">❅</div>
      <div className="spark-snowflake">❆</div>
      <div className="spark-snowflake">❄</div>
      <div className="spark-snowflake">❅</div>
      <div className="spark-snowflake">❆</div>
    </div>
  );
};
