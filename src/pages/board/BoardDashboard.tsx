import { useNavigate } from 'react-router-dom';
import { BoardLayout } from '@/components/board/BoardLayout';
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent, useBoardMetrics } from '@/hooks/useBoardContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Target,
  TrendingUp,
  Video,
  FileText,
  ArrowRight,
  Users,
  DollarSign,
  Activity,
  Percent,
  Play,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const quickLinks = [
  {
    title: 'Business Model',
    description: 'Revenue streams & monetization strategy',
    icon: Building2,
    path: '/board/business-model',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'GTM Strategy',
    description: 'Go-to-market plan & acquisition channels',
    icon: Target,
    path: '/board/gtm',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: '3-Year Forecasts',
    description: 'AI-generated financial projections',
    icon: TrendingUp,
    path: '/board/forecasts',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Investor Videos',
    description: 'Product demos & presentations',
    icon: Video,
    path: '/board/videos',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    title: 'Documents',
    description: 'Reports, legal & meeting minutes',
    icon: FileText,
    path: '/board/docs',
    gradient: 'from-rose-500 to-red-600',
  },
];

const metricIcons: Record<string, any> = {
  total_creators: Users,
  monthly_active: Activity,
  revenue_mtd: DollarSign,
  growth_rate: Percent,
};

export default function BoardDashboard() {
  const navigate = useNavigate();
  const { content, isLoading: contentLoading } = useBoardContent('state-of-company');
  const { metrics, isLoading: metricsLoading } = useBoardMetrics();

  return (
    <BoardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-white/10 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              A Clear Window Into the Creator & Podcast Business.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Real-time view into our model, go-to-market, and forecasts—powered by internal R&D insights.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/board/videos')}
                className="bg-white text-slate-900 hover:bg-slate-100 gap-2"
              >
                <Play className="w-5 h-5" />
                Start with Overview Video
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/board/forecasts')}
                className="border-white/20 text-white hover:bg-white/10 gap-2"
              >
                Jump to Forecasts
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            metrics?.map((metric) => {
              const Icon = metricIcons[metric.metric_key] || Activity;
              return (
                <Card key={metric.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{metric.metric_label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metric.metric_value}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* State of the Company */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              State of the Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <MarkdownRenderer content={content?.content || ''} />
            )}
          </CardContent>
        </Card>

        {/* Quick Links Grid */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card
                  key={link.path}
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                  onClick={() => navigate(link.path)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{link.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{link.description}</p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-transform"
                    >
                      View <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </BoardLayout>
  );
}
