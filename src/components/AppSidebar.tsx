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
  BarChart3,
  Mail,
  Send,
  Calendar,
  FileText,
  Grid,
  Zap,
  ChevronDown,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface AppSidebarProps {
  user?: User | null;
  isAdmin?: boolean;
}

export function AppSidebar({ user, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [emailOpen, setEmailOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(true);

  if (!user) return null;

  const mainNavItems = [
    { title: "My Day", url: "/my-day", icon: Sparkles },
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Seekies & Tools", url: "/apps", icon: Grid },
    { title: "Contacts & Audience", url: "/audience", icon: Users },
    { title: "Content & Media", url: "/content", icon: Video },
    { title: "Monetization Hub", url: "/monetization", icon: DollarSign },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const emailItems = [
    { title: "Inbox", url: "/email", icon: Inbox },
    { title: "Scheduled", url: "/email/scheduled", icon: Calendar },
    { title: "Drafts", url: "/email/drafts", icon: FileText },
    { title: "Sent", url: "/email/sent", icon: Send },
  ];

  const marketingItems = [
    { title: "Campaigns", url: "/email-campaigns", icon: Zap },
    { title: "Templates", url: "/email-templates", icon: Grid },
    { title: "Segments", url: "/email-segments", icon: Users },
    { title: "Automations", url: "/email-automations", icon: Zap },
    { title: "Settings", url: "/email-settings", icon: Settings },
  ];

  const adminNavItems = isAdmin ? [
    { title: "Admin Dashboard", url: "/admin", icon: Shield },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  ] : [];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-hover/30 p-4">
        <Link to="/" className="flex items-center gap-2">
          {!collapsed && <span className="font-semibold text-xl">Seeksy</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item, index) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-hover/80 transition-all duration-200 hover:translate-x-0.5 ${index === 1 ? 'mt-4' : ''}`}
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

        {/* Email Section */}
        {!collapsed && (
          <SidebarGroup className="mt-4">
            <Collapsible open={emailOpen} onOpenChange={setEmailOpen}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-hover/50 rounded-lg px-2 py-1 transition-colors text-white font-medium">
                  <span>Email</span>
                  {emailOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {emailItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              to={item.url}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                                hover:bg-sidebar-hover/60 transition-colors
                                ${isActive ? 'bg-sidebar-active/60 font-medium' : ''}
                              `}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Marketing Section */}
        {!collapsed && (
          <SidebarGroup className="mt-2">
            <Collapsible open={marketingOpen} onOpenChange={setMarketingOpen}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-hover/50 rounded-lg px-2 py-1 transition-colors text-white font-medium">
                  <span>Marketing</span>
                  {marketingOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {marketingItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              to={item.url}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                                hover:bg-sidebar-hover/60 transition-colors
                                ${isActive ? 'bg-sidebar-active/60 font-medium' : ''}
                              `}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-white font-medium">Admin</SidebarGroupLabel>
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
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-hover/30 p-4">
        <button
          onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
          className="flex items-center gap-2 text-sm text-white hover:text-sidebar-accent transition-colors w-full text-left bg-transparent"
          style={{ background: 'transparent' }}
        >
          <div className="bg-transparent" style={{ background: 'transparent' }}>
            <SparkIcon size={20} />
          </div>
          {!collapsed && <span className="text-white">Ask Spark</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
