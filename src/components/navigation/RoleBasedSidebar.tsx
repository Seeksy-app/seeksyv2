/**
 * Simplified role-based sidebar using navigation config as source of truth
 * 
 * This is a cleaner alternative to AppSidebar that uses the centralized
 * navigation config and filters by user roles from the database.
 * 
 * To use: Replace AppSidebar import with this component in your layout.
 */

import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard,
  User as UserIcon,
  Settings,
  Grid3x3,
  Users,
  History,
  FileText,
  Megaphone,
  MessageSquare,
  Target,
  Clapperboard,
  Library,
  Scissors,
  Mic,
  FileAudio,
  Podcast,
  FolderOpen,
  Plus,
  DollarSign,
  BookOpen,
  UserCog,
  Puzzle,
  Activity,
  HelpCircle,
  Layers,
  Code,
  Sparkles,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { NAVIGATION_CONFIG, filterNavigationByRoles } from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { SparkIcon } from "@/components/spark/SparkIcon";

interface RoleBasedSidebarProps {
  user?: User | null;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  home: LayoutDashboard,
  user: UserIcon,
  settings: Settings,
  apps: Grid3x3,
  contacts: Users,
  history: History,
  form: FileText,
  megaphone: Megaphone,
  sms: MessageSquare,
  target: Target,
  studio: Clapperboard,
  library: Library,
  scissors: Scissors,
  mic: Mic,
  document: FileAudio,
  podcast: Podcast,
  folder: FolderOpen,
  plus: Plus,
  dollar: DollarSign,
  book: BookOpen,
  group: UserCog,
  puzzle: Puzzle,
  status: Activity,
  help: HelpCircle,
  layers: Layers,
  code: Code,
  sparkles: Sparkles,
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const { roles, isLoading } = useUserRoles();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user || isLoading) {
    return null;
  }

  // Filter navigation based on user's roles
  const filteredNavigation = filterNavigationByRoles(
    NAVIGATION_CONFIG.navigation,
    roles
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <SparkIcon variant="holiday" size={48} animated pose="waving" />
            <img 
              src="/seeksy-logo.png" 
              alt="Seeksy" 
              className="h-8 w-auto"
            />
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center">
            <SparkIcon variant="holiday" size={32} animated pose="idle" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {filteredNavigation.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>
              {group.group}
              {group.description && !collapsed && (
                <span className="text-xs text-muted-foreground ml-2">
                  {group.description}
                </span>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Grid3x3;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <Icon className="h-4 w-4" />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
