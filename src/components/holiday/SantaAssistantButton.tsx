/**
 * Santa Assistant Button
 * Floating bottom-right button when Holiday Mode is enabled
 */

import { useState } from "react";
import { SantaAssistantPopup } from "./SantaAssistantPopup";

export const SantaAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-transparent hover:scale-105 transition-all duration-200 flex items-center justify-center group"
        aria-label="Open Santa Assistant"
      >
        <img 
          src="/spark/holiday/spark-santa-waving.png" 
          alt="Santa Spark"
          className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl"
        />
      </button>

      <SantaAssistantPopup open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
