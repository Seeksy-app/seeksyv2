import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ModuleCenterModal } from "@/components/modules";
import { SparkMascot } from "@/components/myday/SparkMascot";
import {
  Bell,
  MoreHorizontal,
  Settings,
  HelpCircle,
  CreditCard,
  Layers,
  LifeBuoy,
  LogOut,
  User,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function GlobalTopNav() {
  const navigate = useNavigate();
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[hsl(var(--header-background))] border-b border-white/10 shadow-lg">
        {/* Taller header with more vertical breathing room */}
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left section - Spark Mascot & Logo */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-[hsl(var(--header-foreground))] hover:bg-white/10" />
            
            {/* Spark Mascot + Seeksy branding */}
            <div className="flex items-center gap-2">
              <SparkMascot size="sm" animate />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-[hsl(var(--header-foreground))]" />
                </div>
                <span className="font-semibold text-[hsl(var(--header-foreground))] hidden sm:inline">
                  Seeksy
                </span>
              </div>
            </div>
          </div>

          {/* Center section - Search with more breathing room */}
          <div className="flex-1 max-w-lg mx-6">
            <GlobalSearch />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1.5">
            {/* Ask Seeksy AI Chat button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="text-[hsl(var(--header-foreground))] hover:bg-white/10 gap-2 hidden sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ask Seeksy</span>
            </Button>
            
            {/* Mobile AI button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAIChat(true)}
              className="text-[hsl(var(--header-foreground))] hover:bg-white/10 sm:hidden"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-[hsl(var(--header-foreground))] hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            
            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--header-foreground))] hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowModuleCenter(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  App Store
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
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-[hsl(var(--header-foreground))] hover:bg-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="h-4 w-4" />
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
      
      {/* Module Center Modal */}
      <ModuleCenterModal 
        isOpen={showModuleCenter} 
        onClose={() => setShowModuleCenter(false)} 
      />
      
      {/* AI Chat - using Sheet pattern */}
      {showAIChat && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAIChat(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl animate-slide-in-right">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Ask Seeksy</h2>
                <p className="text-xs text-muted-foreground">Your AI co-pilot</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAIChat(false)}>
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>AI Assistant coming soon</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
