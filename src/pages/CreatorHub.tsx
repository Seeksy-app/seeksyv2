import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Instagram, BarChart3, Users, Target, DollarSign, TrendingUp, FolderOpen, Mic, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    id: 'social-connect',
    name: 'Social Connect',
    description: 'Link Instagram, TikTok, YouTube',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    status: 'available',
    path: '/integrations'
  },
  {
    id: 'social-analytics',
    name: 'Social Analytics',
    description: 'Track followers and engagement',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    status: 'available',
    path: '/social-analytics'
  },
  {
    id: 'audience-insights',
    name: 'Audience Insights',
    description: 'Demographics and behavior data',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    status: 'available',
    path: '/social-analytics'
  },
  {
    id: 'brand-campaigns',
    name: 'Brand Campaigns',
    description: 'Browse sponsorship opportunities',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    status: 'available',
    path: '/creator-campaigns'
  },
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Monitor earnings and payouts',
    icon: DollarSign,
    color: 'from-orange-500 to-amber-500',
    status: 'available',
    path: '/monetization'
  },
  {
    id: 'growth-tools',
    name: 'Growth Tools',
    description: 'AI-powered audience growth',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-500',
    status: 'coming',
    path: '/creator-hub'
  },
  {
    id: 'content-library',
    name: 'Content Library',
    description: 'Manage your media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    status: 'available',
    path: '/media'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Publish and distribute shows',
    icon: Mic,
    color: 'from-violet-500 to-purple-500',
    status: 'available',
    path: '/podcasts'
  },
  {
    id: 'studio-recording',
    name: 'Studio & Recording',
    description: 'Record audio and video content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    status: 'available',
    path: '/studio'
  }
];

export default function CreatorHub() {
  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-6 h-full flex flex-col">
        {/* Spark Welcome - Compact */}
        <Card className="mb-5 border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 flex-shrink-0">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white">Hi! I'm Spark 👋</span>
                <span className="text-slate-600 dark:text-slate-300 ml-2">— welcome to your Creator Hub. All your tools in one place.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Creator Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your central command for content and monetization</p>
        </div>

        {/* 3x3 Grid - Fixed height */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {modules.map((module) => {
            const Icon = module.icon;
            const isComingSoon = module.status === 'coming';
            
            return (
              <Card
                key={module.id}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${isComingSoon ? 'opacity-80' : ''}`}
                onClick={() => !isComingSoon && navigate(module.path)}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${module.color} shadow-sm`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge 
                        variant={isComingSoon ? "secondary" : "outline"} 
                        className={`text-[10px] px-1.5 py-0 ${isComingSoon ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                      >
                        {isComingSoon ? 'Thursday' : 'Available'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate">{module.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
