import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, isLoading, accountType } = useAccountType();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're loading, already on onboarding, or on public/auth pages
    if (isLoading) return;
    
    const publicPaths = ['/auth', '/onboarding', '/signup-select', '/', '/pricing', '/comparison'];
    const isPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith('/c/'));
    const isBoardPath = location.pathname.startsWith('/board');
    
    if (isPublicPath || isBoardPath) return;

    // Redirect to onboarding if not completed
    if (!onboardingCompleted || !accountType) {
      navigate('/onboarding');
    }
  }, [onboardingCompleted, accountType, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
