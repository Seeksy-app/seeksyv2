import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Instagram, 
  BarChart3, 
  Target, 
  DollarSign, 
  TrendingUp, 
  FolderOpen, 
  Mic, 
  Video, 
  Calendar,
  ArrowRight,
  Clock,
  Check,
  Loader2,
  ExternalLink,
  Grid3x3
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useModuleActivation } from "@/hooks/useModuleActivation";

/**
 * CREATOR HUB - Personal Control Center
 * 
 * Purpose: "What tools and earning opportunities do I have?"
 * Content: ONLY shows activated tools - this is a personal workspace, not an app store.
 * 
 * To discover and activate new modules, users go to Apps / Seekies & Tools page.
 */

const allModules = [
  {
    id: 'social-connect',
    name: 'Social Connect',
    description: 'Link social accounts',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    path: '/integrations',
    category: 'tools'
  },
  {
    id: 'social-analytics',
    name: 'Social Analytics',
    description: 'Track engagement & growth',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    path: '/social-analytics',
    category: 'tools'
  },
  {
    id: 'meetings',
    name: 'Meetings',
    description: 'Book calls & appointments',
    icon: Calendar,
    color: 'from-teal-500 to-emerald-500',
    path: '/meetings',
    category: 'tools'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Record & edit content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    path: '/studio',
    category: 'tools'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Publish & distribute shows',
    icon: Mic,
    color: 'from-violet-500 to-purple-500',
    path: '/podcasts',
    category: 'tools'
  },
  {
    id: 'content-library',
    name: 'Content Library',
    description: 'Manage media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    path: '/media',
    category: 'tools'
  },
  {
    id: 'brand-campaigns',
    name: 'Brand Campaigns',
    description: 'Sponsorship opportunities',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    path: '/creator-campaigns',
    category: 'monetization'
  },
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Earnings and payouts',
    icon: DollarSign,
    color: 'from-orange-500 to-amber-500',
    path: '/monetization',
    category: 'monetization'
  },
];

export default function CreatorHub() {
  const navigate = useNavigate();
  const { 
    activatedModuleIds, 
    isLoading, 
    isModuleActivated
  } = useModuleActivation();

  // Show ONLY activated modules - Creator Hub is a personal control center
  const activatedTools = allModules.filter(
    mod => mod.category === 'tools' && isModuleActivated(mod.id)
  );
  const activatedMonetization = allModules.filter(
    mod => mod.category === 'monetization' && isModuleActivated(mod.id)
  );

  const hasAnyActivatedModules = activatedTools.length > 0 || activatedMonetization.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3" data-onboarding="creator-hub-header">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Creator Hub</h1>
            <p className="text-muted-foreground">Shortcuts to your tools and monetization opportunities.</p>
          </div>
        </div>

        {/* Your Active Tools */}
        {activatedTools.length > 0 && (
          <Card data-onboarding="active-modules">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                Your Active Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="grid gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {activatedTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => navigate(tool.path)}
                      className="group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                          Activated
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                      <div className="flex items-center text-xs text-primary font-medium group-hover:underline">
                        Open <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Monetization Tools */}
        {activatedMonetization.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Your Monetization Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="grid gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {activatedMonetization.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => navigate(tool.path)}
                      className="group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                          Activated
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                      <div className="flex items-center text-xs text-primary font-medium group-hover:underline">
                        Open <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No activated modules */}
        {!hasAnyActivatedModules && (
          <Card className="bg-muted/30" data-onboarding="discover-modules">
            <CardContent className="p-8 text-center">
              <Grid3x3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tools activated yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Visit the Apps & Tools page to discover and activate tools for your workspace.
                Once activated, they'll appear here for quick access.
              </p>
              <Button onClick={() => navigate('/apps')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Browse Apps & Tools
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Browse More Tools CTA */}
        {hasAnyActivatedModules && (
          <Card className="bg-primary/5 border-primary/20" data-onboarding="discover-modules">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Want more tools?</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/apps')}>
                  Browse Apps & Tools <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cross-links */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Need to check your schedule or metrics?</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my-day">
                    View My Day <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    Open Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
