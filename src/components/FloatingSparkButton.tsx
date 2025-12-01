import { useState, useEffect } from "react";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";
import { useSparkAnimations } from "@/hooks/useSparkAnimations";
import { cn } from "@/lib/utils";

export const FloatingSparkButton = () => {
  const { data: settings } = useHolidaySettings();
  const [sparkImage, setSparkImage] = useState<string>("");
  const { animations, handleHoverEnter, handleHoverLeave } = useSparkAnimations();

  useEffect(() => {
    // Use holiday logo if holiday mode is enabled, otherwise use regular spark
    const imagePath = settings?.holidayMode 
      ? "/spark/holiday/seeksy-logo-santa.png"
      : "/spark/holiday/seeksy-logo-wreath.png";
    
    setSparkImage(imagePath);
  }, [settings?.holidayMode]);

  if (!sparkImage) return null;

  return (
    <>
      <div
        id="seeksy-chat-trigger"
        onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
        className={cn(
          "fixed bottom-6 right-6 cursor-pointer transition-transform duration-200",
          "hover:scale-105"
        )}
        style={{ zIndex: 99999 }}
        aria-label="Ask Spark"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.dispatchEvent(new Event('openSparkChat'));
          }
        }}
      >
        <img 
          src={sparkImage} 
          alt="Spark assistant" 
          className={cn(
            "block drop-shadow-lg",
            animations.welcomeBounce && "animate-spark-welcome-bounce",
            animations.hatWiggle && "animate-spark-hat-wiggle",
            animations.idleFloat && "animate-spark-idle-float"
          )}
          style={{ 
            width: '72px',
            height: 'auto',
            display: 'block',
            willChange: animations.welcomeBounce || animations.hatWiggle || animations.idleFloat ? 'transform' : 'auto'
          }}
        />
        
        {/* Blink + Sparkle effect */}
        {animations.blinkSparkle && (
          <div 
            className="absolute top-2 left-2 w-3 h-3 bg-yellow-300 rounded-full animate-spark-sparkle pointer-events-none"
            style={{
              boxShadow: '0 0 12px 4px rgba(253, 224, 71, 0.6)',
            }}
          />
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spark-welcome-bounce {
          0% { transform: translateY(0px); }
          30% { transform: translateY(-20px); }
          50% { transform: translateY(-18px); }
          65% { transform: translateY(-20px); }
          80% { transform: translateY(-2px); }
          90% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }

        @keyframes spark-hat-wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes spark-idle-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes spark-sparkle {
          0% { 
            opacity: 0;
            transform: scale(0) translate(0, 0);
          }
          20% { 
            opacity: 1;
            transform: scale(1.2) translate(-2px, -2px);
          }
          100% { 
            opacity: 0;
            transform: scale(0.5) translate(-6px, -6px);
          }
        }

        .animate-spark-welcome-bounce {
          animation: spark-welcome-bounce 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-spark-hat-wiggle {
          animation: spark-hat-wiggle 0.3s ease-in-out forwards;
        }

        .animate-spark-idle-float {
          animation: spark-idle-float 1.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
        }

        .animate-spark-sparkle {
          animation: spark-sparkle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  );
};
