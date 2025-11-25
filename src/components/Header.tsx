import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import seeksyLogo from "@/assets/seeksy-logo.png";
import { MasterSearch } from "@/components/MasterSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CreditBalance } from "@/components/credits/CreditBalance";

interface HeaderProps {
  user?: User | null;
}

const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const toggleTheme = () => {
    // Quick toggle between light and dark without saving to database
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Hide header on profile pages when user is not logged in (shared links)
  const isProfilePage = location.pathname.match(/^\/[^\/]+$/);
  if (isProfilePage && !user) {
    return null;
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user && (
              <SidebarTrigger />
            )}
          </div>

          {user && (
            <div className="flex-1 max-w-2xl">
              <MasterSearch />
            </div>
          )}

          <nav className="flex items-center gap-3">
            {user && (
              <>
                <CreditBalance />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                  ) : (
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                  )}
                </Button>
                <NotificationBell />
              </>
            )}
            {user ? (
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

