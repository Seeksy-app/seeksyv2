/**
 * Navigation component that renders from navigation config
 * and filters by user roles
 */

import { 
  LayoutDashboard,
  User,
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
  Mail,
  Layout,
  Filter,
  Zap,
  Shield,
  Lock,
  Briefcase,
  Calendar,
  Link2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAVIGATION_CONFIG, filterNavigationByRoles, type UserRole } from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping from string names to Lucide components
const ICON_MAP: Record<string, any> = {
  home: LayoutDashboard,
  user: User,
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
  mail: Mail,
  layout: Layout,
  filter: Filter,
  zap: Zap,
  shield: Shield,
  lock: Lock,
  briefcase: Briefcase,
  calendar: Calendar,
  link: Link2,
};

export function ConfigBasedNavigation() {
  const { roles, isLoading } = useUserRoles();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  // Fetch user preferences to check module activation
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences-modules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_preferences")
        .select("module_marketing_enabled, module_newsletter_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  if (isLoading) {
    return null;
  }

  // Filter navigation based on user's roles
  let filteredNavigation = filterNavigationByRoles(
    NAVIGATION_CONFIG.navigation,
    roles
  );

  // Filter out Email group if neither Marketing nor Newsletter modules are enabled
  const isEmailModuleActive = preferences?.module_marketing_enabled || preferences?.module_newsletter_enabled;
  
  if (!isEmailModuleActive) {
    filteredNavigation = filteredNavigation.filter(group => group.group !== "Email");
  }

  return (
    <>
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
    </>
  );
}
