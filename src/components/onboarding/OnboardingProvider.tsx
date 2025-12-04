/**
 * OnboardingProvider Component
 * Wraps the app to provide onboarding functionality
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { OnboardingTour } from './OnboardingTour';
import { PageKey, getPageKeyFromRoute, getPageTips } from '@/onboarding/tips';
import { useOnboarding, PageOnboardingState } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  startTour: (pageKey?: PageKey) => void;
  isActive: boolean;
  currentPageKey: PageKey | null;
  pageProgress: PageOnboardingState | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const location = useLocation();
  const { 
    isOnboardingActive, 
    currentPageKey, 
    pageProgress,
    startOnboarding,
    shouldAutoTrigger,
    isLoading,
    resetOnboarding,
  } = useOnboarding();
  
  const [showTour, setShowTour] = useState(false);
  const [activePageKey, setActivePageKey] = useState<PageKey | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState<Set<string>>(new Set());

  // Auto-trigger onboarding on first visit to a page
  useEffect(() => {
    if (
      shouldAutoTrigger && 
      currentPageKey && 
      !hasAutoTriggered.has(currentPageKey) &&
      getPageTips(currentPageKey)
    ) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setActivePageKey(currentPageKey);
        setShowTour(true);
        setHasAutoTriggered(prev => new Set(prev).add(currentPageKey));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoTrigger, currentPageKey, hasAutoTriggered]);

  // Reset when navigating to different page
  useEffect(() => {
    if (showTour && activePageKey && currentPageKey !== activePageKey) {
      setShowTour(false);
      setActivePageKey(null);
    }
  }, [location.pathname, showTour, activePageKey, currentPageKey]);

  const startTour = useCallback(async (pageKey?: PageKey) => {
    const key = pageKey || currentPageKey;
    if (key && getPageTips(key)) {
      // Reset progress first so we replay from beginning
      await resetOnboarding(key);
      setActivePageKey(key);
      setShowTour(true);
    }
  }, [currentPageKey, resetOnboarding]);

  const handleComplete = useCallback(() => {
    setShowTour(false);
    setActivePageKey(null);
  }, []);

  const handleSkip = useCallback(() => {
    setShowTour(false);
    setActivePageKey(null);
  }, []);

  return (
    <OnboardingContext.Provider 
      value={{ 
        startTour, 
        isActive: showTour,
        currentPageKey,
        pageProgress,
      }}
    >
      {children}
      
      <AnimatePresence>
        {showTour && activePageKey && (
          <OnboardingTour
            pageKey={activePageKey}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        )}
      </AnimatePresence>
    </OnboardingContext.Provider>
  );
}
