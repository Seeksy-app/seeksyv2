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
import { useNavigate } from "react-router-dom";
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
// Items without a mapping are always visible (core nav)
const NAV_TO_MODULE_MAP: Record<string, string> = {
  'meetings': 'meetings',
  'media_content': 'studio',
  'email': 'email',
  'marketing': 'marketing',
  'awards': 'awards',
};

// Icon mapping for all nav items
const ICON_MAP: Record<string, any> = {
  // Nav item IDs
  'my_day': Calendar,
  'dashboard': LayoutDashboard,
  'creator_hub': Rocket,
  'my_streaming_channel': Radio,
  'my_workspaces': Package,
  'active_apps': Zap,
  'meetings': Calendar,
  'studio': Video,
  'social_analytics': BarChart2,
  'media_content': Clapperboard,
  'monetization': DollarSign,
  'seekies': Grid3x3,
  'email': Mail,
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

// Module ID to icon mapping for active apps
const MODULE_ICON_MAP: Record<string, any> = {
  'audience-insights': BarChart2,
  'social-analytics': BarChart2,
  'studio': Video,
  'podcasts': Podcast,
  'media-library': Image,
  'clips-editing': Scissors,
  'contacts': Users,
  'segments': Target,
  'campaigns': Megaphone,
  'email-templates': Mail,
  'automations': Zap,
  'sms': MessageCircle,
  'forms': FileText,
  'qr-codes': Grid3x3,
  'meetings': Calendar,
  'events': Calendar,
  'proposals': FileText,
  'tasks': Activity,
  'polls': MessageSquare,
  'awards': Award,
  'team': Users,
  'my-page': Layout,
  'identity-verification': Shield,
  'social-connect': Instagram,
  'marketing': Megaphone,
  'email': Mail,
  'content-library': FolderOpen,
  'clips': Scissors,
};

// Module ID to route mapping
const MODULE_ROUTE_MAP: Record<string, string> = {
  'audience-insights': '/social-analytics',
  'social-analytics': '/social-analytics',
  'studio': '/studio',
  'podcasts': '/podcasts',
  'media-library': '/studio/media',
  'clips-editing': '/clips',
  'contacts': '/audience',
  'segments': '/marketing/segments',
  'campaigns': '/marketing/campaigns',
  'email-templates': '/marketing/templates',
  'automations': '/marketing/automations',
  'sms': '/sms',
  'forms': '/forms',
  'qr-codes': '/qr-codes',
  'meetings': '/meetings',
  'events': '/events',
  'proposals': '/proposals',
  'tasks': '/tasks',
  'polls': '/polls',
  'awards': '/awards',
  'team': '/team',
  'my-page': '/profile/edit',
  'identity-verification': '/identity',
  'social-connect': '/integrations',
  'marketing': '/contacts',
  'email': '/email/inbox',
  'content-library': '/studio/media',
  'clips': '/clips',
};

// Module ID to display name mapping
const MODULE_NAME_MAP: Record<string, string> = {
  'audience-insights': 'Audience Insights',
  'social-analytics': 'Social Analytics',
  'studio': 'Studio',
  'podcasts': 'Podcasts',
  'media-library': 'Media Library',
  'clips-editing': 'Clips & Editing',
  'contacts': 'Contacts',
  'segments': 'Segments',
  'campaigns': 'Campaigns',
  'email-templates': 'Email Templates',
  'automations': 'Automations',
  'sms': 'SMS',
  'forms': 'Forms',
  'qr-codes': 'QR Codes',
  'meetings': 'Meetings',
  'events': 'Events',
  'proposals': 'Proposals',
  'tasks': 'Tasks',
  'polls': 'Polls & Surveys',
  'awards': 'Awards',
  'team': 'Team',
  'my-page': 'My Page',
  'identity-verification': 'Identity',
  'social-connect': 'Social Connect',
  'marketing': 'Marketing',
  'email': 'Email',
  'content-library': 'Content Library',
  'clips': 'AI Clips',
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const navigate = useNavigate();
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

  // Handle logo click - navigate to default landing (My Day for creators, /admin for admins)
  const handleLogoClick = () => {
    const defaultRoute = isAdmin ? '/admin' : '/my-day';
    navigate(defaultRoute);
  };
  
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
  // Uses the moduleId from NAV_ITEMS or falls back to NAV_TO_MODULE_MAP
  const isModuleActivated = (item: typeof NAV_ITEMS[0]): boolean => {
    const requiredModule = item.moduleId || NAV_TO_MODULE_MAP[item.id];
    if (!requiredModule) return true; // No module requirement - always visible
    if (isAdmin) return true; // Admins see all
    return activatedModuleIds.includes(requiredModule);
  };

  // Build nav items from NAV_ITEMS respecting user config and module activation
  const userNavItems = NAV_ITEMS
    .filter(item => isNavItemVisibleByNavConfig(item.id) && isModuleActivated(item))
    .sort((a, b) => {
      const aIndex = navConfig.order.indexOf(a.id);
      const bIndex = navConfig.order.indexOf(b.id);
      // Items not in order go to the END (use a large number)
      const aSort = aIndex === -1 ? 9999 : aIndex;
      const bSort = bIndex === -1 ? 9999 : bIndex;
      return aSort - bSort;
    });

  // Use permission-filtered navigation for admin users (combines role + permission checks)
  const filteredNavigation = isAdmin ? permissionFilteredNav : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Dashboard"
            >
              <SparkIcon variant="holiday" size={48} animated pose="waving" />
              <span className="text-white text-2xl font-bold">Seeksy</span>
            </button>
          )}
          {collapsed && (
            <button 
              onClick={handleLogoClick}
              className="flex items-center justify-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Dashboard"
            >
              <SparkIcon variant="holiday" size={32} animated pose="idle" />
            </button>
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
        {/* All top-level items are flush-left with identical visual hierarchy */}
        {!isAdmin && (
          <SidebarMenu className="px-2">
            {userNavItems.map((item) => {
              const Icon = ICON_MAP[item.id] || LayoutDashboard;
              const isPinned = navConfig.pinned.includes(item.id);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isOpen = openGroups[item.id] ?? false;
              
              // My Workspaces - shows workspaces as sub-items (navigates to workspace dashboard)
              if (item.id === 'my_workspaces' && customPackages.length > 0) {
                return (
                  <div key={item.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(item.id)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="w-full justify-between hover:bg-white/10 text-white">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-white" />
                              {!collapsed && <span className="font-medium text-white">{item.label}</span>}
                            </div>
                            {!collapsed && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {customPackages.map((pkg) => (
                            <SidebarMenuItem key={pkg.id}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={`/workspace?id=${pkg.id}`}
                                  className="flex items-center justify-between text-white/80 text-sm py-1.5"
                                  activeClassName="text-white bg-white/10"
                                >
                                  <span className="truncate">{pkg.name}</span>
                                  {pkg.is_default && <span className="text-amber-400 text-xs">⭐</span>}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              
              // Active Apps - shows activated modules as sub-items
              if (item.id === 'active_apps' && activatedModuleIds.length > 0) {
                return (
                  <div key={item.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(item.id)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="w-full justify-between hover:bg-white/10 text-white">
                            <div className="flex items-center gap-3">
                              <Zap className="h-4 w-4 shrink-0 text-green-400" />
                              {!collapsed && (
                                <>
                                  <span className="font-medium text-white">{item.label}</span>
                                  <span className="text-xs text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                                    {activatedModuleIds.length}
                                  </span>
                                </>
                              )}
                            </div>
                            {!collapsed && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {activatedModuleIds.map((moduleId) => {
                            const ModuleIcon = MODULE_ICON_MAP[moduleId] || Zap;
                            const moduleName = MODULE_NAME_MAP[moduleId] || moduleId;
                            const moduleRoute = MODULE_ROUTE_MAP[moduleId] || `/apps?category=active`;
                            
                            return (
                              <SidebarMenuItem key={moduleId}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={moduleRoute}
                                    className="flex items-center gap-2 text-white/80 text-sm py-1.5"
                                    activeClassName="text-white bg-white/10"
                                  >
                                    <ModuleIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{moduleName}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              
              // Hide Active Apps if no modules activated
              if (item.id === 'active_apps' && activatedModuleIds.length === 0) {
                return null;
              }
              
              // Items WITH sub-items - collapsible with chevron
              if (hasSubItems) {
                const subItemConfigs = navConfig.subItems?.[item.id] || [];
                const visibleSubItems = item.subItems!.filter(sub => {
                  const config = subItemConfigs.find(c => c.id === sub.id);
                  return !config || config.visible !== false;
                });
                
                return (
                  <div key={item.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(item.id)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuItem>
                          <SidebarMenuButton className="w-full justify-between hover:bg-white/10 text-white">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0 text-white" />
                              {!collapsed && <span className="font-medium text-white">{item.label}</span>}
                            </div>
                            {!collapsed && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {visibleSubItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.id}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={subItem.path}
                                  className="text-white/80 text-sm py-1.5"
                                  activeClassName="text-white bg-white/10"
                                >
                                  <span className="truncate">{subItem.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }
              
              // Items WITHOUT sub-items - simple top-level link (flush left, no chevron)
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className="flex items-center justify-between hover:bg-white/10 text-white"
                      activeClassName="bg-primary/20 text-white"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-white" />
                        {!collapsed && <span className="font-medium text-white">{item.label}</span>}
                      </div>
                      {!collapsed && isPinned && <span className="text-amber-400 text-xs">★</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
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
                        
                        // Special handling for Ask Spark - opens AI panel
                        if (item.path === '#ask-spark') {
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton 
                                tooltip={collapsed ? item.label : undefined}
                                onClick={() => window.dispatchEvent(new Event('openSparkChat'))}
                                className="flex items-center gap-3 transition-all duration-150 cursor-pointer"
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }
                        
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
