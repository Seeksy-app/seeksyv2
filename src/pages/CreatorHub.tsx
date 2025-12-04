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
  Plus,
  Loader2
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useModuleActivation } from "@/hooks/useModuleActivation";

/**
 * CREATOR HUB - Tools & Opportunities Hub (App Store)
 * 
 * Purpose: "What tools and earning opportunities do I have?"
 * Content: Available tools for activation, monetization opportunities
 * 
 * Activated modules are removed from here and appear in navigation.
 * This acts as an "App Store" - Navigation is "My Installed Apps"
 */

const allTools = [
  {
    id: 'social-connect',
    name: 'Social Connect',
    description: 'Link social accounts',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    path: '/integrations'
  },
  {
    id: 'social-analytics',
    name: 'Social Analytics',
    description: 'Track engagement',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    path: '/social-analytics',
    prerequisite: 'social-connect'
  },
  {
    id: 'meetings',
    name: 'Meetings',
    description: 'Book calls & appointments',
    icon: Calendar,
    color: 'from-teal-500 to-emerald-500',
    path: '/meetings'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Record content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    path: '/studio'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Publish shows',
    icon: Mic,
    color: 'from-violet-500 to-purple-500',
    path: '/podcasts'
  },
  {
    id: 'content-library',
    name: 'Content Library',
    description: 'Manage media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    path: '/media'
  },
];

const allOpportunities = [
  {
    id: 'brand-campaigns',
    name: 'Brand Campaigns',
    description: 'Sponsorship opportunities',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    path: '/creator-campaigns'
  },
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Earnings and payouts',
    icon: DollarSign,
    color: 'from-orange-500 to-amber-500',
    path: '/monetization'
  },
  {
    id: 'growth-tools',
    name: 'Growth Tools',
    description: 'AI audience growth',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-500',
    path: '/creator-hub',
    comingSoon: true
  }
];

export default function CreatorHub() {
  const navigate = useNavigate();
  const { 
    activatedModuleIds, 
    isLoading, 
    isModuleActivated, 
    activateModule, 
    isActivating 
  } = useModuleActivation();

  // Filter to show only NON-activated tools (App Store behavior)
  const availableTools = allTools.filter(tool => !isModuleActivated(tool.id));
  const availableOpportunities = allOpportunities.filter(opp => !isModuleActivated(opp.id));

  // Get activated tools to show in a summary section
  const activatedTools = allTools.filter(tool => isModuleActivated(tool.id));
  const activatedOpportunities = allOpportunities.filter(opp => isModuleActivated(opp.id));

  const handleActivate = (moduleId: string, path: string) => {
    activateModule(moduleId);
    // Navigate after activation
    setTimeout(() => navigate(path), 300);
  };

  const checkPrerequisite = (tool: typeof allTools[0]) => {
    if (!tool.prerequisite) return { met: true, message: null };
    const prereqMet = isModuleActivated(tool.prerequisite);
    const prereqTool = allTools.find(t => t.id === tool.prerequisite);
    return {
      met: prereqMet,
      message: prereqMet ? null : `Requires ${prereqTool?.name || tool.prerequisite}`
    };
  };

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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Creator Hub</h1>
            <p className="text-muted-foreground">Shortcuts to your tools and monetization opportunities.</p>
          </div>
        </div>

        {/* Active Tools Summary (if any are activated) */}
        {(activatedTools.length > 0 || activatedOpportunities.length > 0) && (
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                Your Active Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...activatedTools, ...activatedOpportunities.filter(o => !o.comingSoon)].map((item) => (
                  <Badge 
                    key={item.id} 
                    variant="secondary" 
                    className="bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200"
                    onClick={() => navigate(item.path)}
                  >
                    {item.name}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These appear in your navigation. Click to open.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Tools */}
        {availableTools.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Available Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="grid gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {availableTools.map((tool) => {
                  const Icon = tool.icon;
                  const prereq = checkPrerequisite(tool);
                  
                  return (
                    <div
                      key={tool.id}
                      className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        !prereq.met ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Available
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                      
                      {prereq.message ? (
                        <p className="text-xs text-amber-600">{prereq.message}</p>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleActivate(tool.id, tool.path)}
                          disabled={isActivating}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Workspace
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monetization Opportunities */}
        {availableOpportunities.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Monetization Opportunities
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
                {availableOpportunities.map((opp) => {
                  const Icon = opp.icon;
                  const isComingSoon = opp.comingSoon;
                  
                  return (
                    <div
                      key={opp.id}
                      className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        isComingSoon ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${opp.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        {isComingSoon ? (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                            Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Available
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{opp.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{opp.description}</p>
                      
                      {!isComingSoon && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleActivate(opp.id, opp.path)}
                          disabled={isActivating}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Workspace
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All activated message */}
        {availableTools.length === 0 && availableOpportunities.filter(o => !o.comingSoon).length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
              <Check className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold">All tools activated!</h3>
              <p className="text-sm text-muted-foreground">
                You've added all available tools to your workspace. Find them in your navigation.
              </p>
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
