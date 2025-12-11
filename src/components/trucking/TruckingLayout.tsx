import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
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
  Gauge, 
  Package, 
  Users, 
  Inbox, 
  Sliders, 
  Bot,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/trucking/dashboard", icon: Gauge },
  { label: "Loads", href: "/trucking/loads", icon: Package },
  { label: "Carriers", href: "/trucking/carriers", icon: Users },
  { label: "Carrier Leads", href: "/trucking/leads", icon: Inbox },
  { label: "AI Console", href: "/trucking/console", icon: Bot },
  { label: "Settings", href: "/trucking/settings", icon: Sliders },
];

interface TruckingLayoutProps {
  children?: ReactNode;
}

export default function TruckingLayout({ children }: TruckingLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen" style={{ backgroundColor: '#F7F8FB' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-full w-64 flex-col" style={{ backgroundColor: '#1D3557' }}>
        {/* Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FF9F1C' }}>
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">AITrucking</span>
            <p className="text-xs text-white/60">D & L Logistics</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                style={isActive ? { backgroundColor: '#FF9F1C' } : undefined}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback style={{ backgroundColor: '#FF9F1C' }} className="text-white text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-white/60">D & L Logistics</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/trucking/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Link>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between border-b" style={{ backgroundColor: '#1D3557' }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white hover:bg-white/10">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF9F1C' }}>
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">AITrucking</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ backgroundColor: '#FF9F1C' }} className="text-white text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/trucking/profile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Link>
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
          <aside className="lg:hidden fixed top-16 left-0 z-40 h-[calc(100%-4rem)] w-64" style={{ backgroundColor: '#1D3557' }}>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    style={isActive ? { backgroundColor: '#FF9F1C' } : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
