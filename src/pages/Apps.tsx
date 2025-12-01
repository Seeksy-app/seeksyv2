import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Send, BarChart3, Calendar, Users, Zap, Settings, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  iconColor: string;
  bgColor: string;
  stats?: {
    label: string;
    value: string;
  };
}

export default function Apps() {
  const navigate = useNavigate();

  const modules: AppModule[] = [
    {
      id: "email",
      name: "Email",
      description: "Send campaigns, track engagement, manage subscribers",
      icon: Mail,
      route: "/email",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
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
      stats: {
        label: "Manage",
        value: "View all",
      },
    },
    {
      id: "campaigns",
      name: "Campaigns",
      description: "Create and manage email marketing campaigns",
      icon: Send,
      route: "/email-campaigns",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      stats: {
        label: "Active",
        value: "View all",
      },
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Track email performance and engagement metrics",
      icon: BarChart3,
      route: "/email/analytics",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      stats: {
        label: "Reports",
        value: "View all",
      },
    },
    {
      id: "contacts",
      name: "Contacts",
      description: "Manage your audience and subscriber lists",
      icon: Users,
      route: "/contacts",
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      stats: {
        label: "Directory",
        value: "View all",
      },
    },
    {
      id: "automations",
      name: "Automations",
      description: "Set up automated email sequences and workflows",
      icon: Zap,
      route: "/email-automations",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      stats: {
        label: "Workflows",
        value: "View all",
      },
    },
    {
      id: "meetings",
      name: "Meetings",
      description: "Schedule and manage video meetings with clients",
      icon: Calendar,
      route: "/meetings",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      stats: {
        label: "Calendar",
        value: "View all",
      },
    },
    {
      id: "settings",
      name: "Email Settings",
      description: "Configure email accounts, templates, and preferences",
      icon: Settings,
      route: "/email-settings",
      iconColor: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/20",
      stats: {
        label: "Configure",
        value: "View all",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Apps & Modules</h1>
          <p className="text-muted-foreground">
            Access all your Seeksy tools and features from one central hub
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2 hover:border-primary/50"
                onClick={() => navigate(module.route)}
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

        <Card className="mt-8 border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Need a Custom Module?</h3>
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
