import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountType, type AccountType } from '@/hooks/useAccountType';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { PersonalizedQuestionsStep } from './steps/PersonalizedQuestionsStep';
import { RecommendedToolsStep } from './steps/RecommendedToolsStep';
import { DashboardPreviewStep } from './steps/DashboardPreviewStep';
import { CompletionStep } from './steps/CompletionStep';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [recommendedTools, setRecommendedTools] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const { completeOnboarding, isCompletingOnboarding } = useAccountType();
  const navigate = useNavigate();

  const totalSteps = 5;

  const handleRoleSelect = (type: AccountType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleQuestionsComplete = (data: Record<string, any>) => {
    setOnboardingData(data);
    // Generate recommended tools based on account type
    const tools = getRecommendedTools(selectedType!, data);
    setRecommendedTools(tools);
    setStep(3);
  };

  const handleToolsConfirmed = () => {
    setStep(4);
  };

  const handlePreviewComplete = () => {
    setStep(5);
  };

  const handleFinish = async () => {
    if (!selectedType) return;

    try {
      await completeOnboarding({
        account_type: selectedType,
        onboarding_data: { ...onboardingData, recommendedTools },
      }, {
        onSuccess: () => {
          const redirects: Record<AccountType, string> = {
            creator: '/dashboard',
            podcaster: '/podcasts',
            advertiser: '/advertiser',
            agency: '/agency',
            event_planner: '/events',
            brand: '/seekies',
            studio_team: '/studio',
            admin: '/admin',
          };
          
          navigate(redirects[selectedType] || '/dashboard');
        },
        onError: (error) => {
          console.error('Onboarding error:', error);
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            toast.error('Failed to complete setup', {
              description: `Retrying... (Attempt ${retryCount + 1}/3)`,
              action: {
                label: 'Retry Now',
                onClick: handleFinish,
              },
            });
          } else {
            toast.error('Setup failed after multiple attempts', {
              description: 'Please refresh the page and try again, or contact support if the issue persists.',
            });
          }
        },
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again or contact support.',
        action: {
          label: 'Retry',
          onClick: handleFinish,
        },
      });
    }
  };

  const getRecommendedTools = (type: AccountType, data: Record<string, any>): string[] => {
    const toolMap: Record<AccountType, string[]> = {
      creator: ['Studio & Recording', 'Social Analytics', 'Media Library', 'My Page Builder', 'Clips & Editing'],
      podcaster: ['Studio & Recording', 'Podcasts', 'Media Library', 'Social Connect', 'Clips & Editing'],
      advertiser: ['Campaigns', 'Contacts & Audience', 'Social Analytics', 'Segments'],
      agency: ['Contacts & Audience', 'Campaigns', 'Team & Collaboration', 'Proposals'],
      event_planner: ['Events', 'Contacts & Audience', 'Forms', 'Automations', 'SMS'],
      brand: ['Social Connect', 'Social Analytics', 'Campaigns'],
      studio_team: ['Studio & Recording', 'Media Library', 'Team & Collaboration', 'Clips & Editing'],
      admin: ['Team & Collaboration', 'Contacts & Audience'],
    };
    return toolMap[type] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator with smooth animation */}
        <div className="flex justify-center mb-8 gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const num = idx + 1;
            return (
              <motion.div
                key={num}
                className="h-2 rounded-full bg-muted overflow-hidden"
                initial={false}
                animate={{
                  width: num === step ? 48 : 32,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: num <= step ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: num === step ? 0.1 : 0 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Steps with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RoleSelectionStep onSelect={handleRoleSelect} />
            </motion.div>
          )}
          {step === 2 && selectedType && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonalizedQuestionsStep
                accountType={selectedType}
                onComplete={handleQuestionsComplete}
                onBack={() => setStep(1)}
              />
            </motion.div>
          )}
          {step === 3 && selectedType && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendedToolsStep
                tools={recommendedTools}
                onContinue={handleToolsConfirmed}
                onBack={() => setStep(2)}
              />
            </motion.div>
          )}
          {step === 4 && selectedType && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardPreviewStep
                accountType={selectedType}
                tools={recommendedTools}
                onContinue={handlePreviewComplete}
                onBack={() => setStep(3)}
              />
            </motion.div>
          )}
          {step === 5 && selectedType && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CompletionStep
                accountType={selectedType}
                onFinish={handleFinish}
                isLoading={isCompletingOnboarding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
