import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TooltipStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOOLTIP_STEPS: TooltipStep[] = [
  {
    id: "studio-hub",
    target: '[data-tooltip="studio-hub"]',
    title: "📌 Studio Hub",
    content: "This is where you create new studios, generate clips, and access your recordings.",
    position: "right",
  },
  {
    id: "media-library",
    target: '[data-tooltip="media-library"]',
    title: "🗂 Media Library",
    content: "All your recordings, uploads, and generated clips live here.",
    position: "right",
  },
  {
    id: "clips",
    target: '[data-tooltip="clips"]',
    title: "✂️ Clips & Highlights",
    content: "AI automatically finds your best moments. Edit and export for TikTok, Reels, and Shorts.",
    position: "right",
  },
  {
    id: "ai-production",
    target: '[data-tooltip="ai-production"]',
    title: "🧠 AI Post-Production",
    content: "Automatically remove filler words, enhance audio, and create clean podcast episodes.",
    position: "right",
  },
  {
    id: "identity",
    target: '[data-tooltip="identity"]',
    title: "🛡 Identity & Rights",
    content: "Verify your voice and face to protect your content and unlock monetization.",
    position: "right",
  },
  {
    id: "dashboard-widgets",
    target: '[data-tooltip="add-widgets"]',
    title: "🎨 Customize Dashboard",
    content: "Add, remove, and rearrange widgets to make this dashboard your own.",
    position: "bottom",
  },
];

const STORAGE_KEY = "seeksy-onboarding-tooltips-dismissed";

interface OnboardingTooltipSystemProps {
  enabled?: boolean;
}

export function OnboardingTooltipSystem({ enabled = true }: OnboardingTooltipSystemProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) return;
    
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") {
      setIsVisible(false);
      return;
    }

    // Show tooltips after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      updateTargetPosition();
    }, 1500);

    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (isVisible) {
      updateTargetPosition();
    }
  }, [currentStep, isVisible]);

  const updateTargetPosition = () => {
    const step = TOOLTIP_STEPS[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
    } else {
      // Try next step if element not found
      if (currentStep < TOOLTIP_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < TOOLTIP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleSkip = () => {
    handleDismiss();
  };

  if (!isVisible || !targetRect) return null;

  const step = TOOLTIP_STEPS[currentStep];
  const position = step?.position || "right";

  const getTooltipPosition = () => {
    const padding = 12;
    const tooltipWidth = 280;
    const tooltipHeight = 160;

    switch (position) {
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      default:
        return { top: 100, left: 100 };
    }
  };

  const tooltipPos = getTooltipPosition();

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9998]"
          onClick={handleSkip}
        />
      </AnimatePresence>

      {/* Highlight ring around target */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[9999] pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          borderRadius: 8,
          boxShadow: "0 0 0 4px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2)",
          background: "hsl(var(--background))",
        }}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="fixed z-[10000] w-[280px] bg-card border border-border rounded-xl shadow-xl p-4"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <h4 className="font-semibold text-base mb-2">{step?.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{step?.content}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {TOOLTIP_STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-xs"
            >
              Skip
            </Button>
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {currentStep < TOOLTIP_STEPS.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Done"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function resetOnboardingTooltips() {
  localStorage.removeItem(STORAGE_KEY);
}
