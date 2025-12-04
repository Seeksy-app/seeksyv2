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
  Share2,
  LineChart,
  Sparkles,
  Briefcase,
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
    disabled: true,
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
    disabled: true,
  },
];

// Sharing & Access section
const sharingItems = [
  {
    id: 'share-investor',
    label: 'Share With Investor',
    icon: Share2,
    path: '/board/gtm?tab=share-with-investor',
  },
  {
    id: 'investor-analytics',
    label: 'Investor Analytics',
    icon: LineChart,
    path: '/board/investor-links',
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

  const handleNavigation = (item: NavItem) => {
    if (item.disabled || !item.path) return;
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
    const isDisabled = item.disabled;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => handleNavigation(item)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
            isDisabled 
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground',
            isActive && !isDisabled && 'bg-primary/10 text-primary font-medium'
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0",
            isDisabled ? "text-muted-foreground/50" : isActive ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="flex-1 truncate">{item.label}</span>
          {isDisabled && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border">
              Soon
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderSection = (title: string, items: NavItem[], className?: string) => (
    <SidebarGroup className={className}>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map(renderNavItem)}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Seeksy</h2>
            <p className="text-xs text-muted-foreground">Board Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 overflow-y-auto">
        {renderSection('Overview', overviewItems)}
        {renderSection('Business', businessItems, 'mt-4')}
        {renderSection('Financials', financialItems, 'mt-4')}
        {renderSection('Competitive & Strategy', strategyItems, 'mt-4')}
        {renderSection('Sharing & Access', sharingItems, 'mt-4')}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border space-y-2">
        {/* Board AI Analyst Entry */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => window.dispatchEvent(new CustomEvent('openBoardAIChat'))}
        >
          <Sparkles className="w-4 h-4" />
          Board AI Analyst
        </Button>

        {canToggleBoardView && isViewingAsBoard && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleExitBoardView}
          >
            <LayoutDashboard className="w-4 h-4" />
            Exit Board View
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
