import { User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { GlobalTopNav } from "@/components/workspace/GlobalTopNav";
import { RoleBasedSidebar } from "@/components/navigation/RoleBasedSidebar";
import { AdvertiserSidebarNav } from "@/components/advertiser/AdvertiserSidebarNav";
import { TopNavBar } from "@/components/TopNavBar";
import { useUserRoles } from "@/hooks/useUserRoles";

interface WorkspaceLayoutProps {
  user: User | null;
  children: React.ReactNode;
  shouldShowSidebar: boolean;
  shouldShowTopNav: boolean;
}

// Routes that should use legacy navigation (Admin, Board, Advertiser)
const LEGACY_NAV_ROUTES = [
  '/admin',
  '/board',
  '/advertiser',
  '/cfo',
  '/helpdesk',
  '/demo-videos',
];

// Check if current route should use legacy navigation
function useShouldUseLegacyNav() {
  const location = useLocation();
  const { isAdmin, isBoardMember, isAdvertiser } = useUserRoles();
  
  // Check if on a legacy route
  const isLegacyRoute = LEGACY_NAV_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  // Also use legacy nav if user has admin/board/advertiser role
  // This ensures they get the correct navigation even if they navigate to a creator route
  return isLegacyRoute || isAdmin || isBoardMember || isAdvertiser;
}

// Hook to enforce role-based routing
function useRoleBasedRouting(user: User | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isBoardMember, isAdvertiser, isLoading } = useUserRoles();

  useEffect(() => {
    // Skip if no user or still loading roles
    if (!user || isLoading) return;
    
    // Skip for public routes, auth, onboarding
    const skipRoutes = ['/auth', '/onboarding', '/public', '/pricing', '/about', '/terms', '/privacy', '/apps-and-tools'];
    if (skipRoutes.some(r => location.pathname.startsWith(r))) return;

    // Admin users should be redirected to /admin if on creator routes
    if (isAdmin) {
      const isCreatorRoute = !location.pathname.startsWith('/admin') && 
                             !location.pathname.startsWith('/board') && 
                             !location.pathname.startsWith('/cfo');
      if (isCreatorRoute && !location.pathname.startsWith('/settings')) {
        console.log('[WorkspaceLayout] Admin on creator route, redirecting to /admin');
        navigate('/admin', { replace: true });
      }
    }
    
    // Board members should be on /board
    if (isBoardMember && !isAdmin) {
      if (!location.pathname.startsWith('/board')) {
        console.log('[WorkspaceLayout] Board member redirecting to /board');
        navigate('/board', { replace: true });
      }
    }
    
    // Advertisers should be on /advertiser
    if (isAdvertiser && !isAdmin && !isBoardMember) {
      if (!location.pathname.startsWith('/advertiser')) {
        console.log('[WorkspaceLayout] Advertiser redirecting to /advertiser');
        navigate('/advertiser', { replace: true });
      }
    }
  }, [user, isAdmin, isBoardMember, isAdvertiser, isLoading, location.pathname, navigate]);
}

function WorkspaceLayoutInner({ 
  user, 
  children, 
  shouldShowSidebar, 
  shouldShowTopNav 
}: WorkspaceLayoutProps) {
  const location = useLocation();
  const { workspaces, isLoading, currentWorkspace } = useWorkspace();
  const useLegacyNav = useShouldUseLegacyNav();
  const isAdvertiserRoute = location.pathname.startsWith('/advertiser');
  const { isAdmin } = useUserRoles();

  // Enforce role-based routing
  useRoleBasedRouting(user);

  // Public routes that don't need workspace check
  const isPublicRoute = [
    '/',
    '/auth',
    '/pricing',
    '/about',
    '/terms',
    '/privacy',
    '/cookies',
    '/security',
    '/apps-and-tools',
    '/demo-videos',
  ].some(route => location.pathname === route || location.pathname.startsWith('/public'));

  // Onboarding route should render children ONLY - no nav, no sidebar
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  // Board routes have their own complete layout (BoardLayout) - skip WorkspaceLayout wrapper
  const isBoardRoute = location.pathname.startsWith('/board');
  if (isBoardRoute) {
    return <>{children}</>;
  }

  // Use legacy navigation for admin/advertiser routes OR admin users
  if (useLegacyNav || isPublicRoute || !user) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        {shouldShowSidebar && (
          isAdvertiserRoute ? <AdvertiserSidebarNav /> : <RoleBasedSidebar user={user} />
        )}
        <div className="flex-1 flex flex-col min-h-screen">
          {shouldShowTopNav && <TopNavBar />}
          <main className="flex-1 flex flex-col bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Use new workspace-based navigation for regular users (creators)
  return (
    <div className="min-h-screen flex w-full bg-background">
      {shouldShowSidebar && <WorkspaceSidebar />}
      <div className="flex-1 flex flex-col min-h-screen">
        {shouldShowTopNav && <GlobalTopNav />}
        <main className="flex-1 flex flex-col bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutInner {...props} />
    </WorkspaceProvider>
  );
}
