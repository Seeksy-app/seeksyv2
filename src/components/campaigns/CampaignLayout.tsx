import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  PenTool, 
  Users, 
  Globe,
  Menu,
  ChevronLeft,
  LogOut,
  Mail,
  Phone,
  Video,
  DollarSign
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CampaignAuthModal } from "./CampaignAuthModal";

// Updated brand colors - lighter Federal Benefits theme
const colors = {
  background: "#F7F9FC",
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  primary: "#003A9E",
  secondary: "#1A73E8",
  accent: "#FFD764",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
};

interface CampaignLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/campaigns/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/campaigns/ai-manager", label: "AI Manager", icon: MessageSquare },
  { path: "/campaigns/studio", label: "Content Studio", icon: PenTool },
  { path: "/campaigns/outreach", label: "Outreach", icon: Users },
  { path: "/campaigns/email", label: "Email", icon: Mail },
  { path: "/campaigns/sms", label: "SMS", icon: Phone },
  { path: "/campaigns/live", label: "Live Stream", icon: Video },
  { path: "/campaigns/donations", label: "Donations", icon: DollarSign },
  { path: "/campaigns/site-builder", label: "Site Builder", icon: Globe },
];

export function CampaignLayout({ children }: CampaignLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/campaigns");
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              isActive
                ? "text-white"
                : "hover:bg-white/10"
            }`}
            style={{
              backgroundColor: isActive ? colors.accent : "transparent",
              color: isActive ? colors.textDark : "white",
            }}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          backgroundColor: colors.primary,
          borderColor: "rgba(255,255,255,0.1)"
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/campaigns" className="flex items-center gap-2 flex-shrink-0">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <span style={{ color: colors.primary }} className="font-bold text-lg">C</span>
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">
                Campaign<span style={{ color: colors.accent }}>Staff</span>.ai
              </span>
            </Link>

            {/* Desktop Nav - Scrollable */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto flex-1 justify-center max-w-4xl">
              <NavLinks />
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user ? (
                <>
                  <Button
                    asChild
                    size="sm"
                    className="font-medium hidden sm:flex"
                    style={{ backgroundColor: colors.accent, color: colors.textDark }}
                  >
                    <Link to="/campaigns/ai-manager">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Talk to AI
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  size="sm"
                  className="font-medium"
                  style={{ backgroundColor: colors.accent, color: colors.textDark }}
                >
                  Sign In
                </Button>
              )}

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-64"
                  style={{ backgroundColor: colors.primary, borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center gap-2 mb-8">
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <span style={{ color: colors.primary }} className="font-bold">C</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      CampaignStaff
                    </span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <NavLinks />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Back button */}
      <div className="container mx-auto px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          style={{ color: colors.textMuted }}
          className="hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 pb-12">
        {children}
      </main>

      {/* Auth Modal */}
      <CampaignAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
