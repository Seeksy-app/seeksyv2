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
  ChevronRight
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
  const [engagementOpen, setEngagementOpen] = useState(true);

  if (!user) return null;

  const mainNavItems = [
    { title: "My Day", url: "/my-day", icon: Sparkles },
    { title: "Inbox", url: "/inbox", icon: Inbox },
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
    { title: "Analytics", url: "/email/analytics", icon: BarChart3 },
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
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium">My Day OS</SidebarGroupLabel>
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

        <Separator className="my-3 bg-sidebar-hover/30" />

        {/* Engagement → Email */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible open={engagementOpen} onOpenChange={setEngagementOpen}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-hover/50 rounded-lg px-2 py-1 transition-colors text-sidebar-foreground/60 font-medium">
                  <span>Engagement</span>
                  {engagementOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <Collapsible defaultOpen>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-sidebar-hover/80">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {emailItems.map((item) => {
                              const isActive = location.pathname === item.url;
                              return (
                                <SidebarMenuSubItem key={item.url}>
                                  <SidebarMenuSubButton asChild isActive={isActive}>
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
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Separator className="my-3 bg-sidebar-hover/30" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium">Admin</SidebarGroupLabel>
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
