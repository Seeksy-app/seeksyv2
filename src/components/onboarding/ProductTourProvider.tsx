/**
 * ProductTourProvider Component
 * Provides product tour functionality throughout the app
 */

import { createContext, useContext, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useProductTour, ProductTourState, TourCompletion } from '@/hooks/useProductTour';
import { ProductTourOverlay } from './ProductTourOverlay';
import { SeeMoreTipsModal } from './SeeMoreTipsModal';
import { PageTourKey, getPageTour } from '@/onboarding/tourConfig';

interface ProductTourContextType {
  startBasicTour: (pageKey?: PageTourKey) => void;
  startAdvancedTour: (pageKey?: PageTourKey) => void;
  isActive: boolean;
  tourState: ProductTourState;
  isLoading: boolean;
  getCompletionStatus: (pageKey: PageTourKey) => TourCompletion;
  resetTour: (pageKey?: PageTourKey) => Promise<void>;
}

const ProductTourContext = createContext<ProductTourContextType | null>(null);

export function useProductTourContext() {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error('useProductTourContext must be used within ProductTourProvider');
  }
  return context;
}

interface ProductTourProviderProps {
  children: ReactNode;
}

export function ProductTourProvider({ children }: ProductTourProviderProps) {
  const {
    isActive,
    currentStep,
    currentTip,
    totalSteps,
    isShowingAdvanced,
    showMorePrompt,
    pageKey,
    
    startBasicTour,
    startAdvancedTour,
    goNext,
    goPrev,
    skip,
    complete,
    acceptAdvanced,
    declineAdvanced,
    resetTour,
    
    tourState,
    isLoading,
    getCompletionStatus,
  } = useProductTour();

  const pageTour = pageKey ? getPageTour(pageKey) : null;
  const isLastBasicStep = !isShowingAdvanced && currentStep === (pageTour?.basic.length || 0) - 1;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <ProductTourContext.Provider
      value={{
        startBasicTour,
        startAdvancedTour,
        isActive,
        tourState,
        isLoading,
        getCompletionStatus,
        resetTour,
      }}
    >
      {children}

      <AnimatePresence>
        {isActive && currentTip && !showMorePrompt && (
          <ProductTourOverlay
            tip={currentTip}
            stepIndex={currentStep}
            totalSteps={totalSteps}
            isAdvanced={isShowingAdvanced}
            onNext={goNext}
            onPrev={goPrev}
            onSkip={skip}
            onComplete={complete}
            isLastStep={isLastStep}
            isLastBasicStep={isLastBasicStep}
          />
        )}

        {showMorePrompt && pageTour && (
          <SeeMoreTipsModal
            advancedCount={pageTour.advanced.length}
            onAccept={acceptAdvanced}
            onDecline={declineAdvanced}
          />
        )}
      </AnimatePresence>
    </ProductTourContext.Provider>
  );
}
