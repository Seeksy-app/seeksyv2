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
    path: '/board/gtm?tab=key-metrics',
  },
  {
    id: 'roi-calculator',
    label: 'ROI Calculator',
    icon: Calculator,
    path: '/board/gtm?tab=roi-calculator',
  },
  {
    id: 'revenue-insights',
    label: 'Revenue Insights',
    icon: DollarSign,
    path: '/board/revenue-insights',
  },
];

// Competitive & Strategy section
const strategyItems = [
  {
    id: 'competitive',
    label: 'Competitive Landscape',
    icon: Sword,
    path: '/board/gtm?tab=competitive-landscape',
  },
  {
    id: 'swot',
    label: 'SWOT Analysis',
    icon: ChartPie,
    path: '/board/gtm?tab=swot-analysis',
  },
  {
    id: 'market-intel',
    label: 'Market Intelligence',
    icon: Globe,
    path: '/board/market-intelligence',
  },
];

type NavItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
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
    navigate(item.path);
  };

  const isItemActive = (item: NavItem) => {
    if (!item.path) return false;
    
    // Handle query string paths
    if (item.path.includes('?')) {
      const [basePath, query] = item.path.split('?');
      const currentUrl = location.pathname + location.search;
      return currentUrl === item.path || 
             (location.pathname === basePath && location.search.includes(query));
    }
    
    return location.pathname === item.path;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => handleNavigation(item)}
          className={cn(
            'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg transition-all duration-200',
            'text-slate-300/90 hover:bg-slate-700/60 hover:text-white',
            'text-[15px] font-medium tracking-wide',
            isActive && 'bg-blue-500/25 text-blue-300 font-semibold hover:bg-blue-500/35 hover:text-blue-200 shadow-sm'
          )}
        >
          <Icon className={cn(
            "w-[18px] h-[18px] flex-shrink-0 transition-all duration-200",
            isActive ? "text-blue-300" : "text-slate-400 group-hover:text-slate-300"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => (
    <SidebarGroup className={className}>
      <SidebarGroupLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-3.5 mb-2.5">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map(renderNavItem)}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-slate-700/50 bg-slate-900">
      <SidebarHeader className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Seeksy</h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business', businessItems, 'mt-6')}
        {renderSection('Financials', financialItems, 'mt-6')}
        {renderSection('Competitive & Strategy', strategyItems, 'mt-6')}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-700/50 space-y-2">
        {/* Board AI Analyst Entry */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 font-semibold text-[15px] py-3"
          onClick={() => window.dispatchEvent(new CustomEvent('openBoardAIChat'))}
        >
          <Sparkles className="w-[18px] h-[18px]" />
          Board AI Analyst
        </Button>

        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2.5 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white text-[15px] py-3"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-[18px] h-[18px]" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-[15px] py-3"
          onClick={handleLogout}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
