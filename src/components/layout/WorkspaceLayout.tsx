import { User } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { GlobalTopNav } from "@/components/workspace/GlobalTopNav";
import { WorkspaceOnboarding } from "@/components/workspace/WorkspaceOnboarding";
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
  '/sales',
  '/cfo',
  '/helpdesk',
  '/demo-videos',
];

// Check if current route should use legacy navigation
function useShouldUseLegacyNav() {
  const location = useLocation();
  
  // Check if on a legacy route
  const isLegacyRoute = LEGACY_NAV_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  return isLegacyRoute;
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
  const [hasCompletedWorkspaceOnboarding, setHasCompletedWorkspaceOnboarding] = useState(() => {
    return localStorage.getItem('workspaceOnboardingComplete') === 'true';
  });

  // Public routes that don't need workspace onboarding
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

  // Mark as complete once we have workspaces
  useEffect(() => {
    if (workspaces.length > 0 && !hasCompletedWorkspaceOnboarding) {
      localStorage.setItem('workspaceOnboardingComplete', 'true');
      setHasCompletedWorkspaceOnboarding(true);
    }
  }, [workspaces, hasCompletedWorkspaceOnboarding]);

  // Handler for when workspace onboarding completes
  const handleWorkspaceOnboardingComplete = () => {
    localStorage.setItem('workspaceOnboardingComplete', 'true');
    setHasCompletedWorkspaceOnboarding(true);
  };

  // Show workspace onboarding only if:
  // - Not loading
  // - User exists
  // - No workspaces
  // - Haven't previously completed workspace onboarding
  // - Not on legacy/public/onboarding routes
  const needsWorkspaceOnboarding = !isLoading && 
    user && 
    workspaces.length === 0 && 
    !hasCompletedWorkspaceOnboarding &&
    !useLegacyNav &&
    !isPublicRoute &&
    !location.pathname.startsWith('/onboarding') &&
    !location.pathname.startsWith('/auth');

  if (needsWorkspaceOnboarding) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          <WorkspaceOnboarding onComplete={handleWorkspaceOnboardingComplete} />
        </div>
      </div>
    );
  }

  // Use legacy navigation for admin/board/advertiser routes
  if (useLegacyNav || isPublicRoute || !user) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        {shouldShowSidebar && (
          isAdvertiserRoute ? <AdvertiserSidebarNav /> : <RoleBasedSidebar user={user} />
        )}
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          {shouldShowTopNav && <TopNavBar />}
          <main className="flex-1 flex flex-col bg-background">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Use new workspace-based navigation for regular users
  return (
    <div className="min-h-screen flex w-full bg-background">
      {shouldShowSidebar && <WorkspaceSidebar />}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {shouldShowTopNav && <GlobalTopNav />}
        <main className="flex-1 flex flex-col bg-background">
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
