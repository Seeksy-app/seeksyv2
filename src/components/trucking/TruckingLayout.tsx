import { useState, ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  PhoneCall,
  Users, 
  BookUser,
  Network,
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

// Theme colors
const theme = {
  sidebar: {
    bg: '#061022',
    border: '#0f1c3a',
  },
  page: {
    bg: '#050814',
  },
  card: {
    bg: '#0b1730',
    border: '#1a2745',
  },
  accent: {
    yellow: '#FBBF24',
    blue: '#3B82F6',
    green: '#22C55E',
    red: '#EF4444',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
  },
};

const navItems = [
  { label: "Dashboard", href: "/trucking/dashboard", icon: LayoutDashboard },
  { label: "Loads", href: "/trucking/loads", icon: PackageSearch },
  { label: "Carrier Leads", href: "/trucking/leads", icon: PhoneCall },
  { label: "Carriers", href: "/trucking/carriers", icon: Users },
  { label: "Contacts", href: "/trucking/contacts", icon: BookUser },
  { label: "AI Console", href: "/trucking/console", icon: Network },
  { label: "Settings", href: "/trucking/settings", icon: Settings },
];

interface TruckingLayoutProps {
  children?: ReactNode;
}

export default function TruckingLayout({ children }: TruckingLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/trucking");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "DL";

  return (
    <div className="min-h-screen text-slate-50" style={{ backgroundColor: theme.page.bg }}>
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside 
          className={cn(
            "hidden lg:flex fixed top-0 left-0 z-40 h-full flex-col transition-all duration-200",
            collapsed ? "w-20" : "w-64"
          )}
          style={{ backgroundColor: theme.sidebar.bg, borderRight: `1px solid ${theme.sidebar.border}` }}
        >
          {/* Top: brand + collapse */}
          <div 
            className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: `1px solid ${theme.sidebar.border}` }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.card.bg }}
              >
                <span className="text-sm font-semibold" style={{ color: theme.accent.yellow }}>DL</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight" style={{ color: theme.text.primary }}>
                    AITrucking
                  </span>
                  <span className="text-xs" style={{ color: theme.text.muted }}>
                    D &amp; L Logistics
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ 
                backgroundColor: theme.page.bg, 
                border: `1px solid ${theme.card.border}`,
                color: theme.text.secondary
              }}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-3 flex-1 space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-white"
                        : "hover:text-white"
                    )
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? theme.card.bg : 'transparent',
                    border: isActive ? `1px solid ${theme.card.border}` : '1px solid transparent',
                    color: isActive ? theme.text.primary : theme.text.secondary,
                  })}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: theme.text.muted }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom: live indicator + profile */}
          <div 
            className="px-4 py-3 flex flex-col gap-3"
            style={{ borderTop: `1px solid ${theme.sidebar.border}` }}
          >
            {/* AI Live indicator */}
            {!collapsed && (
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
                  <span>AI Calls Live</span>
                </div>
                <span 
                  className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide"
                  style={{ backgroundColor: theme.card.bg, color: theme.text.secondary }}
                >
                  Jess
                </span>
              </div>
            )}
            
            {/* User profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors",
                    collapsed && "justify-center px-0"
                  )}
                  style={{ color: theme.text.secondary }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback 
                      className="text-white text-xs"
                      style={{ backgroundColor: theme.accent.blue }}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs" style={{ color: theme.text.muted }}>D & L Logistics</p>
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
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.card.bg }}
              >
                <span className="text-xs font-semibold" style={{ color: theme.accent.yellow }}>DL</span>
              </div>
              <span className="font-semibold text-white">AITrucking</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Avatar className="h-8 w-8">
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
              className="lg:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside 
              className="lg:hidden fixed top-16 left-0 z-40 h-[calc(100%-4rem)] w-64"
              style={{ backgroundColor: theme.sidebar.bg }}
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                          isActive ? "text-white" : "hover:text-white"
                        )
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? theme.card.bg : 'transparent',
                        border: isActive ? `1px solid ${theme.card.border}` : '1px solid transparent',
                        color: isActive ? theme.text.primary : theme.text.secondary,
                      })}
                    >
                      <Icon className="h-5 w-5" style={{ color: theme.text.muted }} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 min-h-screen pt-16 lg:pt-0 transition-all duration-200",
            collapsed ? "lg:ml-20" : "lg:ml-64"
          )}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Export theme for use in other trucking components
export { theme as truckingTheme };
