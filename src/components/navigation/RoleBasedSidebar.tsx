/**
 * Role-based sidebar
 * 
 * For Creators: Uses NAV_ITEMS from useNavPreferences as source of truth
 * For Admins: Shows admin-specific collapsible groups from NAVIGATION_CONFIG
 */

import { useState, useEffect } from "react";
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
  Shield,
  Image,
  Layout,
  Wand2,
  Palette,
  Camera,
  Scale,
  Fingerprint,
  ShieldCheck,
  Tag,
  Award,
  Hexagon,
  Radio,
  TrendingUp,
  FileBarChart,
  Calculator,
  Headphones,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Network,
  Key,
  Bot,
  MessageCircle,
  Inbox,
  Video,
  Coins,
  Calendar,
  Send,
  Zap,
  Rocket,
  Briefcase,
  Sliders,
  Rss,
  Wrench,
  Globe,
  UserPlus,
  BarChart2,
  ScrollText,
  Webhook,
  Mail,
  Instagram,
  ChevronDown,
  Play,
  Package,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAVIGATION_CONFIG, filterNavigationByRoles } from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAccountType } from "@/hooks/useAccountType";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedNavigation";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { useNavPreferences, NAV_ITEMS } from "@/hooks/useNavPreferences";
import { useCustomPackages } from "@/hooks/useCustomPackages";

interface RoleBasedSidebarProps {
  user?: User | null;
}

// Mapping of nav item IDs to module IDs for module-gated features
const NAV_TO_MODULE_MAP: Record<string, string> = {
  'meetings': 'meetings',
  'studio': 'studio',
  'social_analytics': 'social-analytics',
  'monetization': 'revenue-tracking',
};

