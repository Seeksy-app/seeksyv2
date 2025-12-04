import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Headphones, Inbox, Zap, FileText, Users, Settings, Link2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "tickets", label: "Tickets", icon: Inbox, path: "/helpdesk" },
  { id: "automations", label: "Automations", icon: Zap, path: "/helpdesk/automations" },
  { id: "templates", label: "Templates & Macros", icon: FileText, path: "/helpdesk/templates" },
  { id: "users", label: "User Profiles", icon: Users, path: "/helpdesk/users" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/helpdesk/analytics" },
  { id: "integrations", label: "External Tools", icon: Link2, path: "/helpdesk/integrations" },
  { id: "settings", label: "Settings", icon: Settings, path: "/helpdesk/settings" },
];

export default function HelpDeskLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/helpdesk") {
      return location.pathname === "/helpdesk" || location.pathname.startsWith("/helpdesk/ticket/");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Help Desk</h1>
                <p className="text-xs text-muted-foreground">Support Management</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "w-full justify-start",
                          isActive(item.path) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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