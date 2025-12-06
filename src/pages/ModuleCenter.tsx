import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Filter, X, Download, ChevronDown, ArrowUpDown,
  Sparkles, Star, User, Layers,
  // Category icons
  BarChart3, Megaphone, DollarSign, TrendingUp, FolderOpen,
  Mic, Podcast, Image, Scissors, Video, Users, PieChart, Target, Mail, 
  Zap, MessageCircle, FormInput, FileText, CheckSquare, Calendar, Vote,
  Trophy, UserPlus, Layout, Shield, Globe, CalendarClock, Grid3X3, Instagram
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ModuleStatus = "active" | "available" | "coming_soon";
type SortOption = "default" | "name" | "popular" | "newest";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: ModuleStatus;
  category: string;
  route?: string;
  recommendedWith?: string[];
  downloads?: number;
  isNew?: boolean;
  isAIPowered?: boolean;
  integrations?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count?: number;
}

const filterTabs = [
  { id: "all", label: "All modules", icon: Layers },
  { id: "recommended", label: "Recommended for you", icon: Star },
  { id: "seeksy", label: "Created by Seeksy", icon: Sparkles },
  { id: "custom", label: "Created by me", icon: User },
];

const categories: Category[] = [
  { id: "start-scratch", name: "Start from scratch", icon: Grid3X3 },
  { id: "ai-powered", name: "AI-powered", icon: Sparkles },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "content-production", name: "Content Production", icon: Video },
  { id: "project-management", name: "Project Management", icon: CheckSquare },
  { id: "docs", name: "Docs", icon: FileText },
  { id: "forms", name: "Forms", icon: FormInput },
  { id: "sales-crm", name: "Sales & CRM", icon: Users },
  { id: "events", name: "Events", icon: Calendar },
  { id: "identity", name: "Identity & Profile", icon: Shield },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "integrations", name: "Integrations", icon: Globe },
];

