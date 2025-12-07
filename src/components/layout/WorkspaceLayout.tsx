import { User } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
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
  const { workspaces, isLoading, currentWorkspace, createWorkspace, setCurrentWorkspace } = useWorkspace();
  const useLegacyNav = useShouldUseLegacyNav();
  const isAdvertiserRoute = location.pathname.startsWith('/advertiser');

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
    '/onboarding',
  ].some(route => location.pathname === route || location.pathname.startsWith('/public') || location.pathname.startsWith('/onboarding'));

  // Auto-create default workspace if user has none (instead of showing old popup)
  useEffect(() => {
    const autoCreateWorkspace = async () => {
      if (!isLoading && user && workspaces.length === 0 && !useLegacyNav && !isPublicRoute) {
        try {
          const newWorkspace = await createWorkspace("My Workspace", []);
          if (newWorkspace) {
            setCurrentWorkspace(newWorkspace);
          }
        } catch (error) {
          console.error("Error auto-creating workspace:", error);
        }
      }
    };
    autoCreateWorkspace();
  }, [isLoading, user, workspaces.length, useLegacyNav, isPublicRoute, createWorkspace, setCurrentWorkspace]);

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
