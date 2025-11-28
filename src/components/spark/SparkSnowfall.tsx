/**
 * SparkSnowfall Component
 * Optional holiday snowfall effect for December
 */

import { useEffect, useState } from "react";
import { isHolidaySeason } from "@/lib/spark/sparkAssets";
import "@/styles/sparkSnowfall.css";

export const SparkSnowfall = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if snowfall should be enabled
    const isHoliday = isHolidaySeason();
    const userPref = localStorage.getItem("spark_snowfall_enabled");
    
    // Auto-enable during December unless explicitly disabled
    if (isHoliday && userPref !== "false") {
      setEnabled(true);
    }
  }, []);

  if (!enabled) return null;

  return (
    <div className="spark-snowfall" aria-hidden="true">
      <div className="spark-snowflake">❄</div>
      <div className="spark-snowflake">❅</div>
      <div className="spark-snowflake">❆</div>
      <div className="spark-snowflake">❄</div>
      <div className="spark-snowflake">❅</div>
      <div className="spark-snowflake">❆</div>
      <div className="spark-snowflake">❄</div>
      <div className="spark-snowflake">❅</div>
      <div className="spark-snowflake">❆</div>
    </div>
  );
};
