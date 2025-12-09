import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AccountTypeSwitcher } from "@/components/AccountTypeSwitcher";
import { StartOnboardingButton } from "@/components/onboarding/StartOnboardingButton";
import { DataModePill } from "@/components/data-mode/DataModePill";
import { DailyBriefButton } from "@/components/daily-brief/DailyBriefButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, RefreshCw, Settings } from "lucide-react";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try avatar_url first, then fall back to account_avatar_url
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, account_avatar_url, full_name, account_full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          // Use whichever avatar is available
          const avatar = profile.avatar_url || profile.account_avatar_url;
          setAvatarUrl(avatar);
          const name = profile.full_name || profile.account_full_name;
          const initials = name?.[0]?.toUpperCase() || 
            user.email?.[0]?.toUpperCase() || 'U';
          setUserInitials(initials);
        }
      }
    };
    fetchProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('profile-updated', handleProfileUpdate);

    // Subscribe to realtime changes on profiles table
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

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

  const openAIChat = () => {
    document.dispatchEvent(new Event('open-spark-assistant'));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[hsl(var(--header-background))] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--header-background))]/95">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Refresh"
          className="flex-shrink-0 text-[hsl(var(--header-foreground))] hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <SidebarTrigger className="flex-shrink-0 text-[hsl(var(--header-foreground))]" />
        
        <div className="flex-1 flex items-center justify-between gap-4">
          <GlobalSearch />
          
          <div className="flex items-center gap-2">
            {/* Data Mode Pill */}
            <DataModePill />
            
            {/* Ask Spark Button - Santa mascot with gold styling */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openAIChat}
              title="Ask Spark"
              className="hover:bg-white/10 p-1"
            >
              <SparkIcon variant="holiday" size={28} animated />
            </Button>
            
            <StartOnboardingButton />
            <DailyBriefButton audienceType="ceo" variant="ghost" size="sm" />
            <AccountTypeSwitcher />
            <ThemeToggle />
            <NotificationsBell />
            
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-[hsl(var(--header-foreground))] hover:bg-white/10 p-0">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={avatarUrl ? `${avatarUrl}?t=${Date.now()}` : undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/20 text-[hsl(var(--header-foreground))] text-xs font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  // Route to admin settings if on admin routes, otherwise regular settings
                  const isAdminRoute = location.pathname.startsWith('/admin');
                  navigate(isAdminRoute ? '/admin/profile-settings' : '/settings');
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
