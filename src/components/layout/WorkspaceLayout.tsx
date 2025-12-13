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
import { useAdminViewMode } from "@/hooks/useAdminViewMode";

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
  const { viewMode } = useAdminViewMode();
  
  // Check if on a legacy route
  const isLegacyRoute = LEGACY_NAV_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  // If admin is in creator view mode, don't force legacy nav
  if (isAdmin && viewMode === 'creator') {
    return isLegacyRoute; // Only use legacy if actually on legacy route
  }
  
  // Also use legacy nav if user has admin/board/advertiser role
  // This ensures they get the correct navigation even if they navigate to a creator route
  return isLegacyRoute || isAdmin || isBoardMember || isAdvertiser;
}

// Hook to enforce role-based routing
function useRoleBasedRouting(user: User | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isBoardMember, isAdvertiser, isLoading } = useUserRoles();
  const { viewMode } = useAdminViewMode();

  useEffect(() => {
    // Skip if no user or still loading roles
    if (!user || isLoading) return;
    
    // Skip for public routes, auth, onboarding
    const skipRoutes = ['/auth', '/onboarding', '/public', '/pricing', '/about', '/terms', '/privacy', '/apps-and-tools'];
    if (skipRoutes.some(r => location.pathname.startsWith(r))) return;

    // If admin has chosen a view mode other than 'admin', respect that choice
    if (isAdmin && viewMode !== 'admin') {
      // Don't redirect - let them stay on their chosen view
      return;
    }

    // Admin users should be redirected to /admin if on creator routes (only if not in another view mode)
    if (isAdmin && viewMode === 'admin') {
      const isCreatorRoute = !location.pathname.startsWith('/admin') && 
                             !location.pathname.startsWith('/board') && 
                             !location.pathname.startsWith('/cfo') &&
                             !location.pathname.startsWith('/advertiser');
      if (isCreatorRoute && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/email-settings') && !location.pathname.startsWith('/signatures')) {
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
  }, [user, isAdmin, isBoardMember, isAdvertiser, isLoading, location.pathname, navigate, viewMode]);
}

function WorkspaceLayoutInner({ 
  user, 
  children, 
  shouldShowSidebar, 
  shouldShowTopNav 
}: WorkspaceLayoutProps) {
  const location = useLocation();
  const { workspaces, isLoading, currentWorkspace, refreshWorkspaces } = useWorkspace();
  const useLegacyNav = useShouldUseLegacyNav();
  const isAdvertiserRoute = location.pathname.startsWith('/advertiser');
  const { isAdmin } = useUserRoles();
  const { viewMode } = useAdminViewMode();

  // Enforce role-based routing
  useRoleBasedRouting(user);

  // When admin switches to creator view mode, force refresh workspaces
  useEffect(() => {
    if (isAdmin && viewMode === 'creator' && workspaces.length === 0) {
      console.log('[WorkspaceLayout] Admin in creator mode, forcing workspace fetch');
      refreshWorkspaces(true);
    }
  }, [isAdmin, viewMode, workspaces.length, refreshWorkspaces]);

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
    '/videos',
  ].some(route => location.pathname === route || location.pathname.startsWith('/public') || location.pathname.startsWith('/videos'));

  // Onboarding route should render children ONLY - no nav, no sidebar
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  // Legal public signing pages should render standalone - no nav, no sidebar
  const isLegalPublicRoute = location.pathname.startsWith('/legal/purchaser') || location.pathname.startsWith('/legal/chairman');
  if (isLegalPublicRoute) {
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
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
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
