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
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface RoleBasedSidebarProps {
  user?: User | null;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  home: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  user: UserIcon,
  settings: Settings,
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
};

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
  const { roles, isLoading } = useUserRoles();
  const { activeAccountType } = useAccountType();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Track which collapsible groups are open - collapsed by default for admin sections
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Email": true,
    "Marketing": true,
    "Media": true,
    "Admin": false,
    "Content Management": false,
    "User Management": false,
    "Identity & Certification": false,
    "Advertising & Revenue": false,
    "Business Operations": false,
    "Developer Tools": false,
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  if (!user || isLoading) {
    return null;
  }

  // Filter navigation based on user's roles and account type
  let filteredNavigation = filterNavigationByRoles(
    NAVIGATION_CONFIG.navigation,
    roles
  );

  // Additional filtering based on active account type
  if (activeAccountType === 'advertiser') {
    // Advertisers only see advertiser-specific sections
    filteredNavigation = filteredNavigation.filter(group => 
      ['Seeksy OS', 'Admin'].includes(group.group) || 
      group.items.some(item => item.path.includes('advertiser'))
    );
  } else if (activeAccountType === 'podcaster') {
    // Podcasters see creator tools focused on podcasting
    filteredNavigation = filteredNavigation.filter(group => 
      !group.group.includes('Advertiser')
    );
  }

  return (
    <Sidebar collapsible="icon">
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

      <SidebarContent className="pb-6">
        {filteredNavigation.map((group) => {
          // Main navigation items are not collapsible
          if (!group.collapsible) {
            return (
              <SidebarGroup key={group.group}>
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
            );
          }

          // Collapsible sections (Email, Marketing, Admin groups)
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
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* Ask Spark at bottom - Enhanced visibility */}
        <SidebarGroup className="mt-auto mb-4">
          <SidebarGroupContent>
            <SidebarMenu>
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
                    <span className="text-base font-semibold text-white flex-1">Ask Spark</span>
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
