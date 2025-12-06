import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { cn } from "@/lib/utils";
import {
  Home,
  CalendarDays,
  Clock,
  Bell,
  MoreHorizontal,
  Settings,
  HelpCircle,
  CreditCard,
  Layers,
  LifeBuoy,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, path, isActive, onClick }: NavItemProps) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={onClick || (() => navigate(path))}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function GlobalTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="mr-2" />
          
          {/* Main nav items */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavItem 
              icon={Home} 
              label="Home" 
              path="/" 
              isActive={isActive('/')}
            />
            <NavItem 
              icon={CalendarDays} 
              label="My Day" 
              path="/my-day" 
              isActive={isActive('/my-day')}
            />
            <NavItem 
              icon={Clock} 
              label="Recents" 
              path="/recents" 
              isActive={isActive('/recents')}
            />
          </nav>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
        {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/module-center')}>
                <Layers className="h-4 w-4 mr-2" />
                Module Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/billing')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/support')}>
                <LifeBuoy className="h-4 w-4 mr-2" />
                Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                <User className="h-4 w-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
