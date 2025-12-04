/**
 * Role-based sidebar using user nav_config as primary source of truth
 * 
 * Hierarchy:
 * 1. User nav_config (order, visibility, pinned) - from useNavPreferences
 * 2. Module activation state (user_modules table)
 * 3. Role permissions
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
import { SparkIcon } from "@/components/spark/SparkIcon";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { useNavPreferences, NAV_ITEMS } from "@/hooks/useNavPreferences";

interface RoleBasedSidebarProps {
  user?: User | null;
}

// Mapping of nav item IDs (from useNavPreferences) to module IDs that must be activated
const NAV_TO_MODULE_MAP: Record<string, string> = {
  'meetings': 'meetings',
  'studio': 'studio',
  'podcasts': 'podcasts',
  'media': 'content-library',
  'brand_campaigns': 'brand-campaigns',
  'revenue_tracking': 'revenue-tracking',
  'social_analytics': 'social-analytics',
};

// Legacy mapping from old navigation config
const MODULE_ACTIVATION_MAP: Record<string, string> = {
  'studio_hub': 'studio',
  'audio_studio': 'studio',
  'video_studio': 'studio',
  'studio_clips': 'studio',
  'media_library': 'content-library',
  'studio_templates': 'studio',
  'media_podcasts': 'podcasts',
  'marketing_monetization': 'revenue-tracking',
  'meetings': 'meetings',
};

// Nav items to completely hide
const HIDDEN_NAV_ITEMS = [
  'social_analytics',
];

// Icon mapping - includes both nav item IDs and icon names
const ICON_MAP: Record<string, any> = {
  // Nav item IDs from useNavPreferences
  'my_day': Calendar,
  'dashboard': LayoutDashboard,
  'creator_hub': Rocket,
  'meetings': Calendar,
  'studio': Video,
  'podcasts': Podcast,
  'media': FolderOpen,
  'brand_campaigns': Megaphone,
  'revenue_tracking': DollarSign,
  'content_library': Library,
  'social_analytics': BarChart2,
  'settings': Settings,
  // Legacy icon names
  home: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  user: UserIcon,
  link: Network,
  apps: Grid3x3,
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
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const { activeAccountType } = useAccountType();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { activatedModuleIds, isLoading: modulesLoading } = useModuleActivation();
  const { navConfig, isLoading: navLoading } = useNavPreferences();
  
  // Use persisted sidebar state with localStorage
  const { openGroups, toggleGroup, isGroupOpen } = useSidebarState();

  if (!user || rolesLoading || navLoading) {
    return null;
  }

  // Check if a nav item should be visible based on:
  // 1. nav_config.hidden (user preference)
  // 2. Module activation state
  // 3. Role permissions
  const isNavItemVisibleByNavConfig = (itemId: string): boolean => {
    // Check if hidden in nav_config
    if (navConfig.hidden.includes(itemId)) {
      return false;
    }
    
    // Check module activation requirement
    const requiredModule = NAV_TO_MODULE_MAP[itemId];
    if (requiredModule) {
      // Admin roles see everything
      if (roles.includes('admin') || roles.includes('super_admin')) return true;
      // Check if module is activated
      if (!activatedModuleIds.includes(requiredModule)) return false;
    }
    
    return true;
  };

  // Legacy check for old navigation config items
  const isNavItemVisible = (itemId: string): boolean => {
    if (HIDDEN_NAV_ITEMS.includes(itemId)) return false;
    
    const requiredModule = MODULE_ACTIVATION_MAP[itemId];
    if (!requiredModule) return true;
    if (roles.includes('admin') || roles.includes('super_admin')) return true;
    return activatedModuleIds.includes(requiredModule);
  };

  // Build nav items from NAV_ITEMS (useNavPreferences) respecting user config
  const userNavItems = NAV_ITEMS
    .filter(item => isNavItemVisibleByNavConfig(item.id))
    .sort((a, b) => {
      const aIndex = navConfig.order.indexOf(a.id);
      const bIndex = navConfig.order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  // Filter original navigation config for collapsible sections (Email, Marketing, Admin)
  let filteredNavigation = filterNavigationByRoles(
    NAVIGATION_CONFIG.navigation,
    roles
  );

  filteredNavigation = filteredNavigation.map(group => ({
    ...group,
    items: group.items.filter(item => isNavItemVisible(item.id))
  })).filter(group => group.items.length > 0);

  if (activeAccountType === 'advertiser') {
    filteredNavigation = filteredNavigation.filter(group => 
      ['Seeksy OS', 'Admin'].includes(group.group) || 
      group.items.some(item => item.path.includes('advertiser'))
    );
  } else if (activeAccountType === 'podcaster') {
    filteredNavigation = filteredNavigation.filter(group => 
      !group.group.includes('Advertiser')
    );
  }

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
        {/* User-configured nav items from useNavPreferences */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNavItems.map((item) => {
                const Icon = ICON_MAP[item.id] || ICON_MAP[item.path?.replace('/', '')] || LayoutDashboard;
                const isPinned = navConfig.pinned.includes(item.id);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined}>
                      <NavLink
                        to={item.path}
                        className="flex items-center gap-3 transition-all duration-150"
                        activeClassName="nav-active"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex items-center gap-2 flex-1">
                            <span className="truncate">{item.label}</span>
                            {isPinned && <span className="pinned-star text-amber-400 text-xs">★</span>}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Legacy collapsible sections from navigation config */}
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
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors flex items-center justify-between text-white font-semibold text-sm px-3 py-2">
                    <span>{group.group}</span>
                    {!collapsed && (
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
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
