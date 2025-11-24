import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { SidebarTrigger } from "@/components/ui/sidebar";
import seeksyLogo from "@/assets/seeksy-logo.png";

interface HeaderProps {
  user?: User | null;
}

const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  // Hide header on profile pages when user is not logged in (shared links)
  const isProfilePage = location.pathname.match(/^\/[^\/]+$/);
  if (isProfilePage && !user) {
    return null;
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user && (
              <SidebarTrigger />
            )}
            <Link to="/" className="flex items-center gap-2">
              <img src={seeksyLogo} alt="Seeksy" className="h-10 w-10" />
              <span className="text-2xl font-bold text-primary">Seeksy</span>
            </Link>
          </div>

          <nav className="flex items-center gap-4">
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

