import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, FileText, Users, Video, DollarSign, ArrowRight, Calendar, Mic, Shield, Zap, Camera, Globe, MessageSquare, BarChart3 } from "lucide-react";
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
      id: "meetings",
      name: "Meetings & Scheduling",
      description: "Book appointments, manage calendars, and host events",
      icon: Calendar,
      route: "/meetings",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      isActive: false,
      status: "coming_soon",
      category: "core",
    },
    {
      id: "studio",
      name: "Studio & Recording",
      description: "Record podcasts, videos, and live streams with AI tools",
      icon: Mic,
      route: "/studio",
      iconColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      isActive: false,
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
      isActive: false,
      status: "active",
      category: "core",
    },
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
    {
      id: "automation",
      name: "Automation & Workflows",
      description: "Automate tasks, triggers, and cross-platform actions",
      icon: Zap,
      route: "/automations",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      isActive: false,
      status: "coming_soon",
      category: "automation",
    },
    {
      id: "social",
      name: "Social Media Manager",
      description: "Schedule and publish content across all platforms",
      icon: MessageSquare,
      route: "/social",
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      isActive: false,
      status: "coming_soon",
      category: "integration",
    },
    {
      id: "website",
      name: "Website Builder",
      description: "Create and customize your professional website",
      icon: Globe,
      route: "/website",
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      isActive: false,
      status: "coming_soon",
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
      isActive: false,
      status: "beta",
      category: "core",
    },
  ];

  const activeModules = modules.filter(m => m.isActive);
  const availableModules = modules.filter(m => !m.isActive);

  const handleModuleClick = (module: AppModule) => {
    if (module.status === "coming_soon") return;
    navigate(module.route);
  };

  const getStatusBadge = (status?: string) => {
    if (status === "beta") return <Badge variant="secondary" className="ml-2">Beta</Badge>;
    if (status === "coming_soon") return <Badge variant="outline" className="ml-2">Coming Soon</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Seekies & Tools</h1>
          <p className="text-muted-foreground">
            All apps, integrations, and tools available inside Seeksy
          </p>
        </div>

        {/* Section A: Your Active Seekies */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Your Active Seekies</h2>
            <p className="text-muted-foreground">
              Manage your active Seeksy tools from one central hub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeModules.map((module) => {
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
            })}
          </div>
        </div>

        {/* Section B: All Seekies & Integrations */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Explore More Seekies & Tools</h2>
            <p className="text-muted-foreground">
              Enable new apps, integrations, and automations to expand what Seeksy can do
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
