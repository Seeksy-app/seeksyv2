/**
 * Creator Studio Sidebar
 * 
 * Dedicated sidebar for Creator/Podcast Studio workspace
 * Replaces My Day OS navigation when in creator/podcast routes
 */

import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard,
  Mic,
  List,
  Radio,
  Globe,
  Share2,
  DollarSign,
  BarChart3,
  Settings,
  Podcast,
  FileAudio,
  Headphones,
  TrendingUp,
  Play,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
import { SparkIcon } from "@/components/spark/SparkIcon";

interface CreatorSidebarProps {
  user?: User | null;
}

export function CreatorSidebar({ user }: CreatorSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user) return null;

  const creatorNavItems = [
    { 
      title: "Studio Dashboard", 
      url: "/podcasts", 
      icon: LayoutDashboard,
      description: "Overview of all podcasts"
    },
    { 
      title: "Episodes", 
      url: "/podcasts/episodes", 
      icon: List,
      description: "Manage episodes"
    },
    { 
      title: "Record / Studio", 
      url: "/podcast-studio", 
      icon: Mic,
      description: "Record new episodes"
    },
    { 
      title: "Players", 
      url: "/podcasts/players", 
      icon: Play,
      description: "Podcast players & embeds"
    },
    { 
      title: "Website & RSS", 
      url: "/podcasts/website", 
      icon: Globe,
      description: "Website and RSS settings"
    },
    { 
      title: "Distribution", 
      url: "/podcast-distribution", 
      icon: Share2,
      description: "Distribute to platforms"
    },
    { 
      title: "Monetization", 
      url: "/podcast-revenue", 
      icon: DollarSign,
      description: "Revenue & ads"
    },
    { 
      title: "Analytics", 
      url: "/podcasts/analytics", 
      icon: BarChart3,
      description: "Stats & insights"
    },
    { 
      title: "Settings", 
      url: "/podcasts/settings", 
      icon: Settings,
      description: "Podcast settings"
    },
  ];

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <SparkIcon variant="holiday" size={48} animated pose="waving" />
            <span className="text-white text-2xl font-bold">Seeksy</span>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center">
            <SparkIcon variant="holiday" size={32} animated pose="idle" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Creator Studio Section */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-white font-semibold text-sm px-3 py-2 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Podcast className="h-4 w-4" />
                Creator Studio
              </div>
            </SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu>
              {creatorNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50 rounded-md transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {!collapsed && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-white/70 text-xs px-3 py-2 uppercase tracking-wider">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/podcast-studio"
                      className="hover:bg-primary/10 rounded-md transition-colors text-primary"
                    >
                      <Mic className="h-4 w-4" />
                      <span>New Recording</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/podcasts/create"
                      className="hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <Podcast className="h-4 w-4" />
                      <span>New Podcast</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <button
          onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
          className="flex items-center gap-2 text-sm text-white hover:text-primary transition-colors w-full text-left bg-transparent"
        >
          <div className="bg-transparent">
            <SparkIcon size={20} />
          </div>
          {!collapsed && <span className="text-white">Ask Spark</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}