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
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
            'text-slate-300 hover:bg-slate-700/50 hover:text-white',
            'text-[15px] font-medium',
            isActive && 'bg-blue-600/20 text-blue-400 font-semibold hover:bg-blue-600/30 hover:text-blue-300'
          )}
        >
          <Icon className={cn(
            "w-[18px] h-[18px] flex-shrink-0",
            isActive ? "text-blue-400" : "text-slate-400"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => (
    <SidebarGroup className={className}>
      <SidebarGroupLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map(renderNavItem)}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-slate-700/50 bg-slate-900">
      <SidebarHeader className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Seeksy</h2>
            <p className="text-xs text-slate-400 font-medium">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business', businessItems, 'mt-5')}
        {renderSection('Financials', financialItems, 'mt-5')}
        {renderSection('Competitive & Strategy', strategyItems, 'mt-5')}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-700/50 space-y-2">
        {/* Board AI Analyst Entry */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 font-semibold"
          onClick={() => window.dispatchEvent(new CustomEvent('openBoardAIChat'))}
        >
          <Sparkles className="w-4 h-4" />
          Board AI Analyst
        </Button>

        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
