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
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="px-0">
              <SidebarMenu className="px-0">
                {userNavItems.map((item) => {
                  const Icon = ICON_MAP[item.id] || LayoutDashboard;
                  const isPinned = navConfig.pinned.includes(item.id);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isLevel0 = item.level === 0;
                  
                  // Level 0 items with sub-items render as collapsible
                  if (hasSubItems && !collapsed) {
                    const isOpen = openGroups[item.id] ?? false;
                    const subItemConfigs = navConfig.subItems?.[item.id] || [];
                    const visibleSubItems = item.subItems.filter(sub => {
                      const config = subItemConfigs.find(c => c.id === sub.id);
                      return !config || config.visible !== false;
                    });
                    
                    return (
                      <Collapsible
                        key={item.id}
                        open={isOpen}
                        onOpenChange={() => toggleGroup(item.id)}
                      >
                        <SidebarMenuItem className="px-0">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="w-full flex items-center justify-between transition-all duration-150 cursor-pointer hover:bg-white/10 text-white px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon className="h-4 w-4 shrink-0 text-white" />
                                <span className="truncate text-white font-medium">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-auto shrink-0">
                                {isPinned && <span className="pinned-star text-amber-400 text-xs">★</span>}
                                <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                              </div>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {/* Sub-items (level 1) get indentation */}
                            <SidebarMenu className="ml-6 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                              {visibleSubItems.map((subItem) => (
                                <SidebarMenuItem key={subItem.id}>
                                  <SidebarMenuButton asChild>
                                    <NavLink
                                      to={subItem.path}
                                      className="flex items-center gap-2 transition-all duration-150 text-sm py-1.5 text-white/80 hover:text-white"
                                      activeClassName="nav-active text-white"
                                    >
                                      <span className="truncate">{subItem.label}</span>
                                    </NavLink>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  
                  // Level 0 items without sub-items - left-justified, no indent
                  return (
                    <SidebarMenuItem key={item.id} className="px-0">
                      <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined}>
                        <NavLink
                          to={item.path}
                          className="flex items-center justify-between transition-all duration-150 text-white hover:bg-white/10 w-full px-3 py-2"
                          activeClassName="nav-active"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="h-4 w-4 shrink-0 text-white" />
                            {!collapsed && <span className="truncate text-white font-medium">{item.label}</span>}
                          </div>
                          {!collapsed && isPinned && <span className="pinned-star text-amber-400 text-xs ml-auto shrink-0">★</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Custom Workspaces Section - Non-admin users */}
        {!isAdmin && customPackages.length > 0 && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/60 text-xs font-medium px-3 py-1">
              My Workspaces
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customPackages.map((pkg) => (
                  <SidebarMenuItem key={pkg.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/apps?workspace=${pkg.id}`}
                        className="flex items-center justify-between transition-all duration-150 text-white hover:bg-white/10 w-full"
                        activeClassName="nav-active"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Package className="h-4 w-4 shrink-0 text-white" />
                          <span className="truncate text-white">{pkg.name}</span>
                        </div>
                        {pkg.is_default && (
                          <span className="text-amber-400 text-xs ml-auto shrink-0">★</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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

        {/* Bottom Section - Ask Spark */}
        <SidebarGroup className="mt-auto mb-4 space-y-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Ask Spark */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
                  className="hover:bg-accent/20 cursor-pointer transition-all duration-200 py-3 px-4 rounded-lg relative group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(74, 144, 255, 0.08) 0%, rgba(74, 144, 255, 0.12) 100%)',
                    boxShadow: '0 0 20px rgba(74, 144, 255, 0.15)',
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <SparkIcon variant="holiday" size={24} animated />
                    {!collapsed && <span className="text-base font-semibold text-white flex-1">Ask Spark</span>}
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
