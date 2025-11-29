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
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 40,
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'none',
        }}
        className="hover:scale-110 transition-transform duration-300"
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
