/**
 * OnboardingTour Component
 * Step-by-step guided tour with spotlight highlighting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingTip, PageKey, getPageTips } from '@/onboarding/tips';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTourProps {
  pageKey: PageKey;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ pageKey, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showMorePrompt, setShowMorePrompt] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const { completeOnboarding } = useOnboarding();
  const { toast } = useToast();

  const pageTips = getPageTips(pageKey);
  const tips = showAdvanced 
    ? [...(pageTips?.primaryTips || []), ...(pageTips?.advancedTips || [])]
    : pageTips?.primaryTips || [];

  const currentTip = tips[currentStep];
  const isLastPrimaryTip = !showAdvanced && currentStep === (pageTips?.primaryTips.length || 0) - 1;
  const isLastTip = currentStep === tips.length - 1;

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!currentTip) return;

    const element = document.querySelector(currentTip.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // If element not found, try to proceed or skip this tip
      setTargetRect(null);
    }
  }, [currentTip]);

  // Set up observer to watch for DOM changes
  useEffect(() => {
    updateTargetPosition();

    // Watch for DOM changes in case elements load dynamically
    observerRef.current = new MutationObserver(() => {
      updateTargetPosition();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Also update on scroll/resize
    const handleUpdate = () => updateTargetPosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [updateTargetPosition]);

  const handleNext = async () => {
    if (isLastPrimaryTip && !showAdvanced) {
      // Show "see more tips?" prompt
      setShowMorePrompt(true);
    } else if (isLastTip) {
      // Complete the tour
      await completeOnboarding(pageKey, tips.length);
      toast({
        title: "Tour Completed! 🎉",
        description: `You've completed the ${pageTips?.pageName} tour.`,
      });
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleShowMore = () => {
    setShowAdvanced(true);
    setShowMorePrompt(false);
    setCurrentStep(prev => prev + 1);
  };

  const handleDeclineMore = async () => {
    await completeOnboarding(pageKey, pageTips?.primaryTips.length || 4);
    toast({
      title: "Tour Completed! 🎉",
      description: `You've completed the ${pageTips?.pageName} tour.`,
    });
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding(pageKey, currentStep + 1);
    onSkip();
  };

  if (!currentTip) return null;

  const position = currentTip.position || 'bottom';

  const getTooltipPosition = () => {
    if (!targetRect) {
      // Center in viewport if no target
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    let style: React.CSSProperties = {};

    switch (position) {
      case 'right':
        style = {
          top: Math.max(padding, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - padding
          )),
          left: Math.min(targetRect.right + padding, window.innerWidth - tooltipWidth - padding),
        };
        break;
      case 'left':
        style = {
          top: Math.max(padding, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - padding
          )),
          left: Math.max(padding, targetRect.left - tooltipWidth - padding),
        };
        break;
      case 'bottom':
        style = {
          top: Math.min(targetRect.bottom + padding, window.innerHeight - tooltipHeight - padding),
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
        break;
      case 'top':
        style = {
          top: Math.max(padding, targetRect.top - tooltipHeight - padding),
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
        break;
    }

    return style;
  };

  return (
    <>
      {/* Dark backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
        }}
        onClick={handleSkip}
      />

      {/* Spotlight cutout around target */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 12,
            boxShadow: `
              0 0 0 9999px rgba(0, 0, 0, 0.75),
              0 0 0 4px hsl(var(--primary) / 0.5),
              0 0 30px hsl(var(--primary) / 0.3)
            `,
            background: 'transparent',
          }}
        />
      )}

      {/* Arrow pointer */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[10000] pointer-events-none"
          style={{
            ...getArrowPosition(targetRect, position),
          }}
        >
          <div 
            className={cn(
              "w-4 h-4 bg-card border-2 border-primary rotate-45",
              position === 'bottom' && "-translate-y-2",
              position === 'top' && "translate-y-2",
              position === 'left' && "translate-x-2",
              position === 'right' && "-translate-x-2"
            )}
          />
        </motion.div>
      )}

      {/* "See more tips?" prompt */}
      <AnimatePresence>
        {showMorePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[10001] inset-0 flex items-center justify-center"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
              <h3 className="text-lg font-semibold mb-2">See more tips?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                There are {pageTips?.advancedTips.length} more advanced tips for this page.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleDeclineMore}>
                  Not now
                </Button>
                <Button onClick={handleShowMore}>
                  Yes, show me
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip card */}
      {!showMorePrompt && (
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed z-[10001] w-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          style={getTooltipPosition()}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tips.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-base pr-4">{currentTip.title}</h4>
              <button
                onClick={handleSkip}
                className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                title="Skip tour"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {currentTip.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {tips.length}
                {showAdvanced && <span className="text-primary ml-1">(Advanced)</span>}
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs h-8"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </Button>
                
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8"
                >
                  {isLastTip ? 'Done' : isLastPrimaryTip ? 'Continue' : 'Next'}
                  {!isLastTip && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

// Helper to position the arrow pointer
function getArrowPosition(rect: DOMRect, position: string): React.CSSProperties {
  switch (position) {
    case 'bottom':
      return {
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 8,
      };
    case 'top':
      return {
        top: rect.top - 24,
        left: rect.left + rect.width / 2 - 8,
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2 - 8,
        left: rect.left - 24,
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2 - 8,
        left: rect.right + 8,
      };
    default:
      return {};
  }
}
