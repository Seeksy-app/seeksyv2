import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { WelcomeBanner } from '@/components/board/WelcomeBanner';
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent, useBoardMetrics } from '@/hooks/useBoardContent';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeLabel, DataModeBadge } from '@/components/board/DataModeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
  Wrench,
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

// Demo metrics
const demoMetrics = [
  { id: '1', metric_key: 'total_creators', metric_label: 'Total Creators', metric_value: '2,450' },
  { id: '2', metric_key: 'monthly_active', metric_label: 'Monthly Active Users', metric_value: '1,200' },
  { id: '3', metric_key: 'revenue_mtd', metric_label: 'Revenue MTD', metric_value: '$45,000' },
  { id: '4', metric_key: 'growth_rate', metric_label: 'MoM Growth', metric_value: '+18%' },
];

// Real metrics placeholders
const realMetrics = [
  { id: '1', metric_key: 'total_creators', metric_label: 'Total Creators', metric_value: '—' },
  { id: '2', metric_key: 'monthly_active', metric_label: 'Monthly Active Users', metric_value: '—' },
  { id: '3', metric_key: 'revenue_mtd', metric_label: 'Revenue MTD', metric_value: '—' },
  { id: '4', metric_key: 'growth_rate', metric_label: 'MoM Growth', metric_value: '—' },
];

export default function BoardDashboard() {
  const navigate = useNavigate();
  const { content, isLoading: contentLoading } = useBoardContent('state-of-company');
  const { metrics: dbMetrics, isLoading: metricsLoading } = useBoardMetrics();
  const { isDemo, isReal } = useBoardDataMode();
  const [firstName, setFirstName] = useState<string>('');

  // Fetch user's first name
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.account_full_name) {
          setFirstName(profile.account_full_name.split(' ')[0]);
        }
      }
    };
    fetchUserName();
  }, []);

  // Use demo or real metrics based on mode
  const metrics = isDemo ? demoMetrics : (dbMetrics && dbMetrics.length > 0 ? dbMetrics : realMetrics);

  const handleStartVideo = () => {
    navigate('/board/videos');
  };

  return (
    <BoardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner firstName={firstName} />

        {/* Data Mode Label - Right aligned */}
        <div className="flex justify-end">
          <DataModeLabel />
        </div>

        {/* Hero Section - Larger with diagonal gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm px-8 py-8 md:px-12 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,hsl(210,40%,96%)_40%,hsl(210,40%,96%)_60%,transparent_60%)] opacity-50" />
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              A Clear Window Into the Creator & Podcast Business.
            </h2>
            <p className="text-base md:text-lg text-slate-600 mb-5 max-w-2xl mx-auto">
              Real-time view into our model, go-to-market, and forecasts—powered by internal R&D insights.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={handleStartVideo}
                className="bg-blue-600 text-white hover:bg-blue-700 gap-2 shadow-md h-12 px-6"
              >
                <Play className="w-5 h-5" />
                Start with Overview Video
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/board/gtm')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 gap-2 h-12 px-6"
              >
                <Wrench className="w-5 h-5" />
                Open Demo & Tools
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card
                  key={link.path}
                  className="bg-white border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group rounded-xl"
                  onClick={() => navigate(link.path)}
                >
                  <CardContent className="p-5">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{link.title}</h3>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{link.description}</p>
                    <span className="text-sm text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center font-medium">
                      View <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Metrics Grid with diagonal gradient backdrop - Larger */}
        <div className="bg-gradient-to-br from-slate-100/80 via-white to-blue-50/50 border border-slate-100 rounded-2xl p-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,hsl(210,40%,96%)_30%,hsl(210,40%,96%)_70%,transparent_70%)] opacity-30 rounded-2xl pointer-events-none" />
          <div data-tour="kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {metricsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="bg-white border-slate-100 shadow-sm rounded-xl">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-9 w-28" />
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics?.map((metric) => {
                const Icon = metricIcons[metric.metric_key] || Activity;
                return (
                  <Card key={metric.id} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-xl relative">
                    <CardContent className="p-6">
                      <DataModeBadge className="absolute top-3 right-3" />
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{metric.metric_label}</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{metric.metric_value}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* State of the Company */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-5 px-6">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-blue-500" />
              State of the Company
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              A high-level summary of ongoing development, performance, and strategic updates.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {contentLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : content?.content ? (
              <div className="prose prose-slate prose-sm max-w-none">
                <MarkdownRenderer content={content.content} />
              </div>
            ) : (
              <div className="space-y-5 text-slate-700 text-sm leading-relaxed">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Current Status</h3>
                  <p>
                    Seeksy is in active development with a strong foundation across creator tools, 
                    podcast hosting, and monetization systems. The platform has onboarded early 
                    creators and is preparing for broader market launch.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Key Highlights</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Voice and Face Identity verification system live on Polygon mainnet</li>
                    <li>AI-powered clip generation and content certification operational</li>
                    <li>Podcast RSS hosting with migration support from major platforms</li>
                    <li>Advertiser dashboard and campaign management in development</li>
                    <li>Board portal and investor tools completed</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Next Quarter Focus</h3>
                  <p>
                    Accelerate creator acquisition, launch advertising marketplace, and expand 
                    monetization tools including digital products and paid DMs.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BoardLayout>
  );
}
