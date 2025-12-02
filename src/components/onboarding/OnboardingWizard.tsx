import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountType, type AccountType } from '@/hooks/useAccountType';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Mic, Megaphone, Users, Calendar, Building, Code, Shield } from 'lucide-react';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { PersonalizedQuestionsStep } from './steps/PersonalizedQuestionsStep';
import { CompletionStep } from './steps/CompletionStep';

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const { completeOnboarding, isCompletingOnboarding } = useAccountType();
  const navigate = useNavigate();

  const handleRoleSelect = (type: AccountType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleQuestionsComplete = (data: Record<string, any>) => {
    setOnboardingData(data);
    setStep(3);
  };

  const handleFinish = () => {
    if (!selectedType) return;

    completeOnboarding({
      account_type: selectedType,
      onboarding_data: onboardingData,
    }, {
      onSuccess: () => {
        // Redirect based on account type
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
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8 gap-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-2 rounded-full transition-all duration-300 ${
                num === step
                  ? 'w-12 bg-primary'
                  : num < step
                  ? 'w-8 bg-primary/50'
                  : 'w-8 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        {step === 1 && <RoleSelectionStep onSelect={handleRoleSelect} />}
        {step === 2 && selectedType && (
          <PersonalizedQuestionsStep
            accountType={selectedType}
            onComplete={handleQuestionsComplete}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && selectedType && (
          <CompletionStep
            accountType={selectedType}
            onFinish={handleFinish}
            isLoading={isCompletingOnboarding}
          />
        )}
      </div>
    </div>
  );
}
