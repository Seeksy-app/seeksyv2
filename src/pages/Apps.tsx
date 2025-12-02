import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleCard, ModuleCardProps } from "@/components/apps/ModuleCard";
import { 
  Search, Instagram, BarChart3, Megaphone, DollarSign, TrendingUp, FolderOpen,
  Mic, Podcast, Image, Scissors, Video, Users, PieChart, Target, Mail, 
  Zap, MessageCircle, FormInput, FileText, CheckSquare, Calendar, Vote,
  Trophy, UserPlus, Layout, Shield, Star, Globe, CalendarClock, Grid3X3,
  ChevronDown, LayoutGrid, List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ModuleStatus = "active" | "available" | "coming_soon";

interface Module extends Omit<ModuleCardProps, 'onClick' | 'compact'> {
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  bgClass: string;
}

const categories: Category[] = [
  { id: "all", name: "All Modules", icon: Grid3X3, description: "", bgClass: "" },
  { 
    id: "creator", 
    name: "Creator Tools", 
    icon: Star, 
    description: "Modules that help creators grow, analyze, or monetize their audience",
    bgClass: "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10"
  },
  { 
    id: "media", 
    name: "Media & Content", 
    icon: Video, 
    description: "Create, manage, and publish audio, video, and media",
    bgClass: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/10"
  },
  { 
    id: "marketing", 
    name: "Marketing & CRM", 
    icon: Megaphone, 
    description: "Communication, segmentation, automation, and multi-channel marketing",
    bgClass: "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/10"
  },
  { 
    id: "business", 
    name: "Business Operations", 
    icon: CheckSquare, 
    description: "Professional tools for managing clients, projects, tasks, and events",
    bgClass: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10"
  },
  { 
    id: "identity", 
    name: "Identity & Profile", 
    icon: Shield, 
    description: "Everything related to who you are and how you show up publicly",
    bgClass: "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10"
  },
  { 
    id: "integrations", 
    name: "Integrations", 
    icon: Globe, 
    description: "Platform and third-party data connections",
    bgClass: "bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/10"
  },
];

const modules: Module[] = [
  // Creator Tools
  {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook and import your data",
    icon: Instagram,
    status: "active",
    category: "creator",
    route: "/integrations",
    recommendedWith: ["Audience Insights", "Monetization Hub"],
  },
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers, engagement, and demographics",
    icon: BarChart3,
    status: "active",
    category: "creator",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
  },
  {
    id: "brand-campaigns",
    name: "Brand Campaigns",
    description: "Apply for sponsorships & brand deals",
    icon: Megaphone,
    status: "coming_soon",
    category: "creator",
    recommendedWith: ["Monetization Hub"],
  },
  {
    id: "revenue-tracking",
    name: "Revenue Tracking",
    description: "Track earnings & sponsorship payments",
    icon: DollarSign,
    status: "coming_soon",
    category: "creator",
  },
  {
    id: "growth-tools",
    name: "Growth Tools",
    description: "AI tools to grow your audience",
    icon: TrendingUp,
    status: "coming_soon",
    category: "creator",
  },
  {
    id: "content-library",
    name: "Content Library",
    description: "Store & organize creator content",
    icon: FolderOpen,
    status: "coming_soon",
    category: "creator",
  },

  // Media & Content
  {
    id: "studio",
    name: "Studio & Recording",
    description: "Record podcasts, videos, livestreams with HD quality",
    icon: Mic,
    status: "active",
    category: "media",
    route: "/studio",
    recommendedWith: ["Media Library", "Podcasts"],
  },
  {
    id: "podcasts",
    name: "Podcasts",
    description: "Podcast hosting, RSS feeds, and distribution",
    icon: Podcast,
    status: "active",
    category: "media",
    route: "/podcasts",
    recommendedWith: ["Studio & Recording"],
  },
  {
    id: "media-library",
    name: "Media Library",
    description: "Store audio, video, and images securely",
    icon: Image,
    status: "active",
    category: "media",
    route: "/media/library",
  },
  {
    id: "clips-editing",
    name: "Clips & Editing",
    description: "AI-powered clipping and video editing",
    icon: Scissors,
    status: "active",
    category: "media",
    route: "/clips",
    recommendedWith: ["Studio & Recording"],
  },
  {
    id: "my-page-streaming",
    name: "My Page Streaming",
    description: "Stream directly on your creator page",
    icon: Video,
    status: "coming_soon",
    category: "media",
  },

  // Marketing & CRM
  {
    id: "contacts",
    name: "Contacts & Audience",
    description: "Manage contacts, leads, and subscribers",
    icon: Users,
    status: "active",
    category: "marketing",
    route: "/audience",
    recommendedWith: ["Segments", "Campaigns"],
  },
  {
    id: "social-analytics",
    name: "Social Analytics",
    description: "Track social media performance and trends",
    icon: PieChart,
    status: "active",
    category: "marketing",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
  },
  {
    id: "segments",
    name: "Segments",
    description: "Create targeted audience segments",
    icon: Target,
    status: "active",
    category: "marketing",
    route: "/marketing/segments",
    recommendedWith: ["Contacts & Audience"],
  },
  {
    id: "campaigns",
    name: "Campaigns",
    description: "Multi-channel marketing campaigns",
    icon: Megaphone,
    status: "active",
    category: "marketing",
    route: "/marketing/campaigns",
    recommendedWith: ["Email Templates", "Automations"],
  },
  {
    id: "email-templates",
    name: "Email Templates",
    description: "Design reusable email templates",
    icon: Mail,
    status: "active",
    category: "marketing",
    route: "/marketing/templates",
  },
  {
    id: "automations",
    name: "Automations",
    description: "Automated workflows and sequences",
    icon: Zap,
    status: "active",
    category: "marketing",
    route: "/marketing/automations",
    recommendedWith: ["Campaigns"],
  },
  {
    id: "sms",
    name: "SMS",
    description: "Text messaging and campaigns",
    icon: MessageCircle,
    status: "active",
    category: "marketing",
    route: "/sms",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Build forms and collect submissions",
    icon: FormInput,
    status: "active",
    category: "marketing",
    route: "/forms",
  },
  {
    id: "qr-codes",
    name: "QR Codes",
    description: "Generate and track QR codes",
    icon: Grid3X3,
    status: "active",
    category: "marketing",
    route: "/qr-codes",
  },

  // Business Operations
  {
    id: "proposals",
    name: "Proposals",
    description: "Create professional proposals and contracts",
    icon: FileText,
    status: "active",
    category: "business",
    route: "/proposals",
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Manage tasks and projects",
    icon: CheckSquare,
    status: "active",
    category: "business",
    route: "/tasks",
  },
  {
    id: "events",
    name: "Events",
    description: "Create events and manage RSVPs",
    icon: Calendar,
    status: "active",
    category: "business",
    route: "/events",
    recommendedWith: ["Forms"],
  },
  {
    id: "polls",
    name: "Polls & Surveys",
    description: "Collect audience feedback",
    icon: Vote,
    status: "active",
    category: "business",
    route: "/polls",
  },
  {
    id: "awards",
    name: "Awards",
    description: "Award programs and nominations",
    icon: Trophy,
    status: "active",
    category: "business",
    route: "/awards",
  },
  {
    id: "team",
    name: "Team & Collaboration",
    description: "Manage team members and collaborate",
    icon: UserPlus,
    status: "active",
    category: "business",
    route: "/team",
  },

  // Identity & Creator Profile
  {
    id: "my-page",
    name: "My Page Builder",
    description: "Build your personal landing page",
    icon: Layout,
    status: "active",
    category: "identity",
    route: "/profile/edit",
    recommendedWith: ["Identity & Verification"],
  },
  {
    id: "identity-verification",
    name: "Identity & Verification",
    description: "Verify voice and face, manage rights",
    icon: Shield,
    status: "active",
    category: "identity",
    route: "/identity",
    recommendedWith: ["My Page Builder"],
  },
  {
    id: "influencer-profile",
    name: "Influencer Profile",
    description: "Public influencer portfolio and media kit",
    icon: Star,
    status: "coming_soon",
    category: "identity",
  },

  // Integrations
  {
    id: "social-integrations",
    name: "Social Media Integrations",
    description: "Connect social platforms for data sync",
    icon: Instagram,
    status: "active",
    category: "integrations",
    route: "/integrations",
  },
  {
    id: "analytics-integrations",
    name: "Analytics & Insights",
    description: "Third-party analytics tools",
    icon: BarChart3,
    status: "coming_soon",
    category: "integrations",
  },
  {
    id: "calendar-integrations",
    name: "Calendar Integrations",
    description: "Sync with Google, Outlook, Apple Calendar",
    icon: CalendarClock,
    status: "coming_soon",
    category: "integrations",
  },
];

