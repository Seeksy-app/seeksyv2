import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';
import { useUserRoles } from '@/hooks/useUserRoles';
import { clearRecoveryFlag } from '@/utils/bootRecovery';
import { AppLoading } from '@/components/ui/AppLoading';

/**
 * OnboardingGuard - Blocking bootstrap gate for auth + preferences
 * 
 * CRITICAL: This component ensures:
 * 1. Auth state is fully resolved before rendering children
 * 2. Onboarding state is checked - users without completed onboarding go to /onboarding
 * 3. Users WITH completed onboarding never see onboarding again
 * 4. Only onboarding OR dashboard renders - never both
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, isLoading, accountType, error: accountError } = useAccountType();
  const { isAdmin, isBoardMember, isLoading: rolesLoading, error: rolesError } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Clear recovery flag on successful load
  useEffect(() => {
    if (!isLoading && !rolesLoading) {
      clearRecoveryFlag();
    }
  }, [isLoading, rolesLoading]);

  // Clear the just-completed flag after successful navigation
  useEffect(() => {
    if (sessionStorage.getItem('onboarding_just_completed') && location.pathname !== '/onboarding') {
      const timer = setTimeout(() => {
        sessionStorage.removeItem('onboarding_just_completed');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Bootstrap gate - wait for both auth and preferences to load
  useEffect(() => {
    if (!isLoading && !rolesLoading) {
      // Add small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsBootstrapping(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, rolesLoading]);

  useEffect(() => {
    // Don't redirect while bootstrapping
    if (isLoading || rolesLoading || isBootstrapping) return;
    
    // If user just completed onboarding, don't redirect back
    if (sessionStorage.getItem('onboarding_just_completed')) return;
    
    // Public paths that don't require onboarding check
    const publicPaths = [
      '/auth', '/onboarding', '/signup-select', '/', '/pricing', '/comparison',
      '/privacy', '/terms', '/cookies', '/security', '/about', '/apps-and-tools',
      '/advertiser', '/advertiser/signup', '/demo', '/investor', '/demo-videos', '/videos'
    ];
    const isPublicPath = publicPaths.some(path => 
      location.pathname === path || 
      location.pathname.startsWith('/c/') || 
      location.pathname.startsWith('/book/') || 
      location.pathname.startsWith('/proforma/') || 
      location.pathname.startsWith('/investor') || 
      location.pathname.startsWith('/tv') || 
      location.pathname.startsWith('/veterans') || 
      location.pathname.startsWith('/invest/') || 
      location.pathname.startsWith('/videos') ||
      location.pathname.startsWith('/meet/')
    );
    const isBoardPath = location.pathname.startsWith('/board');
    
    // Admin-only paths that should NEVER show onboarding
    const adminPaths = [
      '/cfo-dashboard', '/cfo-calculators', '/cfo/', '/marketing-gtm',
      '/admin', '/investor-portal', '/proforma', '/investor',
    ];
    const isAdminPath = adminPaths.some(path => location.pathname.startsWith(path));
    
    if (isPublicPath || isBoardPath) return;
    
    // Admin users never see onboarding
    if (isAdmin) return;
    
    // Board members bypass onboarding
    if (isBoardMember) return;
    
    // Skip onboarding for admin-specific paths
    if (isAdminPath) return;

    // CRITICAL: Check onboarding state and redirect appropriately
    // If onboardingCompleted is explicitly false (not undefined), redirect to onboarding
    if (onboardingCompleted === false) {
      // User has not completed onboarding - redirect to onboarding
      if (location.pathname !== '/onboarding') {
        console.log('[OnboardingGuard] User has not completed onboarding, redirecting');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [onboardingCompleted, accountType, isLoading, rolesLoading, isBootstrapping, isAdmin, isBoardMember, navigate, location.pathname]);

  // Board routes render immediately without any loading state or guards
  const isBoardRoute = location.pathname.startsWith('/board');
  if (isBoardRoute) {
    return <>{children}</>;
  }

  // Public routes that don't need the bootstrap gate
  const publicRoutes = ['/', '/auth', '/pricing', '/about', '/terms', '/privacy', '/cookies', '/security', '/apps-and-tools'];
  const isPublicRoute = publicRoutes.includes(location.pathname) || 
                        location.pathname.startsWith('/meet/') ||
                        location.pathname.startsWith('/videos');
  
  // For public routes, render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show branded loading state during bootstrap
  if (isBootstrapping || isLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoading message="Loading your experience..." variant="fullscreen" />
      </div>
    );
  }

  return <>{children}</>;
}
