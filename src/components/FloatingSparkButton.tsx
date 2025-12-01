import { useState, useEffect } from "react";
import sparkGarland from "@/assets/spark-garland.png";
import { removeBackground, loadImage } from "@/utils/removeBackground";

export const FloatingSparkButton = () => {
  const [transparentSpark, setTransparentSpark] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processImage = async () => {
      try {
        // Load the original image
        const response = await fetch(sparkGarland);
        const blob = await response.blob();
        const img = await loadImage(blob);
        
        // Remove background
        const transparentBlob = await removeBackground(img);
        const url = URL.createObjectURL(transparentBlob);
        setTransparentSpark(url);
        setIsProcessing(false);
      } catch (error) {
        console.error('Failed to remove background:', error);
        // Fallback to original image
        setTransparentSpark(sparkGarland);
        setIsProcessing(false);
      }
    };

    processImage();
  }, []);

  if (isProcessing || !transparentSpark) {
    return null; // Hide while processing
  }

  return (
    <div
      id="seeksy-chat-trigger"
      onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
      className="fixed bottom-6 right-6 cursor-pointer transition-transform duration-200 hover:scale-105"
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
        src={transparentSpark} 
        alt="Spark assistant" 
        className="block"
        style={{ 
          width: '64px',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
};
