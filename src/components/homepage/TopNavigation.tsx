import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, ChevronDown, Video, Scissors, Podcast, Calendar, 
  Users, Ticket, Trophy, DollarSign, Sparkles, ArrowRight,
  Mic, TrendingUp, Building2, Briefcase, UserCircle, LayoutGrid, Play
} from "lucide-react";
import { cn } from "@/lib/utils";

const coreTools = [
  { label: "Media AI Studio", href: "/studio", icon: Video, description: "Professional AI-powered recording & editing" },
  { label: "AI Clips Generator", href: "/studio/clips", icon: Scissors, description: "Auto-extract viral clips" },
  { label: "Podcast Hosting", href: "/podcasts", icon: Podcast, description: "Host & distribute your show" },
  { label: "Meetings & Scheduling", href: "/meetings", icon: Calendar, description: "Book guests & run consultations" },
  { label: "CRM + Messaging", href: "/contacts", icon: Users, description: "Manage contacts & outreach" },
  { label: "Events & Ticketing", href: "/events", icon: Ticket, description: "Host events & sell tickets" },
  { label: "Awards & Programs", href: "/awards", icon: Trophy, description: "Run recognition programs" },
  { label: "Monetization Tools", href: "/monetization", icon: DollarSign, description: "Earn from your content" },
];

const useCases = [
  { label: "For Podcasters", href: "/onboarding?persona=podcaster", icon: Mic, description: "Build, distribute & grow your show" },
  { label: "For Creators & Influencers", href: "/onboarding?persona=creator", icon: TrendingUp, description: "Create viral content & increase reach" },
  { label: "For Event Hosts", href: "/onboarding?persona=event_host", icon: Ticket, description: "Run live events and guest bookings" },
  { label: "For Agencies", href: "/onboarding?persona=agency", icon: Building2, description: "Manage multiple clients at scale" },
  { label: "For Businesses", href: "/onboarding?persona=business", icon: Briefcase, description: "Meetings, content & customer engagement" },
];

const simpleLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Apps & Tools", href: "/apps-and-tools" },
  { label: "About", href: "/about" },
];

export function TopNavigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFeaturesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    if (featuresOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [featuresOpen]);

  const handleNavigation = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
    setFeaturesOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F1A]/95 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Seeksy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Features Mega-Menu */}
            <div
              ref={menuRef}
              className="relative"
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <button 
                className={cn(
                  "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  featuresOpen 
                    ? "text-white bg-white/10" 
                    : "text-white/80 hover:text-white hover:bg-white/5"
                )}
                onClick={() => setFeaturesOpen(!featuresOpen)}
              >
                Features
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", featuresOpen && "rotate-180")} />
              </button>
              
              {/* Mega Menu Dropdown */}
              <div 
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[100] transition-all duration-200",
                  featuresOpen 
                    ? "opacity-100 translate-y-0 pointer-events-auto" 
                    : "opacity-0 -translate-y-2 pointer-events-none"
                )}
              >
                <div className="w-[900px] bg-slate-900/98 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_280px]">
                    {/* Core Tools Column */}
                    <div className="p-5 border-r border-white/5">
                      <h3 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-3 px-2">
                        Core Tools
                      </h3>
                      <div className="space-y-0.5">
                        {coreTools.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handleNavigation(item.href)}
                            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-150 group text-left"
                          >
                            <div className="p-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors">
                              <item.icon className="h-4 w-4 text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors block">
                                {item.label}
                              </span>
                              <span className="text-xs text-white/40 group-hover:text-white/50 transition-colors line-clamp-1">
                                {item.description}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Use Cases Column */}
                    <div className="p-5 border-r border-white/5">
                      <h3 className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-3 px-2">
                        Use Cases
                      </h3>
                      <div className="space-y-0.5">
                        {useCases.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handleNavigation(item.href)}
                            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-150 group text-left"
                          >
                            <div className="p-1.5 rounded-lg bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors">
                              <item.icon className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors block">
                                {item.label}
                              </span>
                              <span className="text-xs text-white/40 group-hover:text-white/50 transition-colors line-clamp-1">
                                {item.description}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA Cards Column */}
                    <div className="p-4 bg-slate-800/50 flex flex-col gap-3">
                      {/* CTA Card 1 - Apps Dashboard */}
                      <button
                        onClick={() => handleNavigation("/apps-and-tools")}
                        className="group p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200 text-left hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <LayoutGrid className="h-5 w-5 text-amber-400" />
                          <span className="text-sm font-semibold text-white">Explore All Apps</span>
                        </div>
                        <p className="text-xs text-white/50 mb-3 leading-relaxed">
                          View the full Seeksy suite — studio, clips, CRM, events, and more.
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-400 group-hover:gap-2 transition-all">
                          Open Apps Dashboard
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </button>

                      {/* CTA Card 2 - Playground */}
                      <button
                        onClick={() => handleNavigation("/onboarding")}
                        className="group p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-200 text-left hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Play className="h-5 w-5 text-violet-400" />
                          <span className="text-sm font-semibold text-white">Start in Playground</span>
                        </div>
                        <p className="text-xs text-white/50 mb-3 leading-relaxed">
                          Test Seeksy features instantly in an interactive sandbox mode.
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:gap-2 transition-all">
                          Try Playground
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </button>

                      {/* Quick Link */}
                      <div className="mt-auto pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleNavigation("/auth?mode=signup")}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
                        >
                          <UserCircle className="h-3.5 w-3.5" />
                          Create free account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Links */}
            {simpleLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavigation(link.href)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </button>
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
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:opacity-90 shadow-lg shadow-amber-500/20"
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
          mobileMenuOpen ? "max-h-[800px] pb-6" : "max-h-0"
        )}>
          <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
            {/* Mobile Core Tools Section */}
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Core Tools</span>
            </div>
            {coreTools.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 rounded-lg transition-colors"
              >
                <item.icon className="h-4 w-4 text-amber-400/70" />
                <span className="text-sm text-white/80">{item.label}</span>
              </button>
            ))}
            
            {/* Mobile Use Cases Section */}
            <div className="px-4 py-2 mt-3">
              <span className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Use Cases</span>
            </div>
            {useCases.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 rounded-lg transition-colors"
              >
                <item.icon className="h-4 w-4 text-cyan-400/70" />
                <span className="text-sm text-white/80">{item.label}</span>
              </button>
            ))}
            
            {/* Mobile Simple Links */}
            <div className="px-4 py-2 mt-3">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">More</span>
            </div>
            {simpleLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavigation(link.href)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            
            <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-white/10">
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
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold"
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
