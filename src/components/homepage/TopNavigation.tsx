import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Mic, Video, Radio, Wand2, Calendar, Users, BarChart3, TrendingUp, Activity, FileText, DollarSign, Briefcase, ShieldCheck, AudioWaveform, Scan, Link2, BookOpen, Headphones, HelpCircle, GraduationCap, FileCode, Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const megaMenuData = {
  features: {
    label: "Features",
    sections: [
      {
        title: "Studio",
        items: [
          { label: "AI Master Suite", href: "/studio", icon: Wand2, description: "Complete AI-powered production" },
          { label: "HD Video Studio", href: "/studio/video-premium", icon: Video, description: "Multi-camera video recording" },
          { label: "Audio Podcast Studio", href: "/studio/audio-premium", icon: Mic, description: "Professional audio recording" },
          { label: "Live Streaming", href: "/studio/live", icon: Radio, description: "Stream to multiple platforms" },
        ]
      },
      {
        title: "Booking",
        items: [
          { label: "Meeting Types", href: "/meetings", icon: Calendar, description: "Custom booking pages" },
          { label: "Podcast Guest Booking", href: "/meetings/podcast", icon: Users, description: "Guest scheduling made easy" },
          { label: "Events", href: "/events", icon: Users, description: "Host and manage events" },
        ]
      },
      {
        title: "Analytics",
        items: [
          { label: "Social Analytics", href: "/social-analytics", icon: BarChart3, description: "Track your growth" },
          { label: "Growth Insights", href: "/analytics", icon: TrendingUp, description: "AI-powered recommendations" },
          { label: "Media Performance", href: "/analytics/media", icon: Activity, description: "Content analytics" },
        ]
      },
      {
        title: "Media Kit",
        items: [
          { label: "Auto Media Kit", href: "/media-kit", icon: FileText, description: "Generate professional kits" },
          { label: "Creator Valuation", href: "/social-analytics#valuation", icon: DollarSign, description: "Know your worth" },
          { label: "Brand Portfolio", href: "/portfolio", icon: Briefcase, description: "Showcase your work" },
        ]
      },
      {
        title: "Identity",
        items: [
          { label: "Voice Verification", href: "/identity", icon: AudioWaveform, description: "Verify your voice" },
          { label: "Face Verification", href: "/identity", icon: Scan, description: "Facial recognition" },
          { label: "On-Chain Identity", href: "/identity", icon: Link2, description: "Blockchain-backed proof" },
          { label: "Rights Dashboard", href: "/identity", icon: ShieldCheck, description: "Manage usage rights" },
        ]
      },
    ]
  },
  resources: {
    label: "Resources",
    items: [
      { label: "Blog", href: "/blog", icon: Newspaper },
      { label: "Podcast", href: "/podcast", icon: Headphones },
      { label: "Help Center", href: "/help", icon: HelpCircle },
      { label: "Tutorials", href: "/tutorials", icon: GraduationCap },
      { label: "API Docs", href: "/docs", icon: FileCode },
      { label: "Release Notes", href: "/changelog", icon: BookOpen },
    ]
  }
};

const simpleLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
  { label: "About", href: "/about" },
];

export function TopNavigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleNavigation = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
    setActiveMenu(null);
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
            {/* Features Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("features")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Features
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", activeMenu === "features" && "rotate-180")} />
              </button>
              
              {activeMenu === "features" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[900px] z-[100]">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6 grid grid-cols-5 gap-6 backdrop-blur-none">
                    {megaMenuData.features.sections.map((section) => (
                      <div key={section.title}>
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                          {section.title}
                        </h3>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => handleNavigation(item.href)}
                              className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                                  {item.label}
                                </span>
                              </div>
                              <p className="text-xs text-white/40 mt-0.5 ml-6">
                                {item.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("resources")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Resources
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", activeMenu === "resources" && "rotate-180")} />
              </button>
              
              {activeMenu === "resources" && (
                <div className="absolute top-full right-0 pt-2 w-[220px] z-[100]">
                  <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 p-2 backdrop-blur-none">
                    {megaMenuData.resources.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavigation(item.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <item.icon className="h-4 w-4 text-white/40 group-hover:text-amber-400 transition-colors" />
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          mobileMenuOpen ? "max-h-[600px] pb-6" : "max-h-0"
        )}>
          <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
            {/* Mobile Features */}
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Features</span>
            </div>
            {megaMenuData.features.sections.map((section) => (
              <div key={section.title} className="px-4 py-2">
                <span className="text-xs text-white/30">{section.title}</span>
                {section.items.slice(0, 2).map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    className="w-full text-left px-2 py-2 text-sm text-white/70 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
            
            {/* Mobile Simple Links */}
            {simpleLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavigation(link.href)}
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