const modules: Module[] = [
  // AI-powered
  {
    id: "ai-clips",
    name: "AI Clips Generator",
    description: "Automatically generate viral clips from your long-form content with AI-powered detection",
    icon: Scissors,
    status: "active",
    category: "ai-powered",
    route: "/clips",
    downloads: 45200,
    isNew: true,
    isAIPowered: true,
    integrations: ["studio", "podcasts", "youtube"],
  },
  {
    id: "ai-post-production",
    name: "AI Post-Production",
    description: "Remove filler words, pauses, and enhance audio quality automatically",
    icon: Sparkles,
    status: "active",
    category: "ai-powered",
    route: "/studio/ai-post-production",
    downloads: 38100,
    isAIPowered: true,
    integrations: ["studio", "media-library"],
  },
  // Content Production
  {
    id: "studio",
    name: "Studio & Recording",
    description: "Record podcasts, videos, livestreams with HD quality and guest invites",
    icon: Mic,
    status: "active",
    category: "content-production",
    route: "/studio",
    downloads: 72000,
    integrations: ["podcasts", "media-library", "clips"],
  },
  {
    id: "podcasts",
    name: "Podcast Hosting",
    description: "Host your podcast with RSS feeds, analytics, and distribution to all platforms",
    icon: Podcast,
    status: "active",
    category: "content-production",
    route: "/podcasts",
    downloads: 96300,
    integrations: ["studio", "spotify", "apple"],
  },
  {
    id: "media-library",
    name: "Media Library",
    description: "Store, organize, and manage all your audio, video, and images in one place",
    icon: Image,
    status: "active",
    category: "content-production",
    route: "/studio/media",
    downloads: 54200,
  },
  // Marketing
  {
    id: "campaigns",
    name: "Marketing Campaigns",
    description: "Create, schedule, and design all your marketing content in one place",
    icon: Megaphone,
    status: "active",
    category: "marketing",
    route: "/marketing/campaigns",
    downloads: 175200,
    integrations: ["email", "sms", "contacts"],
  },
  {
    id: "email",
    name: "Email Marketing",
    description: "Full email inbox with templates, sequences, and multi-account support",
    icon: Mail,
    status: "active",
    category: "marketing",
    route: "/email/inbox",
    downloads: 89400,
    integrations: ["contacts", "campaigns"],
  },
  {
    id: "automations",
    name: "Automations",
    description: "Build automated workflows and sequences to save time and scale",
    icon: Zap,
    status: "active",
    category: "marketing",
    route: "/marketing/automations",
    downloads: 43100,
    integrations: ["email", "sms", "campaigns"],
  },
  {
    id: "sms",
    name: "SMS Marketing",
    description: "Text messaging campaigns with templates and scheduling",
    icon: MessageCircle,
    status: "active",
    category: "marketing",
    route: "/sms",
    downloads: 28700,
  },
  // Sales & CRM
  {
    id: "contacts",
    name: "Contacts & Audience",
    description: "Manage contacts, leads, and subscribers with segments and tags",
    icon: Users,
    status: "active",
    category: "sales-crm",
    route: "/audience",
    downloads: 102400,
    integrations: ["campaigns", "email"],
  },
  {
    id: "segments",
    name: "Audience Segments",
    description: "Create targeted audience segments based on behavior and attributes",
    icon: Target,
    status: "active",
    category: "sales-crm",
    route: "/marketing/segments",
    downloads: 67800,
  },
  // Project Management
  {
    id: "project-management",
    name: "Project Management",
    description: "Manage tasks, tickets, leads, and e-signatures all in one place",
    icon: FolderOpen,
    status: "active",
    category: "project-management",
    route: "/project-management",
    downloads: 108500,
    integrations: ["tasks", "contacts"],
  },
  {
    id: "tasks",
    name: "Tasks & To-dos",
    description: "Create and track tasks with due dates, priorities, and assignments",
    icon: CheckSquare,
    status: "active",
    category: "project-management",
    route: "/tasks",
    downloads: 84200,
  },
  // Forms
  {
    id: "forms",
    name: "Forms Builder",
    description: "Build forms and collect submissions with custom fields and logic",
    icon: FormInput,
    status: "active",
    category: "forms",
    route: "/forms",
    downloads: 56700,
  },
  {
    id: "polls",
    name: "Polls & Surveys",
    description: "Collect audience feedback with polls, surveys, and voting",
    icon: Vote,
    status: "active",
    category: "forms",
    route: "/polls",
    downloads: 34500,
  },
  // Events
  {
    id: "events",
    name: "Events & Ticketing",
    description: "Create events, sell tickets, and manage RSVPs with check-in",
    icon: Calendar,
    status: "active",
    category: "events",
    route: "/events",
    downloads: 78300,
    integrations: ["forms", "contacts"],
  },
  {
    id: "meetings",
    name: "Meetings & Scheduling",
    description: "Book calls and appointments with calendar integration",
    icon: CalendarClock,
    status: "active",
    category: "events",
    route: "/creator/meetings",
    downloads: 92100,
  },
  {
    id: "awards",
    name: "Awards Program",
    description: "Create award programs, nominations, voting, and ceremonies",
    icon: Trophy,
    status: "active",
    category: "events",
    route: "/awards",
    downloads: 23400,
  },
  // Identity & Profile
  {
    id: "my-page",
    name: "My Page Builder",
    description: "Build your personal landing page with drag-and-drop sections",
    icon: Layout,
    status: "active",
    category: "identity",
    route: "/profile/edit",
    downloads: 145600,
  },
  {
    id: "identity-verification",
    name: "Identity & Verification",
    description: "Verify your voice and face on blockchain, manage usage rights",
    icon: Shield,
    status: "active",
    category: "identity",
    route: "/identity",
    downloads: 67200,
    isNew: true,
  },
  // Analytics
  {
    id: "social-analytics",
    name: "Social Analytics",
    description: "Track social media performance across all connected platforms",
    icon: PieChart,
    status: "active",
    category: "analytics",
    route: "/social-analytics",
    downloads: 134700,
    integrations: ["instagram", "youtube", "tiktok"],
  },
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Deep analytics on followers, engagement, and demographics",
    icon: BarChart3,
    status: "active",
    category: "analytics",
    route: "/social-analytics",
    downloads: 89300,
  },
  // Integrations
  {
    id: "social-connect",
    name: "Social Connect",
    description: "Connect Instagram, YouTube, TikTok, Facebook and sync your data",
    icon: Instagram,
    status: "active",
    category: "integrations",
    route: "/integrations",
    downloads: 167800,
  },
  // Docs
  {
    id: "proposals",
    name: "Proposals & Contracts",
    description: "Create professional proposals with e-signatures",
    icon: FileText,
    status: "active",
    category: "docs",
    route: "/proposals",
    downloads: 45600,
  },
];

