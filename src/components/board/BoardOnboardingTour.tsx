import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles, BarChart3, Target, TrendingUp, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  targetSelector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard-kpis',
    title: 'Your Key Metrics',
    description: "Here's your real-time view of Seeksy's creators, usage, and monthly revenue performance.",
    icon: BarChart3,
    route: '/board',
    position: 'center',
  },
  {
    id: 'gtm-strategy',
    title: 'GTM Strategy Overview',
    description: 'Review the full go-to-market plan, channels, and acquisition roadmap.',
    icon: Target,
    route: '/board/gtm',
    position: 'center',
  },
  {
    id: 'forecasts',
    title: 'Financial Forecasts',
    description: 'See AI-generated projections based on real creator, usage, and revenue models.',
    icon: TrendingUp,
    route: '/board/forecasts',
    position: 'center',
  },
  {
    id: 'ceo-vto',
    title: 'CEO Action Plan',
    description: "Track leadership's quarterly priorities, KPIs, and company-wide execution plan.",
    icon: Briefcase,
    route: '/board/vto',
    position: 'center',
  },
  {
    id: 'board-ai',
    title: 'Ask Anything',
    description: 'Use the AI Analyst to ask questions about financials, forecasts, market trends, and strategy.',
    icon: MessageSquare,
    position: 'center',
  },
];

const TOUR_STORAGE_KEY = 'seeksy_board_tour_completed';

export function BoardOnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed && location.pathname.startsWith('/board')) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const scrollToElement = useCallback((selector?: string) => {
    if (!selector) return;
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = tourSteps[currentStep + 1];
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
      setCurrentStep(currentStep + 1);
      // Auto-scroll to target element if defined
      setTimeout(() => scrollToElement(nextStep.targetSelector), 300);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = tourSteps[currentStep - 1];
      if (prevStep.route && location.pathname !== prevStep.route) {
        navigate(prevStep.route);
      }
      setCurrentStep(currentStep - 1);
      // Auto-scroll to target element if defined
      setTimeout(() => scrollToElement(prevStep.targetSelector), 300);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
  };

  const handleFinish = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    // Open AI chat on finish if on last step
    if (currentStep === tourSteps.length - 1) {
      window.dispatchEvent(new CustomEvent('openBoardAIChat'));
    }
  };

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[100]"
            onClick={handleSkip}
          />

          {/* Tour Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-7 py-6 text-white relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkip();
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-3">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                    >
                      <StepIcon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-blue-200 text-sm font-medium mb-0.5">
                        Step {currentStep + 1} of {tourSteps.length}
                      </p>
                      <h3 className="text-2xl font-bold tracking-tight">{step.title}</h3>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="flex gap-2 mt-4">
                    {tourSteps.map((_, index) => (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{
                          width: index === currentStep ? 32 : 8,
                          opacity: index <= currentStep ? 1 : 0.4,
                        }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'h-2 rounded-full',
                          index <= currentStep ? 'bg-white' : 'bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-7 py-6">
                <motion.p 
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-600 text-base leading-relaxed"
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Footer */}
              <div className="px-7 pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Skip Tour
                </Button>
                <div className="flex gap-2.5">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleBack}
                      className="gap-1.5 border-slate-300 hover:bg-slate-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="default"
                    onClick={handleNext}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 px-5"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Finish
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper to reset tour (for settings)
export function resetBoardTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
