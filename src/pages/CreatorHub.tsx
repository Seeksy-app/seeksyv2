import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Instagram, BarChart3, Users, Target, DollarSign, TrendingUp, FolderOpen, Mic, Video, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
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
    path: '/creator/meetings'
  },
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
    id: 'content-library',
    name: 'Content Library',
    description: 'Manage media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    status: 'available',
    path: '/media'
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
    id: 'studio-recording',
    name: 'Studio',
    description: 'Record content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    status: 'available',
    path: '/studio'
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
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-4 h-full flex flex-col">
        {/* Spark Welcome - Compact */}
        <Card className="mb-3 border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 flex-shrink-0">
          <CardContent className="py-2 px-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Spark:</span> All your creator tools in one place
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Header - Compact */}
        <div className="text-center mb-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Creator Hub</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Content creation & monetization tools</p>
        </div>

        {/* 3x3 Grid - Compact cards */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
          {modules.map((module) => {
            const Icon = module.icon;
            const isComingSoon = module.status === 'coming';
            
            return (
              <Card
                key={module.id}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${isComingSoon ? 'opacity-70' : ''}`}
                onClick={() => !isComingSoon && navigate(module.path)}
              >
                <CardContent className="p-3 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color} shadow-sm`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <Badge 
                      variant={isComingSoon ? "secondary" : "outline"} 
                      className={`text-[9px] px-1 py-0 ${isComingSoon ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      {isComingSoon ? 'Soon' : '✓'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{module.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
