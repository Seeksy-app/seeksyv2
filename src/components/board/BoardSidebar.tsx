import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  LogOut,
  BarChart3,
  Calculator,
  DollarSign,
  Sword,
  ChartPie,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// OVERVIEW section - simplified
const overviewItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/board',
  },
];

// BUSINESS STRATEGY section - cleaned up, Market Intelligence merged into GTM
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
];

// FINANCIALS section - expanded with new tabs
const financialItems = [
  {
    id: 'state-of-company',
    label: 'State of the Company',
    icon: BarChart3,
    path: '/board/state-of-company',
    isAI: true,
  },
  {
    id: 'proforma',
    label: 'AI-Powered 3-Year Pro Forma',
    icon: TrendingUp,
    path: '/board/forecasts',
  },
  {
    id: 'revenue-insights',
    label: 'Revenue Insights',
    icon: DollarSign,
    path: '/board/revenue-insights',
  },
  {
    id: 'roi-calculator',
    label: 'ROI Calculator',
    icon: Calculator,
    path: '/board/roi-calculator',
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
    if (item.path === '/board/proforma' && location.pathname.startsWith('/board/proforma')) {
      return true;
    }
    return location.pathname === item.path;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    // External links open in new tab
    if (item.external && item.path) {
      return (
        <SidebarMenuItem key={item.id}>
          <a
            href={item.path}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 px-3 py-2.5',
              'text-foreground hover:bg-accent',
              'text-[13px] font-medium'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{item.label}</span>
          </a>
        </SidebarMenuItem>
      );
    }

    // Internal links use Link component for client-side navigation
    if (item.path) {
      return (
        <SidebarMenuItem key={item.id}>
          <Link
            to={item.path}
            data-tour={item.id === 'dashboard' ? 'nav-dashboard' : item.id === 'swot' ? 'nav-swot' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 px-3 py-2.5',
              'text-[13px] font-medium tracking-normal',
              'text-foreground',
              'hover:bg-accent',
              isActive && 'bg-accent font-semibold'
            )}
          >
            <Icon className={cn(
              "w-4 h-4 flex-shrink-0",
              item.isAI ? "text-yellow-500" : isActive ? "text-foreground" : "text-muted-foreground"
            )} />
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
        </SidebarMenuItem>
      );
    }

    // Items without paths (e.g., action items)
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => handleNavigation(item)}
          data-tour={item.id === 'dashboard' ? 'nav-dashboard' : item.id === 'swot' ? 'nav-swot' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 px-3 py-2.5',
            'text-foreground hover:bg-accent',
            'text-[13px] font-medium',
            isActive && 'bg-accent font-semibold'
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0",
            item.isAI ? "text-yellow-500" : isActive ? "text-foreground" : "text-muted-foreground"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => (
    <SidebarGroup className={cn("py-1", className)}>
      <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-0.5">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-0">
        {items.map(renderNavItem)}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-background w-[16rem] flex-shrink-0 antialiased font-sans">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Seeksy</h2>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business Strategy', businessItems, 'mt-0.5')}
        {renderSection('Financials', financialItems, 'mt-0.5')}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border space-y-0.5">
        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-foreground hover:bg-accent text-sm font-medium py-1.5"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-medium py-1.5"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
