/**
 * SeeMoreTipsModal Component
 * Prompts user to continue with advanced tips after basic tour
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';

interface SeeMoreTipsModalProps {
  advancedCount: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function SeeMoreTipsModal({
  advancedCount,
  onAccept,
  onDecline,
}: SeeMoreTipsModalProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/70"
        onClick={onDecline}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-[10001] inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center pointer-events-auto">
          {/* Close button */}
          <button
            onClick={onDecline}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💡</span>
          </div>

          <h3 className="text-lg font-semibold mb-2">See more tips?</h3>
          <p className="text-muted-foreground text-sm mb-6">
            There are {advancedCount} more advanced tips for this page to help you get the most out of it.
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onDecline}>
              Not now
            </Button>
            <Button onClick={onAccept}>
              Yes, show me
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
