import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleCard, ModuleCardProps } from "@/components/apps/ModuleCard";
import { ModulePreviewModal } from "@/components/apps/ModulePreviewModal";
import { CustomPackageBuilder } from "@/components/apps/CustomPackageBuilder";
import { CategoryTooltip } from "@/components/apps/CategoryTooltip";
import { 
  Search, Instagram, BarChart3, Megaphone, DollarSign, TrendingUp, FolderOpen,
  Mic, Podcast, Image, Scissors, Video, Users, PieChart, Target, Mail, 
  Zap, MessageCircle, FormInput, FileText, CheckSquare, Calendar, Vote,
  Trophy, UserPlus, Layout, Shield, Star, Globe, CalendarClock, Grid3X3,
  ChevronDown, LayoutGrid, List, Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useModuleActivation } from "@/hooks/useModuleActivation";

type ModuleStatus = "active" | "available" | "coming_soon";

interface Module extends Omit<ModuleCardProps, 'onClick' | 'compact' | 'onPreview' | 'tooltipData'> {
  category: string;
  creditEstimate?: number;
}

interface Category {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  description: string;
  bgClass: string;
  accentColor: string;
  tooltipData?: {
    purpose: string;
    bestForUsers: string;
    recommendedModules: string[];
    exampleWorkflows: string;
  };
}

const categories: Category[] = [
  { id: "all", name: "All Modules", shortName: "All", icon: Grid3X3, description: "", bgClass: "", accentColor: "" },
  { 
    id: "creator", 
    name: "Creator Tools", 
    shortName: "Creator",
    icon: Star, 
    description: "Modules that help creators grow, analyze, or monetize their audience",
    bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    accentColor: "text-amber-600 dark:text-amber-400",
    tooltipData: {
      purpose: "Tools designed to help creators manage their audience, personal brand, and engagement insights",
      bestForUsers: "New or growing creators who need analytics, audience syncing, and brand deal management",
      recommendedModules: ["Social Connect", "Audience Insights", "Brand Campaigns"],
      exampleWorkflows: "Connect socials → Analyze audience → Apply for brand deals → Track revenue"
    }
  },
  { 
    id: "media", 
    name: "Media & Content", 
    shortName: "Media",
    icon: Video, 
    description: "Create, manage, and publish audio, video, and media",
    bgClass: "bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/30",
    accentColor: "text-violet-600 dark:text-violet-400",
    tooltipData: {
      purpose: "Create, manage, and publish professional audio, video, and media content",
      bestForUsers: "Podcasters, video creators, and content producers",
      recommendedModules: ["Studio & Recording", "Podcasts", "Clips & Editing"],
      exampleWorkflows: "Record in Studio → Edit with AI → Generate clips → Publish to podcast"
    }
  },
  { 
    id: "marketing", 
    name: "Marketing & CRM", 
    shortName: "Marketing",
    icon: Megaphone, 
    description: "Communication, segmentation, automation, and multi-channel marketing",
    bgClass: "bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/30",
    accentColor: "text-sky-600 dark:text-sky-400",
    tooltipData: {
      purpose: "Communication, segmentation, automation, and multi-channel marketing tools",
      bestForUsers: "Creators with audiences to nurture and grow",
      recommendedModules: ["Contacts", "Campaigns", "Automations"],
      exampleWorkflows: "Import contacts → Create segments → Run campaigns → Track results"
    }
  },
  { 
    id: "business", 
    name: "Business Operations", 
    shortName: "Business",
    icon: CheckSquare, 
    description: "Professional tools for managing clients, projects, tasks, and events",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    tooltipData: {
      purpose: "Professional tools for managing clients, projects, tasks, and events",
      bestForUsers: "Event organizers, speakers, and professional creators",
      recommendedModules: ["Events", "Proposals", "Tasks"],
      exampleWorkflows: "Create event → Build proposal → Manage tasks → Track completion"
    }
  },
  { 
    id: "identity", 
    name: "Identity & Profile", 
    shortName: "Identity",
    icon: Shield, 
    description: "Everything related to who you are and how you show up publicly",
    bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30",
    accentColor: "text-rose-600 dark:text-rose-400",
    tooltipData: {
      purpose: "Everything related to who you are and how you show up publicly",
      bestForUsers: "Creators building their personal brand",
      recommendedModules: ["My Page Builder", "Identity & Verification"],
      exampleWorkflows: "Verify identity → Build My Page → Share link → Track visitors"
    }
  },
  { 
    id: "integrations", 
    name: "Integrations", 
    shortName: "Integrations",
    icon: Globe, 
    description: "Platform and third-party data connections",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/50 dark:border-cyan-800/30",
    accentColor: "text-cyan-600 dark:text-cyan-400",
    tooltipData: {
      purpose: "Platform and third-party data connections to sync your workflow",
      bestForUsers: "Tech-savvy creators who use multiple tools",
      recommendedModules: ["Social Connect", "Calendar Integrations"],
      exampleWorkflows: "Connect platforms → Sync data → Automate workflows"
    }
  },
];

