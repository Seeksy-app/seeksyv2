/**
 * Seeksy Santa Widget
 * Bottom-right holiday avatar that opens surprise modal
 */

import { useState } from "react";
import { SparkAvatar } from "./SparkAvatar";
import { SeeksySantaSurprise } from "./SeeksySantaSurprise";
import { isHolidaySeason } from "@/lib/spark/sparkAssets";
import { cn } from "@/lib/utils";

export const SeeksySantaWidget = () => {
  const [showModal, setShowModal] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const isHoliday = isHolidaySeason();

  // Only show during holiday season
  if (!isHoliday) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-transparent border-none p-0 m-0 cursor-pointer outline-none shadow-none hover:scale-110 transition-transform duration-300"
        aria-label="Open Seeksy Santa Surprise"
      >
        <SparkAvatar 
          pose="waving" 
          size={80} 
          animated
          triggerAnimation={!hasAnimated}
          onAnimationComplete={() => setHasAnimated(true)}
        />
      </button>

      <SeeksySantaSurprise open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
