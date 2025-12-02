import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { 
    label: "Features", 
    href: "#features",
    submenu: [
      { label: "Studio", href: "#studio" },
      { label: "Booking", href: "#booking" },
      { label: "Analytics", href: "#analytics" },
      { label: "Media Kit", href: "#mediakit" },
      { label: "Identity", href: "#identity" },
    ]
  },
  { label: "Studio", href: "/studio" },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/help" },
];

export function TopNavigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
              Seeksy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative group"
                onMouseEnter={() => link.submenu && setActiveSubmenu(link.label)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  onClick={() => scrollToSection(link.href)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {link.label}
                  {link.submenu && <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                
                {/* Submenu */}
                {link.submenu && activeSubmenu === link.label && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px]">
                      {link.submenu.map((subLink) => (
                        <button
                          key={subLink.label}
                          onClick={() => {
                            scrollToSection(subLink.href);
                            setActiveSubmenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {subLink.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth?mode=login")}
              className="text-white/80 hover:text-white hover:bg-white/5"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange text-slate-900 font-semibold hover:opacity-90 shadow-lg shadow-brand-gold/20"
            >
              Start Free
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-[400px] pb-6" : "max-h-0"
        )}>
          <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/auth?mode=login");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center text-white/80 hover:text-white"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  navigate("/auth?mode=signup");
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-brand-gold to-brand-orange text-slate-900 font-semibold"
              >
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