const modules: Module[] = [
  // Creator Tools
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers, engagement, and demographics",
    icon: BarChart3,
    status: "active",
    category: "creator",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
    creditEstimate: 10,
  },
  {
    id: "social-analytics",
    name: "Social Analytics",
    description: "Track social media performance and trends",
    icon: PieChart,
    status: "active",
    category: "creator",
    route: "/social-analytics",
    recommendedWith: ["Social Connect"],
    creditEstimate: 10,
  },
  {
    id: "brand-campaigns",
    name: "Brand Campaigns",
    description: "Apply for sponsorships & brand deals",
    icon: Megaphone,
    status: "coming_soon",
    category: "creator",
    recommendedWith: ["Monetization Hub"],
    creditEstimate: 15,
  },
  {
    id: "revenue-tracking",
    name: "Revenue Tracking",
    description: "Track earnings & sponsorship payments",
    icon: DollarSign,
    status: "coming_soon",
    category: "creator",
    creditEstimate: 5,
  },
  {
    id: "growth-tools",
    name: "Growth Tools",
    description: "AI tools to grow your audience",
    icon: TrendingUp,
    status: "coming_soon",
    category: "creator",
    creditEstimate: 20,
  },
  {
    id: "content-library",
    name: "Content Library",
    description: "Store & organize creator content",
    icon: FolderOpen,
    status: "coming_soon",
    category: "creator",
    creditEstimate: 10,
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
    creditEstimate: 50,
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
    creditEstimate: 20,
  },
  {
    id: "media-library",
    name: "Media Library",
    description: "Store audio, video, and images securely",
    icon: Image,
    status: "active",
    category: "media",
    route: "/media/library",
    creditEstimate: 10,
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
    creditEstimate: 30,
  },
  {
    id: "my-page-streaming",
    name: "My Page Streaming",
    description: "Stream directly on your creator page",
    icon: Video,
    status: "coming_soon",
    category: "media",
    creditEstimate: 40,
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
    creditEstimate: 5,
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
    creditEstimate: 5,
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
    creditEstimate: 25,
  },
  {
    id: "email-templates",
    name: "Email Templates",
    description: "Design reusable email templates",
    icon: Mail,
    status: "active",
    category: "marketing",
    route: "/marketing/templates",
    creditEstimate: 10,
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
    creditEstimate: 15,
  },
  {
    id: "sms",
    name: "SMS",
    description: "Text messaging and campaigns",
    icon: MessageCircle,
    status: "active",
    category: "marketing",
    route: "/sms",
    creditEstimate: 20,
  },
  {
    id: "forms",
    name: "Forms",
    description: "Build forms and collect submissions",
    icon: FormInput,
    status: "active",
    category: "marketing",
    route: "/forms",
    creditEstimate: 5,
  },
  {
    id: "qr-codes",
    name: "QR Codes",
    description: "Generate and track QR codes",
    icon: Grid3X3,
    status: "active",
    category: "marketing",
    route: "/qr-codes",
    creditEstimate: 5,
  },

  // Business Operations
  {
    id: "meetings",
    name: "Meetings",
    description: "Book calls and appointments",
    icon: CalendarClock,
    status: "active",
    category: "business",
    route: "/creator/meetings",
    recommendedWith: ["Events"],
    creditEstimate: 5,
  },
  {
    id: "signups",
    name: "Sign-ups",
    description: "Collect RSVPs and registrations",
    icon: FormInput,
    status: "active",
    category: "business",
    route: "/signup-sheets",
    recommendedWith: ["Events", "Forms"],
    creditEstimate: 5,
  },
  {
    id: "proposals",
    name: "Proposals",
    description: "Create professional proposals and contracts",
    icon: FileText,
    status: "active",
    category: "business",
    route: "/proposals",
    creditEstimate: 10,
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Manage tasks and projects",
    icon: CheckSquare,
    status: "active",
    category: "business",
    route: "/tasks",
    creditEstimate: 5,
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
    creditEstimate: 15,
  },
  {
    id: "polls",
    name: "Polls & Surveys",
    description: "Collect audience feedback",
    icon: Vote,
    status: "active",
    category: "business",
    route: "/polls",
    creditEstimate: 5,
  },
  {
    id: "awards",
    name: "Awards",
    description: "Award programs and nominations",
    icon: Trophy,
    status: "active",
    category: "business",
    route: "/awards",
    creditEstimate: 10,
  },
  {
    id: "team",
    name: "Team & Collaboration",
    description: "Manage team members and collaborate",
    icon: UserPlus,
    status: "active",
    category: "business",
    route: "/team",
    creditEstimate: 10,
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
    creditEstimate: 5,
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
    creditEstimate: 20,
  },
  {
    id: "influencer-profile",
    name: "Influencer Profile",
    description: "Public influencer portfolio and media kit",
    icon: Star,
    status: "coming_soon",
    category: "identity",
    creditEstimate: 10,
  },

  // Integrations
  {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook and import your data",
    icon: Instagram,
    status: "active",
    category: "integrations",
    route: "/integrations",
    recommendedWith: ["Audience Insights", "Social Analytics"],
    creditEstimate: 5,
  },
  {
    id: "social-integrations",
    name: "Social Media Integrations",
    description: "Connect social platforms for data sync",
    icon: Instagram,
    status: "active",
    category: "integrations",
    route: "/integrations",
    creditEstimate: 5,
  },
  {
    id: "analytics-integrations",
    name: "Analytics & Insights",
    description: "Third-party analytics tools",
    icon: BarChart3,
    status: "coming_soon",
    category: "integrations",
    creditEstimate: 10,
  },
  {
    id: "calendar-integrations",
    name: "Calendar Integrations",
    description: "Sync with Google, Outlook, Apple Calendar",
    icon: CalendarClock,
    status: "coming_soon",
    category: "integrations",
    creditEstimate: 5,
  },
];

