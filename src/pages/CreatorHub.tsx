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
  Clock
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

/**
 * CREATOR HUB - Tools & Opportunities Hub
 * 
 * Purpose: "What tools and earning opportunities do I have?"
 * Content: Active tools, monetization, studio access, sponsorships
 * 
 * This is distinct from:
 * - My Day (today's tasks/meetings)
 * - Dashboard (metrics/performance)
 */

const tools = [
  {
    id: 'social-connect',
    name: 'Social Connect',
    description: 'Link social accounts',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    status: 'available',
    path: '/integrations'
  },
  {
    id: 'social-analytics',
    name: 'Social Analytics',
    description: 'Track engagement',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    status: 'available',
    path: '/social-analytics'
  },
  {
    id: 'meetings',
    name: 'Meetings',
    description: 'Book calls & appointments',
    icon: Calendar,
    color: 'from-teal-500 to-emerald-500',
    status: 'available',
    path: '/meetings'
  },
  {
    id: 'studio-recording',
    name: 'Studio',
    description: 'Record content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    status: 'available',
    path: '/studio'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Publish shows',
    icon: Mic,
    color: 'from-violet-500 to-purple-500',
    status: 'available',
    path: '/podcasts'
  },
  {
    id: 'content-library',
    name: 'Content Library',
    description: 'Manage media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    status: 'available',
    path: '/media'
  },
];

const opportunities = [
  {
    id: 'brand-campaigns',
    name: 'Brand Campaigns',
    description: 'Sponsorship opportunities',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    status: 'available',
    path: '/creator-campaigns'
  },
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Earnings and payouts',
    icon: DollarSign,
    color: 'from-orange-500 to-amber-500',
    status: 'available',
    path: '/monetization'
  },
  {
    id: 'growth-tools',
    name: 'Growth Tools',
    description: 'AI audience growth',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-500',
    status: 'coming',
    path: '/creator-hub'
  }
];

export default function CreatorHub() {
  const navigate = useNavigate();

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

        {/* Active Tools */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Active Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isComingSoon = tool.status === 'coming';
                
                return (
                  <div
                    key={tool.id}
                    className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${isComingSoon ? 'opacity-60' : ''}`}
                    onClick={() => !isComingSoon && navigate(tool.path)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {isComingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monetization Opportunities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Monetization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {opportunities.map((opp) => {
                const Icon = opp.icon;
                const isComingSoon = opp.status === 'coming';
                
                return (
                  <div
                    key={opp.id}
                    className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${isComingSoon ? 'opacity-60' : ''}`}
                    onClick={() => !isComingSoon && navigate(opp.path)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${opp.color} shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {isComingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm">{opp.name}</h3>
                    <p className="text-xs text-muted-foreground">{opp.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cross-links */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
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
