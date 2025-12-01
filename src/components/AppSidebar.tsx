import { Link, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { 
  Sparkles,
  Inbox,
  Users,
  Video,
  DollarSign,
  Settings,
  Shield,
  BarChart3
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import seeksyLogo from "@/assets/seeksy-logo.png";
import { SparkIcon } from "@/components/spark/SparkIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  user?: User | null;
  isAdmin?: boolean;
}

export function AppSidebar({ user, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  if (!user) return null;

  const mainNavItems = [
    { title: "My Day", url: "/my-day", icon: Sparkles },
    { title: "Inbox", url: "/inbox", icon: Inbox },
    { title: "Contacts & Audience", url: "/audience", icon: Users },
    { title: "Content & Media", url: "/content", icon: Video },
    { title: "Monetization Hub", url: "/monetization", icon: DollarSign },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const adminNavItems = isAdmin ? [
    { title: "Admin Dashboard", url: "/admin", icon: Shield },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  ] : [];

  const isActive = (path: string) => {
    if (path === "/my-day" && location.pathname === "/") return true;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-hover/30 p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={seeksyLogo} alt="Seeksy" className="h-8 w-8" />
          {!collapsed && <span className="font-semibold text-lg">Seeksy</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* My Day OS */}
        <SidebarGroup>
          <SidebarGroupLabel>My Day OS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-hover/80 transition-all duration-200 hover:translate-x-0.5"
                      activeClassName="bg-sidebar-active font-semibold border-l-3 border-sidebar-accent"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="border-t border-sidebar-hover/30 pt-4">
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-hover/80 transition-all duration-200 hover:translate-x-0.5"
                        activeClassName="bg-sidebar-active font-semibold border-l-3 border-sidebar-accent"
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-hover/30 p-4">
        <NavLink
          to="/ask-spark"
          className="flex items-center gap-2 text-sm hover:text-sidebar-accent transition-colors"
        >
          <SparkIcon size={20} />
          {!collapsed && <span>Ask Spark</span>}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
