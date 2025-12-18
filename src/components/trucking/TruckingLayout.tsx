import { useState, ReactNode, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Truck, 
  LayoutDashboard, 
  PackageSearch, 
  BookUser,
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Sun,
  Moon,
  Shield,
  Calculator
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTruckingCostStats } from "@/hooks/useTruckingCostStats";
import { useTruckingRole } from "@/hooks/trucking/useTruckingRole";
import { useTheme } from "next-themes";
import seeksyLogo from "@/assets/seeksy-logo-orange.png";

// Theme colors for dark sidebar
const theme = {
  sidebar: {
    bg: '#0B1220',
    border: '#1E293B',
    hover: '#1E293B',
    active: '#1E3A5F',
  },
  accent: {
    yellow: '#FBBF24',
    blue: '#3B82F6',
    green: '#22C55E',
    red: '#EF4444',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
};

// Base nav items - filtered based on role (removed Settings - now in user dropdown)
const allNavItems = [
  { label: "Load Board", href: "/trucking/dashboard", icon: LayoutDashboard, ownerOnly: false },
  { label: "Loads", href: "/trucking/loads", icon: PackageSearch, ownerOnly: false },
  { label: "Call Logs", href: "/trucking/call-logs", icon: ClipboardList, ownerOnly: false },
  { label: "AI Call Analytics", href: "/trucking/ai-analytics", icon: BarChart3, ownerOnly: true },
  { label: "Analytics", href: "/trucking/analytics", icon: TrendingUp, ownerOnly: true },
  { label: "Contacts", href: "/trucking/contacts", icon: BookUser, ownerOnly: false },
];

// Admin nav items - only shown for owners
const adminNavItems = [
  { label: "Users", href: "/trucking/admin/users", icon: Shield },
  { label: "Rate Preferences", href: "/trucking/admin/rate-preferences", icon: Calculator },
];

interface TruckingLayoutProps {
  children?: ReactNode;
}

export default function TruckingLayout({ children }: TruckingLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme: appTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const costStats = useTruckingCostStats();
  const { isOwner, isAuthorized, loading: roleLoading } = useTruckingRole();

  // Filter nav items based on role
  const navItems = allNavItems.filter(item => !item.ownerOnly || isOwner);

  // Redirect unauthorized users
  useEffect(() => {
    if (!roleLoading && !isAuthorized && user) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have access to the AITrucking system. Please contact an admin for an invitation.",
        variant: "destructive"
      });
      navigate("/trucking");
    }
  }, [roleLoading, isAuthorized, user, navigate, toast]);

  const formatCost = (cost: number) => {
    if (cost === 0) return "—";
    if (cost < 0.01) return "< $0.01";
    return `$${cost.toFixed(2)}`;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setProfileImageUrl(user?.user_metadata?.profile_image_url || null);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/trucking");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "DL";

  // Show loading while checking authorization
  if (roleLoading || (user && !isAuthorized)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: theme.sidebar.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
          <span className="text-white text-sm">Checking access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: theme.sidebar.bg }}>
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex fixed top-0 left-0 z-40 h-full flex-col transition-all duration-200",
          collapsed ? "w-[72px]" : "w-64"
        )}
        style={{ backgroundColor: theme.sidebar.bg, borderRight: `1px solid ${theme.sidebar.border}` }}
      >
        {/* Top: brand + collapse */}
        <div 
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: `1px solid ${theme.sidebar.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: theme.sidebar.hover }}
            >
              <img src={seeksyLogo} alt="Seeksy" className="h-8 w-8 object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate" style={{ color: theme.text.primary }}>
                  AITrucking
                </span>
                <span className="text-xs truncate" style={{ color: theme.text.muted }}>
                  D and L Transport
                </span>
                <span className="text-xs" style={{ color: theme.text.muted }}>
                  (888) 785-7499
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTheme(appTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: theme.text.secondary }}
              title={appTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {appTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: theme.text.secondary }}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    collapsed && "justify-center px-2"
                  )
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? theme.sidebar.active : 'transparent',
                  color: isActive ? theme.text.primary : theme.text.secondary,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      className="h-5 w-5 flex-shrink-0" 
                      style={{ color: isActive ? theme.accent.blue : theme.text.muted }} 
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin Section */}
          {isOwner && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-2 px-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text.muted }}>
                    Admin
                  </span>
                </div>
              )}
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        collapsed && "justify-center px-2"
                      )
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? theme.sidebar.active : 'transparent',
                      color: isActive ? theme.text.primary : theme.text.secondary,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          className="h-5 w-5 flex-shrink-0" 
                          style={{ color: isActive ? theme.accent.yellow : theme.text.muted }} 
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom: live indicator + profile */}
        <div 
          className="px-3 py-4 space-y-3"
          style={{ borderTop: `1px solid ${theme.sidebar.border}` }}
        >
          {/* AI Live indicator */}
          {!collapsed && (
            <div 
              className="flex flex-col gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: theme.sidebar.hover }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: theme.text.muted }}>
                  <span className="relative flex h-2 w-2">
                    <span 
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: `${theme.accent.green}70` }}
                    />
                    <span 
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.accent.green }}
                    />
                  </span>
                  <span style={{ color: theme.text.secondary }}>AI Calls Live</span>
                </div>
                <span 
                  className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium"
                  style={{ backgroundColor: theme.sidebar.bg, color: theme.accent.yellow }}
                >
                  Jess
                </span>
              </div>
              {/* Cost Estimate - Owner only */}
              {isOwner && (
                <div 
                  className="flex items-center justify-between pt-2 mt-1"
                  style={{ borderTop: `1px solid ${theme.sidebar.border}` }}
                >
                  <span className="text-[11px]" style={{ color: theme.text.muted }}>Est. Cost/Mo</span>
                  <span className="text-xs font-medium" style={{ color: theme.accent.yellow }}>
                    {costStats.loading ? "..." : formatCost(costStats.totalCostThisMonth)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-white/5",
                  collapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback 
                    className="text-white text-xs font-medium"
                    style={{ backgroundColor: theme.accent.blue }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: theme.text.primary }}>
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: theme.text.muted }}>D and L Transport</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <NavLink to="/trucking/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/trucking/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between"
        style={{ backgroundColor: theme.sidebar.bg, borderBottom: `1px solid ${theme.sidebar.border}` }}
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div 
              className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: theme.sidebar.hover }}
            >
              <img src={seeksyLogo} alt="Seeksy" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-semibold text-white">AITrucking</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                <AvatarFallback style={{ backgroundColor: theme.accent.blue }} className="text-white text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <NavLink to="/trucking/profile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/trucking/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-30 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside 
            className="lg:hidden fixed top-16 left-0 z-40 h-[calc(100%-4rem)] w-64"
            style={{ backgroundColor: theme.sidebar.bg }}
          >
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? theme.sidebar.active : 'transparent',
                      color: isActive ? theme.text.primary : theme.text.secondary,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: isActive ? theme.accent.blue : theme.text.muted }} 
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content Area - Light background */}
      <main 
        className={cn(
          "flex-1 min-h-screen pt-16 lg:pt-0 overflow-y-auto transition-all duration-200",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64"
        )}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        {/* Top Header Bar - Desktop */}
        <div 
          className="hidden lg:flex items-center justify-end px-6 py-3 border-b bg-white/80 backdrop-blur sticky top-0 z-30"
          style={{ borderColor: '#E2E8F0' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-slate-100">
                <Avatar className="h-10 w-10 border-2 border-blue-500/20">
                  <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.email?.split('@')[0] || 'seeksytrucking'}
                  </p>
                  <p className="text-xs text-slate-500">D and L Transport</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <NavLink to="/trucking/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/trucking/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

// Export theme for use in other trucking components
export { theme as truckingTheme };
