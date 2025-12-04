/**
 * StartOnboardingButton Component
 * Temporary button to manually trigger onboarding tour
 */

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useOnboardingContext } from './OnboardingProvider';
import { getPageKeyFromRoute, getPageTips } from '@/onboarding/tips';
import { useLocation } from 'react-router-dom';

export function StartOnboardingButton() {
  const { startTour, isActive } = useOnboardingContext();
  const location = useLocation();
  
  const currentPageKey = getPageKeyFromRoute(location.pathname);
  const hasTips = currentPageKey && getPageTips(currentPageKey);

  // Don't show if no tips for this page or tour is active
  if (!hasTips || isActive) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTour()}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Start Onboarding</span>
    </Button>
  );
}