export default function Apps() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCompact, setIsCompact] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesSearch =
        !searchTerm ||
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        activeCategory === "all" || module.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const groupedModules = useMemo(() => {
    if (activeCategory !== "all") {
      return { [activeCategory]: filteredModules };
    }

    return filteredModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [filteredModules, activeCategory]);

  const getCategoryData = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const handleModuleClick = (module: Module) => {
    if (module.route) {
      navigate(module.route);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const categoryOrder = ["creator", "media", "marketing", "business", "identity", "integrations"];

  const totalActive = filteredModules.filter((m) => m.status === "active").length;
  const totalAvailable = filteredModules.filter((m) => m.status === "available").length;
  const totalComingSoon = filteredModules.filter((m) => m.status === "coming_soon").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Seeksy App Directory
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            All modules, tools, and integrations available in your workspace. Search, activate, and customize your experience.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search + View Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-11 bg-card border-border/50"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(false)}
                className={cn(
                  "h-8 px-3 gap-1.5",
                  !isCompact && "bg-background shadow-sm"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Expanded</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(true)}
                className={cn(
                  "h-8 px-3 gap-1.5",
                  isCompact && "bg-background shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Compact</span>
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              const moduleCount = category.id === "all" 
                ? modules.length 
                : modules.filter(m => m.category === category.id).length;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "h-8 sm:h-9 gap-1.5 text-xs sm:text-sm",
                    !isActive && "bg-card hover:bg-accent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">{category.name}</span>
                  <span className="xs:hidden">{category.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70">({moduleCount})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{filteredModules.length}</strong> modules
          </span>
          <span className="w-px h-4 bg-border hidden sm:block" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {totalActive} active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {totalAvailable} available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            {totalComingSoon} coming soon
          </span>
        </div>

        {/* Module Grid by Category */}
        <div className="space-y-6">
          {categoryOrder.map((categoryId) => {
            const categoryModules = groupedModules[categoryId];
            if (!categoryModules || categoryModules.length === 0) return null;

            const category = getCategoryData(categoryId);
            if (!category) return null;
            
            const CategoryIcon = category.icon;
            const isCollapsed = collapsedCategories.has(categoryId);

            return (
              <Collapsible
                key={categoryId}
                open={!isCollapsed}
                onOpenChange={() => toggleCategory(categoryId)}
              >
                <section 
                  className={cn(
                    "rounded-xl border p-4 sm:p-6 transition-colors",
                    category.bgClass
                  )}
                >
                  {/* Category Header */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-3 mb-0 group cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                          <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-semibold">{category.name}</h2>
                            <Badge variant="secondary" className="text-xs">
                              {categoryModules.length} modules
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                          isCollapsed && "-rotate-90"
                        )} 
                      />
                    </button>
                  </CollapsibleTrigger>

                  {/* Module Grid */}
                  <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div 
                      className={cn(
                        "mt-4 sm:mt-5 grid gap-3 sm:gap-4",
                        isCompact 
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      )}
                    >
                      {categoryModules.map((module) => (
                        <ModuleCard
                          key={module.id}
                          {...module}
                          compact={isCompact}
                          onClick={() => handleModuleClick(module)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </section>
              </Collapsible>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No modules found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
