import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard-kpis',
    title: 'Dashboard KPIs',
    description: "Here's your real-time view of Seeksy's creator metrics, revenue, and performance.",
    route: '/board',
    position: 'center',
  },
  {
    id: 'gtm-strategy',
    title: 'GTM Strategy Tab',
    description: 'Explore our full go-to-market plan, channels, and acquisition strategy.',
    route: '/board/gtm',
    position: 'center',
  },
  {
    id: 'forecasts',
    title: '3-Year Forecasts',
    description: 'Review AI-generated financial projections based on our current model.',
    route: '/board/forecasts',
    position: 'center',
  },
  {
    id: 'ceo-vto',
    title: 'CEO VTO',
    description: "See leadership's quarterly priorities, targets, and action plan.",
    route: '/board/vto',
    position: 'center',
  },
  {
    id: 'board-ai',
    title: 'Board AI Analyst',
    description: 'Ask any financial, product, or strategic question — AI will analyze real data and answer instantly.',
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = tourSteps[currentStep + 1];
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
      setCurrentStep(currentStep + 1);
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            onClick={handleSkip}
          />

          {/* Tour Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 text-white relative">
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-xs font-medium">
                      Step {currentStep + 1} of {tourSteps.length}
                    </p>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex gap-1.5 mt-3">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index === currentStep
                          ? 'w-6 bg-white'
                          : index < currentStep
                          ? 'w-1.5 bg-white/60'
                          : 'w-1.5 bg-white/30'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-600 text-base leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Skip Tour
                </Button>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="gap-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      'Finish'
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