// Icon mapping for all nav items
const ICON_MAP: Record<string, any> = {
  // Nav item IDs
  'my_day': Calendar,
  'dashboard': LayoutDashboard,
  'creator_hub': Rocket,
  'my_streaming_channel': Radio,
  'my_workspaces': Package,
  'meetings': Calendar,
  'studio': Video,
  'social_analytics': BarChart2,
  'media_content': FolderOpen,
  'monetization': DollarSign,
  'seekies': Grid3x3,
  'email': Mail,
  'media_distribution': Play,
  'marketing': Megaphone,
  'settings': Settings,
  'awards': Award,
  // Legacy icon names
  home: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  user: UserIcon,
  link: Network,
  'grid-3x3': Grid3x3,
  users: Users,
  history: History,
  'file-text': FileText,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  target: Target,
  clapperboard: Clapperboard,
  library: Library,
  scissors: Scissors,
  mic: Mic,
  'file-audio': FileAudio,
  podcast: Podcast,
  'folder-open': FolderOpen,
  plus: Plus,
  'dollar-sign': DollarSign,
  'book-open': BookOpen,
  'user-cog': UserCog,
  puzzle: Puzzle,
  activity: Activity,
  'help-circle': HelpCircle,
  layers: Layers,
  code: Code,
  sparkles: Sparkles,
  shield: Shield,
  image: Image,
  layout: Layout,
  'wand-2': Wand2,
  palette: Palette,
  camera: Camera,
  scale: Scale,
  fingerprint: Fingerprint,
  'shield-check': ShieldCheck,
  tag: Tag,
  award: Award,
  hexagon: Hexagon,
  radio: Radio,
  'trending-up': TrendingUp,
  'file-bar-chart': FileBarChart,
  calculator: Calculator,
  headphones: Headphones,
  'credit-card': CreditCard,
  banknote: Banknote,
  'file-spreadsheet': FileSpreadsheet,
  network: Network,
  key: Key,
  bot: Bot,
  'message-circle': MessageCircle,
  inbox: Inbox,
  video: Video,
  coins: Coins,
  calendar: Calendar,
  send: Send,
  zap: Zap,
  rocket: Rocket,
  briefcase: Briefcase,
  sliders: Sliders,
  rss: Rss,
  wrench: Wrench,
  globe: Globe,
  'user-plus': UserPlus,
  'bar-chart-2': BarChart2,
  'scroll-text': ScrollText,
  webhook: Webhook,
  mail: Mail,
  instagram: Instagram,
  play: Play,
  package: Package,
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const { roles, isLoading: rolesLoading, isAdmin } = useUserRoles();
  const { activeAccountType } = useAccountType();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { activatedModuleIds, isLoading: modulesLoading } = useModuleActivation();
  const { navConfig, isLoading: navLoading } = useNavPreferences();
  const { packages: customPackages } = useCustomPackages();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use permission-based navigation filtering for admin nav
  const { navigation: permissionFilteredNav, canAccessPath, isLoading: rbacLoading } = useRoleBasedNavigation();
  
  // Use persisted sidebar state with localStorage
  const { openGroups, toggleGroup, isGroupOpen } = useSidebarState();

  // Listen for nav preference updates to force re-render
  useEffect(() => {
    const handleNavUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('navPreferencesUpdated', handleNavUpdate);
    return () => window.removeEventListener('navPreferencesUpdated', handleNavUpdate);
  }, []);

  if (!user || rolesLoading || navLoading || rbacLoading) {
    return null;
  }

  // Check if a nav item should be visible based on user preferences
  const isNavItemVisibleByNavConfig = (itemId: string): boolean => {
    if (navConfig.hidden.includes(itemId)) {
      return false;
    }
    return true;
  };

  // Check if a nav item should be visible based on module activation
  const isModuleActivated = (itemId: string): boolean => {
    const requiredModule = NAV_TO_MODULE_MAP[itemId];
    if (!requiredModule) return true; // No module requirement
    if (isAdmin) return true; // Admins see all
    return activatedModuleIds.includes(requiredModule);
  };

  // Build nav items from NAV_ITEMS respecting user config and module activation
  const userNavItems = NAV_ITEMS
    .filter(item => isNavItemVisibleByNavConfig(item.id) && isModuleActivated(item.id))
    .sort((a, b) => {
      const aIndex = navConfig.order.indexOf(a.id);
      const bIndex = navConfig.order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  // Use permission-filtered navigation for admin users (combines role + permission checks)
  const filteredNavigation = isAdmin ? permissionFilteredNav : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <SparkIcon variant="holiday" size={48} animated pose="waving" />
              <span className="text-white text-2xl font-bold">Seeksy</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center flex-1">
              <SparkIcon variant="holiday" size={32} animated pose="idle" />
            </div>
          )}
          {/* Customize Nav Icon Button */}
          <button
            onClick={() => window.dispatchEvent(new Event('openNavCustomization'))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20 shadow-sm"
            title="Customize Navigation"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="pb-6">
        {/* Creator nav items - ONLY for non-admin users */}
        {!isAdmin && (
          <>
            {userNavItems.map((item) => {
              const Icon = ICON_MAP[item.id] || LayoutDashboard;
              const isPinned = navConfig.pinned.includes(item.id);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isOpen = openGroups[item.id] ?? false;
              
              // Items that should NOT be bold group headers (regular nav items)
              const isRegularNavItem = ['settings', 'awards'].includes(item.id);
              
              // Special handling for My Workspaces - collapsible with sub-items
              if (item.id === 'my_workspaces') {
                return (
                  <SidebarGroup key={item.id}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleGroup(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarGroupLabel className="cursor-pointer hover:bg-white/10 rounded-md transition-colors flex items-center justify-between text-white font-semibold text-sm px-3 py-2 w-full">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                          )}
                        </SidebarGroupLabel>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarGroupContent>
                          <SidebarMenu className="pl-4">
                            {customPackages.map((pkg) => (
                              <SidebarMenuItem key={pkg.id}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={`/apps?workspace=${pkg.id}`}
                                    className="flex items-center justify-between text-white/80 font-normal"
                                    activeClassName="nav-active"
                                  >
                                    <span className="truncate">{pkg.name}</span>
                                    {pkg.is_default && <span className="text-amber-400 text-xs">⭐</span>}
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarGroup>
                );
              }
              
              // Items WITH sub-items - render as collapsible group with bold header
              if (hasSubItems) {
                const subItemConfigs = navConfig.subItems?.[item.id] || [];
                const visibleSubItems = item.subItems!.filter(sub => {
                  const config = subItemConfigs.find(c => c.id === sub.id);
                  return !config || config.visible !== false;
                });
                
                return (
                  <SidebarGroup key={item.id}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleGroup(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarGroupLabel className="cursor-pointer hover:bg-white/10 rounded-md transition-colors flex items-center justify-between text-white font-semibold text-sm px-3 py-2 w-full">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!collapsed && (
                            <div className="flex items-center gap-2">
                              {isPinned && <span className="text-amber-400 text-xs">★</span>}
                              <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            </div>
                          )}
                        </SidebarGroupLabel>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarGroupContent>
                          <SidebarMenu className="pl-4">
                            {visibleSubItems.map((subItem) => (
                              <SidebarMenuItem key={subItem.id}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={subItem.path}
                                    className="flex items-center gap-2 text-white/80 font-normal"
                                    activeClassName="nav-active"
                                  >
                                    <span className="truncate">{subItem.label}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarGroup>
                );
              }
              
              // Regular nav items (Settings, Awards) - NOT bold, just regular links
              if (isRegularNavItem) {
                return (
                  <SidebarGroup key={item.id}>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.path}
                              className="flex items-center gap-3 text-white/80 font-normal px-3 py-2"
                              activeClassName="nav-active"
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              {!collapsed && <span className="truncate">{item.label}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                );
              }
              
              // Items WITHOUT sub-items - bold group header style (My Day, Creator Hub, Dashboard, Seekies & Apps)
              return (
                <SidebarGroup key={item.id}>
                  <SidebarGroupLabel asChild className="cursor-pointer hover:bg-white/10 rounded-md transition-colors">
                    <NavLink
                      to={item.path}
                      className="flex items-center justify-between text-white font-semibold text-sm px-3 py-2 w-full"
                      activeClassName="bg-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && isPinned && <span className="text-amber-400 text-xs">★</span>}
                    </NavLink>
                  </SidebarGroupLabel>
                </SidebarGroup>
              );
            })}
          </>
        )}

        {/* Admin-only collapsible sections */}
        {filteredNavigation.filter(g => g.collapsible).map((group) => {
          const isOpen = openGroups[group.group] ?? true;
          
          return (
            <Collapsible
              key={group.group}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.group)}
            >
              <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors flex items-center justify-between text-white font-semibold text-sm px-3 py-2 w-full">
                      <span className="truncate">{group.group}</span>
                      {!collapsed && (
                        <ChevronDown 
                          className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ml-auto ${
                            isOpen ? 'rotate-0' : '-rotate-90'
                          }`} 
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = ICON_MAP[item.icon] || Grid3x3;
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined}>
                              <NavLink
                                to={item.path}
                                className="flex items-center gap-3 transition-all duration-150"
                                activeClassName="nav-active"
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

      </SidebarContent>
    </Sidebar>
  );
}