export default function Apps() {
  const navigate = useNavigate();
  const { activatedModuleIds, isModuleActivated } = useModuleActivation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCompact, setIsCompact] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);

  // Compute module status based on activation
  const getModuleStatus = (module: Module): "active" | "available" | "coming_soon" | "activated" => {
    if (module.status === "coming_soon") return "coming_soon";
    if (isModuleActivated(module.id)) return "activated";
    return "available";
  };

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

  const packageModules = modules.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    creditEstimate: m.creditEstimate || 10,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
              Seeksy App Directory
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              All modules, tools, and integrations available in your workspace.
            </p>
          </div>
          <Button onClick={() => setShowPackageBuilder(true)} className="gap-2">
            <Package className="h-4 w-4" />
            Create Your Own Package
          </Button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm bg-card border-border/50"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(false)}
              className={cn(
                "h-8 px-3 gap-1.5 text-xs",
                !isCompact && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Expanded</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(true)}
              className={cn(
                "h-8 px-3 gap-1.5 text-xs",
                isCompact && "bg-background shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compact</span>
            </Button>
          </div>
        </div>

        {/* Segmented Control Filter */}
        <div className="mb-6">
          <div className="inline-flex items-center p-1 bg-muted/50 rounded-xl border border-border/50">
            {categories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all",
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>{category.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Module Grid by Category */}
        <div className="space-y-8">
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
                    "rounded-2xl border p-5 sm:p-6 transition-all shadow-sm",
                    category.bgClass
                  )}
                >
                  {/* Category Header */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-3 group cursor-pointer sticky top-0 bg-inherit z-10 -mt-1 pt-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/30"
                        )}>
                          <CategoryIcon className={cn("h-5 w-5", category.accentColor)} />
                        </div>
                        <div className="text-left min-w-0">
                          <CategoryTooltip categoryId={categoryId} fallbackData={category.tooltipData}>
                            <h2 className="text-lg font-semibold">{category.name}</h2>
                          </CategoryTooltip>
                          <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
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
                        "mt-5 grid gap-3",
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      )}
                    >
                      {categoryModules.map((module) => (
                        <ModuleCard
                          key={module.id}
                          {...module}
                          status={getModuleStatus(module)}
                          compact={isCompact}
                          onClick={() => handleModuleClick(module)}
                          onPreview={() => setPreviewModule(module)}
                          tooltipData={{
                            description: module.description,
                            bestFor: category.tooltipData?.bestForUsers || "All creators",
                            unlocks: [],
                            creditEstimate: module.creditEstimate || 10,
                          }}
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
            <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-base font-medium mb-1.5">No modules found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              size="sm"
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

      {/* Custom Package Builder Modal */}
      <CustomPackageBuilder
        open={showPackageBuilder}
        onOpenChange={setShowPackageBuilder}
        modules={packageModules}
      />

      {/* Module Preview Modal */}
      <ModulePreviewModal
        open={!!previewModule}
        onOpenChange={(open) => !open && setPreviewModule(null)}
        module={previewModule}
      />
    </div>
  );
}