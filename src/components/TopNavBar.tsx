import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CreditsBadge } from "@/components/CreditsBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AccountTypeSwitcher } from "@/components/AccountTypeSwitcher";
import { BoardViewToggle } from "@/components/board/BoardViewToggle";
import { StartOnboardingButton } from "@/components/onboarding/StartOnboardingButton";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Hide credits badge on admin and board routes
  const hideCredits = location.pathname.startsWith('/admin') || location.pathname.startsWith('/board');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out successfully" });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Refresh"
          className="flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <SidebarTrigger className="flex-shrink-0" />
        
        <div className="flex-1 flex items-center justify-between gap-4">
          <GlobalSearch />
          
          <div className="flex items-center gap-2">
            <StartOnboardingButton />
            <BoardViewToggle />
            <AccountTypeSwitcher />
            {!hideCredits && <CreditsBadge />}
            <ThemeToggle />
            <NotificationsBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
