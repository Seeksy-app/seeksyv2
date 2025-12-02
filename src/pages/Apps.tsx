import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mail, FileText, Users, Video, DollarSign, ArrowRight, Calendar, Mic, Shield, Zap, 
  Camera, Globe, MessageSquare, BarChart3, Podcast, FolderOpen, Book, Newspaper, 
  MessageCircle, FormInput, CheckSquare, Vote, QrCode, Layout, Trophy, UserPlus,
  ListChecks, Megaphone, Scissors, Star, Briefcase, Instagram, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  iconColor: string;
  bgColor: string;
  isActive: boolean;
  status?: "active" | "coming_soon" | "beta";
  category?: "core" | "integration" | "automation";
  stats?: {
    label: string;
    value: string;
  };
}

export default function Apps() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const modules: AppModule[] = [
    // Active Modules
    {
      id: "email",
      name: "Email",
      description: "Send campaigns, track engagement, manage subscribers",
      icon: Mail,
      route: "/email",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      isActive: true,
      status: "active",
      category: "core",
      stats: {
        label: "Inbox",
        value: "View all",
      },
    },
    {
      id: "proposals",
      name: "Proposals",
      description: "Create and send professional proposals to clients",
      icon: FileText,
      route: "/proposals",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      isActive: true,
      status: "active",
      category: "core",
      stats: {
        label: "Manage",
        value: "View all",
      },
    },
    {
      id: "audience",
      name: "Contacts & Audience",
      description: "Manage your contacts, leads, and subscriber lists",
      icon: Users,
      route: "/audience",
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      isActive: true,
      status: "active",
      category: "core",
      stats: {
        label: "Directory",
        value: "View all",
      },
    },
    {
      id: "content",
      name: "Content & Media",
      description: "Create, manage, and publish all your content",
      icon: Video,
      route: "/content",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      isActive: true,
      status: "active",
      category: "core",
      stats: {
        label: "Library",
        value: "View all",
      },
    },
    {
      id: "monetization",
      name: "Monetization Hub",
      description: "Manage revenue streams, campaigns, and earnings",
      icon: DollarSign,
      route: "/monetization",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      isActive: true,
      status: "active",
      category: "core",
      stats: {
        label: "Revenue",
        value: "View all",
      },
    },
    // Available Seekies
    {
      id: "studio",
      name: "Studio & Recording",
      description: "Record podcasts, videos, and live streams with AI tools",
      icon: Mic,
      route: "/studio",
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "identity",
      name: "Identity & Verification",
      description: "Verify your voice and face, manage creator rights",
      icon: Shield,
      route: "/identity",
      iconColor: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "influencer",
      name: "Influencer",
      description: "Manage your influencer profile, campaigns, and brand deals",
      icon: Star,
      route: "/creator-hub",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "influencer-agency",
      name: "Influencer Agency",
      description: "Manage your influencer roster and client campaigns",
      icon: Briefcase,
      route: "/agency",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "clips",
      name: "AI Clips Generator",
      description: "Auto-generate short clips from long-form content",
      icon: Camera,
      route: "/clips",
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "podcasts",
      name: "Podcasts",
      description: "Create, publish, and distribute your podcast shows",
      icon: Podcast,
      route: "/content#podcasts",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "media-vault",
      name: "Media Vault",
      description: "Store and organize all your media files securely",
      icon: FolderOpen,
      route: "/media/library",
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "transcripts",
      name: "Transcripts",
      description: "Auto-transcribe audio and certify content authenticity",
      icon: FileText,
      route: "/transcripts",
      iconColor: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "blog",
      name: "Blog",
      description: "Write, publish, and manage your blog content",
      icon: Newspaper,
      route: "/blog",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "marketing-campaigns",
      name: "Marketing Campaigns",
      description: "Create and manage multi-channel marketing campaigns",
      icon: Megaphone,
      route: "/marketing/campaigns",
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "marketing-segments",
      name: "Audience Segments",
      description: "Create targeted audience segments for campaigns",
      icon: Users,
      route: "/marketing/segments",
      iconColor: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "marketing-templates",
      name: "Email Templates",
      description: "Design and save reusable email templates",
      icon: Book,
      route: "/marketing/templates",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "marketing-automations",
      name: "Marketing Automations",
      description: "Set up automated email sequences and workflows",
      icon: Zap,
      route: "/marketing/automations",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "social-media",
      name: "Social Media",
      description: "Connect Instagram, Facebook, and other social accounts",
      icon: Instagram,
      route: "/integrations",
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      isActive: true,
      status: "active",
      category: "integration",
    },
    {
      id: "sms",
      name: "SMS",
      description: "Send text messages and manage SMS campaigns",
      icon: MessageCircle,
      route: "/sms",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "forms",
      name: "Forms",
      description: "Build custom forms and collect submissions",
      icon: FormInput,
      route: "/forms",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "tasks",
      name: "Tasks",
      description: "Manage tasks, to-dos, and project workflows",
      icon: CheckSquare,
      route: "/tasks",
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "events",
      name: "Events",
      description: "Create and manage events, RSVPs, and calendars",
      icon: Calendar,
      route: "/events",
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "polls",
      name: "Polls & Surveys",
      description: "Create polls and collect audience feedback",
      icon: Vote,
      route: "/polls",
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "qr-codes",
      name: "QR Codes",
      description: "Generate and track QR codes for events and campaigns",
      icon: QrCode,
      route: "/qr-codes",
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "my-page",
      name: "My Page Builder",
      description: "Build your personal landing page and portfolio",
      icon: Layout,
      route: "/profile/edit",
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "awards",
      name: "Awards",
      description: "Create award programs and manage nominations",
      icon: Trophy,
      route: "/awards",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "team",
      name: "Team & Collaboration",
      description: "Manage team members and collaborate on projects",
      icon: UserPlus,
      route: "/team",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    {
      id: "meetings",
      name: "Meetings & Scheduling",
      description: "Book appointments, manage calendars, and host events",
      icon: Calendar,
      route: "/meetings",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      isActive: true,
      status: "active",
      category: "core",
    },
    // Available/Coming Soon
    {
      id: "analytics",
      name: "Analytics & Insights",
      description: "Track performance, engagement, and revenue metrics",
      icon: BarChart3,
      route: "/analytics",
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      isActive: false,
      status: "coming_soon",
      category: "core",
    },
  ];

  // Filter modules based on search
  const filteredModules = modules.filter(m => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(search) ||
      m.description.toLowerCase().includes(search)
    );
  });

  const activeModules = filteredModules.filter(m => m.isActive);
  const availableModules = filteredModules.filter(m => !m.isActive);

  // Categorize active modules
  const coreModules = activeModules.filter(m => m.category === "core");
  const integrationModules = activeModules.filter(m => m.category === "integration");
  const automationModules = activeModules.filter(m => m.category === "automation");

  const handleModuleClick = (module: AppModule) => {
    if (module.status === "coming_soon") return;
    navigate(module.route);
  };

  const getStatusBadge = (status?: string) => {
    if (status === "beta") return <Badge variant="secondary" className="ml-2">Beta</Badge>;
    if (status === "coming_soon") return <Badge variant="outline" className="ml-2">Coming Soon</Badge>;
    return null;
  };

  const renderModuleCard = (module: AppModule) => {
    const Icon = module.icon;
    return (
      <Card
        key={module.id}
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2 hover:border-primary/50"
        onClick={() => handleModuleClick(module)}
      >
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl ${module.bgColor}`}>
              <Icon className={`h-6 w-6 ${module.iconColor}`} />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
          </div>
          <CardTitle className="text-xl">{module.name}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {module.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {module.stats && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground font-medium">
                {module.stats.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1 px-2 hover:bg-primary/10"
              >
                {module.stats.value}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Seeksy App Directory</h1>
          <p className="text-muted-foreground">
            All internal tools, integrations, and modules—plus future third-party extensions
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search everything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Core Modules */}
        {coreModules.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Core Modules</h2>
              <p className="text-muted-foreground">
                Essential apps and tools for your workspace
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coreModules.map(renderModuleCard)}
            </div>
          </div>
        )}

        {/* Integrations */}
        {integrationModules.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Integrations</h2>
              <p className="text-muted-foreground">
                Connect external platforms and services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {integrationModules.map(renderModuleCard)}
            </div>
          </div>
        )}

        {/* Automation */}
        {automationModules.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Automation</h2>
              <p className="text-muted-foreground">
                Workflow automation and productivity tools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {automationModules.map(renderModuleCard)}
            </div>
          </div>
        )}

        {/* Section B: Available Apps & Integrations */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Available Apps & Integrations</h2>
            <p className="text-muted-foreground">
              Activate new modules and integrations to extend Seeksy's capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableModules.map((module) => {
              const Icon = module.icon;
              const isComingSoon = module.status === "coming_soon";
              return (
                <Card
                  key={module.id}
                  className={`group transition-all duration-200 border-2 ${
                    isComingSoon 
                      ? "opacity-75 cursor-default" 
                      : "hover:shadow-lg cursor-pointer hover:scale-[1.02] hover:border-primary/50"
                  }`}
                  onClick={() => handleModuleClick(module)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl ${module.bgColor}`}>
                        <Icon className={`h-6 w-6 ${module.iconColor}`} />
                      </div>
                      {!isComingSoon && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
                      )}
                    </div>
                    <CardTitle className="text-xl flex items-center">
                      {module.name}
                      {getStatusBadge(module.status)}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="pt-2 border-t">
                      <Button
                        variant={isComingSoon ? "outline" : "default"}
                        size="sm"
                        className="w-full"
                        disabled={isComingSoon}
                      >
                        {isComingSoon ? "Coming Soon" : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Help Card */}
        <Card className="mt-12 border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Need a Custom Integration?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our team to discuss custom integrations and enterprise features
                </p>
              </div>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
