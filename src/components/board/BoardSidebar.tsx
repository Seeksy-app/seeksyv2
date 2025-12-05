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
  Calculator,
  DollarSign,
  Sword,
  ChartPie,
  Globe,
  Sparkles,
  Briefcase,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  {
    id: 'contacts',
    label: 'Board Contacts',
    icon: Users,
    path: '/board/contacts',
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
    id: 'ceo-vto',
    label: 'CEO VTO',
    icon: Briefcase,
    path: '/board/vto',
    external: true,
  },
  {
    id: 'docs',
    label: 'Documents',
    icon: FileText,
    path: '/board/docs',
  },
];

// Financials section
const financialItems = [
  {
    id: 'key-metrics',
    label: 'Key Metrics',
    icon: BarChart3,
    path: '/board/key-metrics',
  },
  {
    id: 'roi-calculator',
    label: 'ROI Calculator',
    icon: Calculator,
    path: '/board/roi-calculator',
  },
  {
    id: 'revenue-insights',
    label: 'Revenue Insights',
    icon: DollarSign,
    path: '/board/revenue-insights',
  },
  {
    id: 'proforma-combined',
    label: '3-Year Pro Forma (Combined)',
    icon: TrendingUp,
    path: '/cfo/proforma/combined',
  },
  {
    id: 'proforma-events',
    label: '3-Year Pro Forma (Events)',
    icon: TrendingUp,
    path: '/cfo/proforma/events-awards',
  },
];

// Competitive & Strategy section
const strategyItems = [
  {
    id: 'competitive',
    label: 'Competitive Landscape',
    icon: Sword,
    path: '/board/competitive-landscape',
  },
  {
    id: 'swot',
    label: 'SWOT Analysis',
    icon: ChartPie,
    path: '/board/swot',
  },
  {
    id: 'market-intel',
    label: 'Market Intelligence',
    icon: Globe,
    path: '/board/market-intel',
  },
];

// Tools section
const toolsItems = [
  {
    id: 'ai-analyst',
    label: 'Board AI Analyst',
    icon: Sparkles,
    path: '/board/ai-analyst',
    isAI: true,
  },
];

type NavItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  isAI?: boolean;
  external?: boolean;
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

  const handleNavigation = (item: NavItem) => {
    if (!item.path) return;
    if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
  };

  const isItemActive = (item: NavItem) => {
    if (!item.path) return false;
    return location.pathname === item.path;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => handleNavigation(item)}
          data-tour={item.id === 'dashboard' ? 'nav-dashboard' : item.id === 'swot' ? 'nav-swot' : undefined}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200',
            'text-white hover:bg-slate-800/40',
            'text-sm font-medium',
            isActive && 'bg-blue-500/30 font-semibold hover:bg-blue-500/40'
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0",
            item.isAI ? "text-yellow-400" : isActive ? "text-blue-300" : "text-slate-400"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => (
    <SidebarGroup className={cn("py-1", className)}>
      <SidebarGroupLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-0.5">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-0">
        {items.map(renderNavItem)}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-slate-700/50 bg-slate-900">
      <SidebarHeader className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Seeksy</h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business', businessItems, 'mt-0.5')}
        {renderSection('Financials', financialItems, 'mt-0.5')}
        {renderSection('Competitive & Strategy', strategyItems, 'mt-0.5')}
        {renderSection('Tools', toolsItems, 'mt-0.5')}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-slate-700/50 space-y-0.5">
        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white text-sm font-medium py-1.5"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-sm font-medium py-1.5"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}