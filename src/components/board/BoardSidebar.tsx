import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Target,
  TrendingUp,
  Video,
  FileText,
  LogOut,
  BarChart3,
  Database,
  Settings,
  Users,
  Wallet,
  HeartPulse,
  Sparkles,
  Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Overview section
const overviewItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/board',
  },
  {
    id: 'videos',
    label: 'Investor Videos',
    icon: Video,
    path: '/board/videos',
  },
];

// Business section
const businessItems = [
  {
    id: 'business-model',
    label: 'Business Model',
    icon: Building2,
    path: '/board/business-model',
  },
  {
    id: 'gtm',
    label: 'GTM Strategy',
    icon: Target,
    path: '/board/gtm',
  },
  {
    id: 'forecasts',
    label: '3-Year Forecasts',
    icon: TrendingUp,
    path: '/board/forecasts',
  },
  {
    id: 'docs',
    label: 'Documents',
    icon: FileText,
    path: '/board/docs',
  },
  {
    id: 'investor-links',
    label: 'Shared Links',
    icon: Users,
    path: '/board/investor-links',
  },
];

// R&D & Intelligence section
const rdItems = [
  {
    id: 'rd-feeds',
    label: 'R&D Intelligence Feeds',
    icon: Database,
    path: '/board/rd-feeds',
    disabled: true,
  },
  {
    id: 'cfo-assumptions',
    label: 'CFO Assumptions',
    icon: Settings,
    path: '/board/cfo-assumptions',
    disabled: true,
  },
  {
    id: 'demo-toggle',
    label: 'Demo Data Toggle',
    icon: Sparkles,
    path: '/board/demo',
    disabled: true,
  },
];

// Coming Soon section
const comingSoonItems = [
  {
    id: 'cohort-reports',
    label: 'Creator Cohort Reports',
    icon: Users,
    disabled: true,
  },
  {
    id: 'acquisition-channels',
    label: 'Acquisition Channels',
    icon: BarChart3,
    disabled: true,
  },
  {
    id: 'revenue-explorer',
    label: 'Revenue Explorer',
    icon: Wallet,
    disabled: true,
  },
  {
    id: 'customer-health',
    label: 'Customer Health Panel',
    icon: HeartPulse,
    disabled: true,
  },
];

type NavItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  disabled?: boolean;
};

export function BoardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canToggleBoardView, toggleBoardView, isViewingAsBoard } = useBoardViewMode();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleExitBoardView = () => {
    toggleBoardView();
    navigate('/admin');
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = item.path && location.pathname === item.path;
    const Icon = item.icon;
    const isDisabled = item.disabled;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => !isDisabled && item.path && navigate(item.path)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
            isDisabled 
              ? 'text-slate-500 cursor-not-allowed'
              : 'text-white hover:bg-slate-800 hover:text-white',
            isActive && !isDisabled && 'bg-slate-800 text-blue-400 font-medium'
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0",
            isDisabled ? "text-slate-500" : isActive ? "text-blue-400" : "text-slate-300"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
          {isDisabled && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-700 text-slate-300 border-slate-600">
              Soon
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-slate-700 bg-slate-900">
      <SidebarHeader className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Seeksy</h2>
            <p className="text-xs text-slate-400">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
            Overview
          </SidebarGroupLabel>
          <SidebarMenu>
            {overviewItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Business Section */}
        <SidebarGroup className="mt-5">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
            Business
          </SidebarGroupLabel>
          <SidebarMenu>
            {businessItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* R&D & Intelligence Section */}
        <SidebarGroup className="mt-5">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
            R&D & Intelligence
          </SidebarGroupLabel>
          <SidebarMenu>
            {rdItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Coming Soon Section */}
        <SidebarGroup className="mt-5">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
            Coming Soon
          </SidebarGroupLabel>
          <SidebarMenu>
            {comingSoonItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-700 space-y-2">
        {/* Board AI Analyst Entry */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800"
          onClick={() => window.dispatchEvent(new CustomEvent('openBoardAIChat'))}
        >
          <Shield className="w-4 h-4" />
          Board AI Analyst
        </Button>

        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-slate-300 border-slate-600 bg-slate-800 hover:bg-slate-700 hover:text-white"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}