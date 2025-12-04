import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Headphones, Inbox, Zap, FileText, Users, Settings, Link2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions, Permission } from "@/hooks/usePermissions";

const navItems: { id: string; label: string; icon: any; path: string; permission: Permission }[] = [
  { id: "tickets", label: "Tickets", icon: Inbox, path: "/helpdesk", permission: "supportdesk.view" },
  { id: "automations", label: "Automations", icon: Zap, path: "/helpdesk/automations", permission: "supportdesk.manage" },
  { id: "templates", label: "Templates & Macros", icon: FileText, path: "/helpdesk/templates", permission: "supportdesk.manage" },
  { id: "users", label: "User Profiles", icon: Users, path: "/helpdesk/users", permission: "supportdesk.view" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/helpdesk/analytics", permission: "supportdesk.manage" },
  { id: "integrations", label: "External Tools", icon: Link2, path: "/helpdesk/integrations", permission: "supportdesk.settings" },
  { id: "settings", label: "Settings", icon: Settings, path: "/helpdesk/settings", permission: "supportdesk.settings" },
];

export default function HelpDeskLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/helpdesk") {
      return location.pathname === "/helpdesk" || location.pathname.startsWith("/helpdesk/ticket/");
    }
    return location.pathname.startsWith(path);
  };

  // Check if user has any support desk permission
  const hasSupportAccess = hasAnyPermission(['supportdesk.view', 'supportdesk.reply', 'supportdesk.manage', 'supportdesk.settings']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasSupportAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access the Help Desk.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Help Desk</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    // Only show items user has permission for
                    if (!hasPermission(item.permission)) return null;
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          className={cn(
                            "w-full justify-start",
                            isActive(item.path) && "bg-accent text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
