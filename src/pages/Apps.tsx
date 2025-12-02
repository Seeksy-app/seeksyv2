import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleCard, ModuleCardProps } from "@/components/apps/ModuleCard";
import { 
  Search, Instagram, BarChart3, Megaphone, DollarSign, TrendingUp, FolderOpen,
  Mic, Podcast, Image, Scissors, Video, Users, PieChart, Target, Mail, 
  Zap, MessageCircle, FormInput, FileText, CheckSquare, Calendar, Vote,
  Trophy, UserPlus, Layout, Shield, Star, Globe, CalendarClock, Grid3X3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type ModuleStatus = "active" | "available" | "coming_soon";

interface Module extends Omit<ModuleCardProps, 'onClick'> {
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
}

const categories: Category[] = [
  { id: "all", name: "All Modules", icon: Grid3X3 },
  { id: "creator", name: "Creator Tools", icon: Star },
  { id: "media", name: "Media & Content", icon: Video },
  { id: "marketing", name: "Marketing & CRM", icon: Megaphone },
  { id: "business", name: "Business Operations", icon: CheckSquare },
  { id: "identity", name: "Identity & Profile", icon: Shield },
  { id: "integrations", name: "Integrations", icon: Globe },
];

const modules: Module[] = [
  // Creator Tools
  {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook",
    icon: Instagram,
    status: "active",
    category: "creator",
    route: "/integrations",
    recommendedWith: ["Audience Insights", "Monetization Hub"],
  },
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers & engagement",
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
    description: "Record podcasts, videos, livestreams",
    icon: Mic,
    status: "active",
    category: "media",
    route: "/studio",
    recommendedWith: ["Media Library"],
  },
  {
    id: "podcasts",
    name: "Podcasts",
    description: "Podcast hosting + RSS",
    icon: Podcast,
    status: "active",
    category: "media",
    route: "/podcasts",
    recommendedWith: ["Studio & Recording"],
  },
  {
    id: "media-library",
    name: "Media Library",
    description: "Store audio, video, images",
    icon: Image,
    status: "active",
    category: "media",
    route: "/media/library",
  },
  {
    id: "clips-editing",
    name: "Clips & Editing",
    description: "AI clipping and editing",
    icon: Scissors,
    status: "coming_soon",
    category: "media",
  },
  {
    id: "my-page-streaming",
    name: "My Page Streaming",
    description: "Stream directly on your page",
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
  },
  {
    id: "social-analytics",
    name: "Social Analytics",
    description: "Track social media performance",
    icon: PieChart,
    status: "active",
    category: "marketing",
    route: "/social-analytics",
  },
  {
    id: "segments",
    name: "Segments",
    description: "Create targeted audience segments",
    icon: Target,
    status: "active",
    category: "marketing",
    route: "/marketing/segments",
  },
  {
    id: "campaigns",
    name: "Campaigns",
    description: "Multi-channel marketing campaigns",
    icon: Megaphone,
    status: "active",
    category: "marketing",
    route: "/marketing/campaigns",
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
    description: "Create professional proposals",
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
    description: "Manage team members",
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
  },
  {
    id: "identity-verification",
    name: "Identity & Verification",
    description: "Verify voice and face, manage rights",
    icon: Shield,
    status: "active",
    category: "identity",
    route: "/identity",
  },
  {
    id: "influencer-profile",
    name: "Influencer Profile",
    description: "Public influencer portfolio",
    icon: Star,
    status: "coming_soon",
    category: "identity",
  },

  // Integrations
  {
    id: "social-integrations",
    name: "Social Media Integrations",
    description: "Connect social platforms",
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
    description: "Sync with Google, Outlook, etc.",
    icon: CalendarClock,
    status: "coming_soon",
    category: "integrations",
  },
];

export default function Apps() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const handleModuleClick = (module: Module) => {
    if (module.route) {
      navigate(module.route);
    }
  };

  const categoryOrder = ["creator", "media", "marketing", "business", "identity", "integrations"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Seeksy App Directory
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            All modules, tools, and integrations available in your workspace. Search, activate, and customize your experience.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-card border-border/50"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "h-9 gap-1.5",
                    !isActive && "bg-card hover:bg-accent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{filteredModules.length}</strong> modules
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {filteredModules.filter((m) => m.status === "active").length} active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {filteredModules.filter((m) => m.status === "available").length} available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            {filteredModules.filter((m) => m.status === "coming_soon").length} coming soon
          </span>
        </div>

        {/* Module Grid by Category */}
        <div className="space-y-10">
          {categoryOrder.map((categoryId) => {
            const categoryModules = groupedModules[categoryId];
            if (!categoryModules || categoryModules.length === 0) return null;

            const category = categories.find((c) => c.id === categoryId);
            const CategoryIcon = category?.icon || Grid3X3;

            return (
              <section key={categoryId}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{getCategoryName(categoryId)}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {categoryModules.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      {...module}
                      onClick={() => handleModuleClick(module)}
                    />
                  ))}
                </div>
              </section>
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
