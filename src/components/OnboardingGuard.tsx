import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';
import { useUserRoles } from '@/hooks/useUserRoles';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, isLoading, accountType } = useAccountType();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're loading, already on onboarding, or on public/auth pages
    if (isLoading || rolesLoading) return;
    
    // Public paths that don't require onboarding
    const publicPaths = ['/auth', '/onboarding', '/signup-select', '/', '/pricing', '/comparison'];
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

  if (isLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