function formatDownloads(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

function ModuleCard({ module, onActivate }: { module: Module; onActivate: (id: string) => void }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (module.route) {
      navigate(module.route);
    } else {
      onActivate(module.id);
    }
  };

  return (
    <Card 
      className="group cursor-pointer border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 bg-card overflow-hidden"
      onClick={handleClick}
    >
      {/* Preview Image Area */}
      <div className="h-36 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <div className="relative z-10 p-4 w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-sm border border-border/50">
            <module.icon className="h-8 w-8 text-primary" />
          </div>
        </div>
        {module.isNew && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            New
          </Badge>
        )}
        {module.isAIPowered && (
          <Badge variant="secondary" className="absolute top-2 left-2 text-xs gap-1">
            <Sparkles className="h-3 w-3" /> AI
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {module.name}
          </h3>
          <p className="text-xs text-muted-foreground">by Seeksy</p>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {module.description}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{formatDownloads(module.downloads || 0)}</span>
          </div>
          
          {module.integrations && module.integrations.length > 0 && (
            <div className="flex items-center gap-1">
              {module.integrations.slice(0, 3).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                </div>
              ))}
              {module.integrations.length > 3 && (
                <span className="text-xs text-muted-foreground">+{module.integrations.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModuleCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { activateModule } = useModuleActivation();

  const filteredModules = useMemo(() => {
    let result = [...modules];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        m => m.name.toLowerCase().includes(query) || 
             m.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (activeCategory && activeCategory !== "start-scratch") {
      result = result.filter(m => m.category === activeCategory);
    }
    
    // Filter by tab
    if (activeFilter === "recommended") {
      // Show modules with high downloads
      result = result.filter(m => (m.downloads || 0) > 50000);
    } else if (activeFilter === "seeksy") {
      // All are by Seeksy
    }
    
    // Sort
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === "newest") {
      result = result.filter(m => m.isNew).concat(result.filter(m => !m.isNew));
    }
    
    return result;
  }, [searchQuery, activeCategory, activeFilter, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    modules.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleActivate = (moduleId: string) => {
    activateModule(moduleId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">
            <span className="font-bold">Module</span> center
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by module name, creator or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-muted"
            />
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">seeksy modules</span>
              </div>
              
              {/* Filter Tabs */}
              <div className="space-y-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      activeFilter === tab.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Categories */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  General modules
                </p>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(
                      activeCategory === category.id ? null : category.id
                    )}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between",
                      activeCategory === category.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {category.name}
                      {category.id === "ai-powered" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          New
                        </Badge>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Breadcrumb & Sort */}
          <div className="flex items-center justify-between px-6 py-3 border-b">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">seeksy modules</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                {activeCategory 
                  ? categories.find(c => c.id === activeCategory)?.name 
                  : "All modules"}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by: {sortBy === "default" ? "Default" : sortBy === "name" ? "Name" : sortBy === "popular" ? "Popular" : "Newest"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSortBy("default")}>Default</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>Most Popular</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Module Grid */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModules.map((module) => (
                  <ModuleCard 
                    key={module.id} 
                    module={module} 
                    onActivate={handleActivate}
                  />
                ))}
              </div>
              
              {filteredModules.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No modules found matching your criteria</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
