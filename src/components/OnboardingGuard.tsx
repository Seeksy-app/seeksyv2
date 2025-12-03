import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';
import { useUserRoles } from '@/hooks/useUserRoles';
import { clearRecoveryFlag } from '@/utils/bootRecovery';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, isLoading, accountType, error: accountError } = useAccountType();
  const { isAdmin, isLoading: rolesLoading, error: rolesError } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear recovery flag on successful load
  useEffect(() => {
    if (!isLoading && !rolesLoading) {
      clearRecoveryFlag();
    }
  }, [isLoading, rolesLoading]);

  useEffect(() => {
    // Don't redirect if we're loading, already on onboarding, or on public/auth pages
    if (isLoading || rolesLoading) return;
    
    // Public paths that don't require onboarding
    const publicPaths = [
      '/auth', '/onboarding', '/onboarding-test', '/signup-select', '/', '/pricing', '/comparison',
      '/privacy', '/terms', '/cookies', '/security', '/about', '/apps-and-tools'
    ];
    const isPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith('/c/'));
    const isBoardPath = location.pathname.startsWith('/board');
    
    // Admin-only paths that should NEVER show onboarding (CFO, GTM, Financial Models, Admin)
    const adminPaths = [
      '/cfo-dashboard',
      '/cfo-calculators',
      '/marketing-gtm',
      '/admin',
      '/investor-portal',
      '/proforma',
    ];
    const isAdminPath = adminPaths.some(path => location.pathname.startsWith(path));
    
    if (isPublicPath || isBoardPath) return;
    
    // Admin users never see onboarding - they go straight to admin/CFO views
    if (isAdmin) return;
    
    // Skip onboarding for admin-specific paths even if somehow accessed
    if (isAdminPath) return;

    // Redirect non-admin users to onboarding if not completed
    if (!onboardingCompleted || !accountType) {
      navigate('/onboarding');
    }
  }, [onboardingCompleted, accountType, isLoading, rolesLoading, isAdmin, navigate, location.pathname]);

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
