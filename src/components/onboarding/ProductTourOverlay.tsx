/**
 * ProductTourOverlay Component
 * Anchored tooltip overlay for product tours
 * 
 * Features:
 * - Tooltips anchor to specific UI elements
 * - Spotlight highlight with dimmed backdrop
 * - Auto-scroll to elements out of view
 * - Back/Next/Skip navigation with step counter
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourStep } from '@/onboarding/tourConfig';
import { useToast } from '@/hooks/use-toast';

interface ProductTourOverlayProps {
  tip: TourStep;
  stepIndex: number;
  totalSteps: number;
  isAdvanced: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isLastStep: boolean;
  isLastBasicStep: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_WIDTH = 340;
const TOOLTIP_HEIGHT = 200;
const ARROW_SIZE = 12;
const PADDING = 16;
const SCROLL_PADDING = 100;

export function ProductTourOverlay({
  tip,
  stepIndex,
  totalSteps,
  isAdvanced,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  isLastStep,
  isLastBasicStep,
}: ProductTourOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const { toast } = useToast();

  // Find target element using selector (supports multiple selectors with comma)
  const findAndScrollToTarget = useCallback(async (selector: string) => {
    // Split by comma and try each selector
    const selectors = selector.split(',').map(s => s.trim());
    let element: HTMLElement | null = null;

    for (const sel of selectors) {
      element = document.querySelector(sel) as HTMLElement;
      if (element) break;
    }

    if (!element) {
      // Fallback: create a centered tooltip
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    setTargetElement(element);

    // Check if element is in viewport
    const rect = element.getBoundingClientRect();
    const isInViewport =
      rect.top >= SCROLL_PADDING &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight - SCROLL_PADDING &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      setIsScrolling(true);

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      await new Promise(resolve => setTimeout(resolve, 400));
      setIsScrolling(false);
    }

    const updatedRect = element.getBoundingClientRect();
    setTargetRect(updatedRect);
  }, []);

  // Calculate tooltip position
  const calculateTooltipPosition = useCallback((rect: DOMRect, preferredPosition?: string): TooltipPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    let position: 'top' | 'bottom' | 'left' | 'right' =
      (preferredPosition as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    // Override if not enough space
    if (position === 'bottom' && spaceBelow < TOOLTIP_HEIGHT + ARROW_SIZE + PADDING) {
      position = spaceAbove > spaceBelow ? 'top' : 'right';
    }
    if (position === 'top' && spaceAbove < TOOLTIP_HEIGHT + ARROW_SIZE + PADDING) {
      position = spaceBelow > spaceAbove ? 'bottom' : 'right';
    }
    if (position === 'right' && spaceRight < TOOLTIP_WIDTH + ARROW_SIZE + PADDING) {
      position = spaceLeft > spaceRight ? 'left' : 'bottom';
    }
    if (position === 'left' && spaceLeft < TOOLTIP_WIDTH + ARROW_SIZE + PADDING) {
      position = spaceRight > spaceLeft ? 'right' : 'bottom';
    }

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + ARROW_SIZE + 8;
        left = Math.max(PADDING, Math.min(
          rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
          viewportWidth - TOOLTIP_WIDTH - PADDING
        ));
        break;
      case 'top':
        top = rect.top - TOOLTIP_HEIGHT - ARROW_SIZE - 8;
        left = Math.max(PADDING, Math.min(
          rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
          viewportWidth - TOOLTIP_WIDTH - PADDING
        ));
        break;
      case 'right':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2,
          viewportHeight - TOOLTIP_HEIGHT - PADDING
        ));
        left = Math.min(rect.right + ARROW_SIZE + 8, viewportWidth - TOOLTIP_WIDTH - PADDING);
        break;
      case 'left':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2,
          viewportHeight - TOOLTIP_HEIGHT - PADDING
        ));
        left = Math.max(PADDING, rect.left - TOOLTIP_WIDTH - ARROW_SIZE - 8);
        break;
    }

    return { top, left, arrowPosition: position };
  }, []);

  // Find target on mount and step change
  useEffect(() => {
    if (tip.selector) {
      findAndScrollToTarget(tip.selector);
    }
  }, [tip.selector, findAndScrollToTarget]);

  // Update tooltip position when target rect changes
  useLayoutEffect(() => {
    if (targetRect && !isScrolling) {
      const pos = calculateTooltipPosition(targetRect, tip.placement);
      setTooltipPosition(pos);
    } else if (!targetRect && !isScrolling) {
      // Centered fallback
      setTooltipPosition({
        top: window.innerHeight / 2 - TOOLTIP_HEIGHT / 2,
        left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2,
        arrowPosition: 'bottom',
      });
    }
  }, [targetRect, isScrolling, calculateTooltipPosition, tip.placement]);

  // Set up resize observer and listeners
  useEffect(() => {
    const updatePosition = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    if (targetElement) {
      observerRef.current = new ResizeObserver(updatePosition);
      observerRef.current.observe(targetElement);
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      toast({
        title: "Tour Completed!",
        description: "You've learned the essentials. Explore more anytime!",
      });
    } else {
      onNext();
    }
  };

  // Arrow styles
  const getArrowStyles = (): React.CSSProperties => {
    if (!targetRect || !tooltipPosition) return { display: 'none' };

    const arrowOffset = ARROW_SIZE / 2;

    switch (tooltipPosition.arrowPosition) {
      case 'bottom':
        return {
          position: 'absolute',
          top: -ARROW_SIZE + 2,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left - arrowOffset,
            TOOLTIP_WIDTH - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'top':
        return {
          position: 'absolute',
          bottom: -ARROW_SIZE + 2,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left - arrowOffset,
            TOOLTIP_WIDTH - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'right':
        return {
          position: 'absolute',
          left: -ARROW_SIZE + 2,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top - arrowOffset,
            TOOLTIP_HEIGHT - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'left':
        return {
          position: 'absolute',
          right: -ARROW_SIZE + 2,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top - arrowOffset,
            TOOLTIP_HEIGHT - 40
          )),
          transform: 'rotate(45deg)',
        };
      default:
        return { display: 'none' };
    }
  };

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] pointer-events-auto"
        onClick={onSkip}
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      />

      {/* Spotlight highlight */}
      {targetRect && !isScrolling && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: 12,
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.7),
                0 0 0 3px hsl(var(--primary)),
                0 0 20px 4px hsl(var(--primary) / 0.4),
                inset 0 0 0 2px hsl(var(--primary) / 0.2)
              `,
              background: 'transparent',
            }}
          />

          {/* Pulsing glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="fixed z-[9998] pointer-events-none"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              borderRadius: 16,
              background: 'transparent',
              boxShadow: '0 0 30px 8px hsl(var(--primary) / 0.3)',
            }}
          />
        </>
      )}

      {/* Tooltip card */}
      {tooltipPosition && !isScrolling && (
        <motion.div
          key={tip.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10001] bg-card border border-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: TOOLTIP_WIDTH,
            minHeight: TOOLTIP_HEIGHT,
          }}
        >
          {/* Arrow */}
          {targetRect && (
            <div
              className="w-3 h-3 bg-card border-l border-t border-border"
              style={getArrowStyles()}
            />
          )}

          {/* Progress bar */}
          <div className="h-1.5 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-base pr-4 leading-tight">{tip.title}</h4>
              <button
                onClick={onSkip}
                className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0 -mt-1 -mr-1"
                title="Skip tour"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {tip.body}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium">
                Step {stepIndex + 1} of {totalSteps}
                {isAdvanced && <span className="text-primary ml-1.5">(Advanced)</span>}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-xs h-8 px-2"
                >
                  <SkipForward className="h-3.5 w-3.5 mr-1" />
                  Skip
                </Button>

                {stepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 px-3"
                >
                  {isLastStep ? 'Done' : isLastBasicStep ? 'Continue' : 'Next'}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isScrolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[10001] inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-muted-foreground">
            Scrolling to element...
          </div>
        </motion.div>
      )}
    </>
  );
}
