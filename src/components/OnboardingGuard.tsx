import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';
import { useUserRoles } from '@/hooks/useUserRoles';
import { clearRecoveryFlag } from '@/utils/bootRecovery';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, isLoading, accountType, error: accountError } = useAccountType();
  const { isAdmin, isBoardMember, isLoading: rolesLoading, error: rolesError } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear recovery flag on successful load
  useEffect(() => {
    if (!isLoading && !rolesLoading) {
      clearRecoveryFlag();
    }
  }, [isLoading, rolesLoading]);

  // Clear the just-completed flag after successful navigation
  useEffect(() => {
    if (sessionStorage.getItem('onboarding_just_completed') && location.pathname !== '/onboarding') {
      // Clear after a short delay to ensure we're past the guard check
      const timer = setTimeout(() => {
        sessionStorage.removeItem('onboarding_just_completed');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Don't redirect if we're loading, already on onboarding, or on public/auth pages
    if (isLoading || rolesLoading) return;
    
    // If user just completed onboarding, don't redirect back
    if (sessionStorage.getItem('onboarding_just_completed')) return;
    
    // Public paths that don't require onboarding
    const publicPaths = [
      '/auth', '/onboarding', '/onboarding-test', '/signup-select', '/', '/pricing', '/comparison',
      '/privacy', '/terms', '/cookies', '/security', '/about', '/apps-and-tools',
      '/advertiser', '/advertiser/signup', '/demo', '/investor', '/demo-videos'
    ];
    const isPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith('/c/') || location.pathname.startsWith('/book/') || location.pathname.startsWith('/proforma/') || location.pathname.startsWith('/investor') || location.pathname.startsWith('/tv'));
    const isBoardPath = location.pathname.startsWith('/board');
    
    // Admin-only paths that should NEVER show onboarding (CFO, GTM, Financial Models, Admin)
    const adminPaths = [
      '/cfo-dashboard',
      '/cfo-calculators',
      '/cfo/',
      '/marketing-gtm',
      '/admin',
      '/investor-portal',
      '/proforma',
      '/investor',
    ];
    const isAdminPath = adminPaths.some(path => location.pathname.startsWith(path));
    
    if (isPublicPath || isBoardPath) return;
    
    // Admin users never see onboarding - they go straight to admin/CFO views
    if (isAdmin) return;
    
    // Board members bypass onboarding - they go straight to /board via BoardGuard
    if (isBoardMember) return;
    
    // Skip onboarding for admin-specific paths even if somehow accessed
    if (isAdminPath) return;

    // Redirect non-admin users to onboarding if not completed
    // Only redirect if onboarding is explicitly NOT completed (false or null)
    // Don't redirect just because accountType is missing - user may have completed onboarding but not selected a type
    if (onboardingCompleted === false) {
      navigate('/onboarding');
    }
  }, [onboardingCompleted, accountType, isLoading, rolesLoading, isAdmin, isBoardMember, navigate, location.pathname]);

  // Show loading spinner only while actively loading (with timeout protection)
  if (isLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If there were errors but we're no longer loading, continue rendering
  // (The hooks handle recovery automatically)
  return <>{children}</>;
}
