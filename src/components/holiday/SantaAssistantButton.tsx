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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
        aria-label="Open Santa Assistant"
      >
        <img 
          src="/spark/holiday/spark-santa-waving.png" 
          alt="Seeksy Santa"
          className="w-14 h-14 object-contain"
        />
      </button>

      <SantaAssistantPopup open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
