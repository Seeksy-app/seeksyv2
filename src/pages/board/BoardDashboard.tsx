import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { WelcomeBanner } from '@/components/board/WelcomeBanner';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeBadge } from '@/components/board/DataModeToggle';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardFloatingAIButton } from '@/components/board/BoardFloatingAIButton';
import { BoardAISlidePanel } from '@/components/board/BoardAISlidePanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRealPlatformMetrics, formatNumber, formatCurrency } from '@/hooks/useRealPlatformMetrics';
import {
  Building2,
  Target,
  TrendingUp,
  Video,
  ArrowRight,
  Users,
  DollarSign,
  Activity,
  Percent,
  Play,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const quickLinks = [
  {
    title: 'Business Model',
    description: 'Revenue & monetization strategy',
    icon: Building2,
    path: '/board/business-model',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'GTM Strategy',
    description: 'Go-to-market plan & channels',
    icon: Target,
    path: '/board/gtm',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'AI-Powered 3-Year Pro Forma',
    description: 'AI-generated financial projections',
    icon: TrendingUp,
    path: '/board/proforma',
    gradient: 'from-amber-500 to-orange-600',
  },
];

const metricConfig = {
  total_creators: {
    icon: Users,
    tooltip: 'Total registered creators on the platform. In demo mode, this is a sample value.',
  },
  monthly_active: {
    icon: Activity,
    tooltip: 'Creators who have been active in the last 30 days. Uses platform login/activity data.',
  },
  revenue_mtd: {
    icon: DollarSign,
    tooltip: 'Month-to-date revenue from subscriptions, ads, and events. Derived from CFO assumptions in demo mode.',
  },
  growth_rate: {
    icon: Percent,
    tooltip: 'Month-over-month growth rate. Calculated from CFO growth assumptions.',
  },
};

// Demo metrics
const demoMetrics = [
  { id: '1', metric_key: 'total_creators', metric_label: 'Total Creators', metric_value: '2,450' },
  { id: '2', metric_key: 'monthly_active', metric_label: 'Monthly Active', metric_value: '1,200' },
  { id: '3', metric_key: 'revenue_mtd', metric_label: 'Revenue MTD', metric_value: '$45,000' },
  { id: '4', metric_key: 'growth_rate', metric_label: 'MoM Growth', metric_value: '+18%' },
];

const categoryColors: Record<string, string> = {
  Overview: 'bg-blue-100 text-blue-700',
  Product: 'bg-purple-100 text-purple-700',
  Financials: 'bg-emerald-100 text-emerald-700',
  GTM: 'bg-amber-100 text-amber-700',
};

// State of the Company content (hard-coded for now, can be from admin panel later)
const stateOfCompanyContent = {
  status: `Seeksy is in active development with a strong foundation across creator tools, podcast hosting, and monetization systems. The platform has onboarded early creators and is preparing for broader market launch.`,
  highlights: [
    'Voice and Face Identity verification system live on Polygon mainnet',
    'AI-powered clip generation and content certification operational',
    'Podcast RSS hosting with migration support from major platforms',
    'Board portal and investor tools completed',
  ],
  nextQuarter: `Accelerate creator acquisition, launch advertising marketplace, and expand monetization tools including digital products and paid DMs.`,
};

export default function BoardDashboard() {
  const navigate = useNavigate();
  const { isDemo, isLive, isCFO } = useBoardDataMode();
  const [firstName, setFirstName] = useState<string>('');
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [aiInitialPrompt, setAIInitialPrompt] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch real platform metrics
  const { data: realData, isLoading: realLoading } = useRealPlatformMetrics();

  // Fetch demo videos from database (only in demo mode)
  const { data: dbVideos } = useQuery({
    queryKey: ['boardDashboardVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index')
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: isDemo,
  });

  const featuredVideo = isDemo && dbVideos && dbVideos.length > 0 ? dbVideos[0] : null;

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
      setMetricsLoading(false);
    };
    fetchUserName();
  }, []);

  // Build metrics based on mode
  const metrics = isDemo ? demoMetrics : [
    { id: '1', metric_key: 'total_creators', metric_label: 'Total Creators', metric_value: realData ? formatNumber(realData.totalCreators) : '—' },
    { id: '2', metric_key: 'monthly_active', metric_label: 'Total Podcasts', metric_value: realData ? formatNumber(realData.totalPodcasts) : '—' },
    { id: '3', metric_key: 'revenue_mtd', metric_label: 'Total Episodes', metric_value: realData ? formatNumber(realData.totalEpisodes) : '—' },
    { id: '4', metric_key: 'growth_rate', metric_label: 'New Signups (30d)', metric_value: realData ? formatNumber(realData.newSignups30d) : '—' },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearchQuery = (query: string) => {
    setAIInitialPrompt(query);
    setIsAIPanelOpen(true);
  };

  const handleOpenAIPanel = () => {
    setAIInitialPrompt('');
    setIsAIPanelOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 w-full">
        {/* Welcome Banner */}
        <WelcomeBanner firstName={firstName} />

        {/* Board Header with Demo/Real toggle and search */}
        <BoardHeader onSearchQuery={handleSearchQuery} />

        {/* Key Metrics */}
        <div data-tour="kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-white border-slate-100 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            metrics?.map((metric) => {
              const config = metricConfig[metric.metric_key as keyof typeof metricConfig];
              const Icon = config?.icon || Activity;
              return (
                <Card key={metric.id} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-xl relative">
                  <CardContent className="p-5">
                    <DataModeBadge className="absolute top-3 right-3" />
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{metric.metric_label}</span>
                      {config?.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{config.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metric.metric_value}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* State of the Company Card */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-4 px-5">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-blue-500" />
              State of the Company
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Current Status</h3>
                <p>{stateOfCompanyContent.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Key Highlights</h3>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {stateOfCompanyContent.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Next Quarter Focus</h3>
                <p>{stateOfCompanyContent.nextQuarter}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Investor Video */}
        {isDemo && (
          <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 py-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                  <Video className="w-4 h-4 text-purple-500" />
                  Featured Investor Video
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => navigate('/board/videos')}
                >
                  View All Videos <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-3">
                {/* Video Player */}
                <div className="lg:col-span-2 bg-slate-900">
                  <div className="aspect-video relative">
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-slate-400 text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}
                    {featuredVideo?.video_url ? (
                      <video
                        ref={videoRef}
                        src={featuredVideo.video_url}
                        controls
                        className="w-full h-full"
                        poster={featuredVideo.thumbnail_url || undefined}
                        onLoadedData={() => setIsVideoLoading(false)}
                        onCanPlay={() => setIsVideoLoading(false)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Play className="w-16 h-16 mb-4" />
                        <p className="text-sm">No video available yet</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="p-5 bg-slate-50 border-l border-slate-100">
                  {featuredVideo ? (
                    <>
                      <Badge className={cn('text-xs mb-3', categoryColors[featuredVideo.category] || 'bg-slate-100 text-slate-600')}>
                        {featuredVideo.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {featuredVideo.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {featuredVideo.description || 'Platform demo video'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 mb-4">Loading videos...</p>
                  )}
                  {featuredVideo?.duration_seconds && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                      <Video className="w-3 h-3" />
                      <span>{formatDuration(featuredVideo.duration_seconds)}</span>
                    </div>
                  )}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate('/board/videos')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch All Videos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card
                  key={link.path}
                  className="bg-white border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group rounded-xl"
                  onClick={() => navigate(link.path)}
                >
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{link.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{link.description}</p>
                    <span className="text-xs text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center font-medium mt-2">
                      View <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Floating AI Button */}
        <BoardFloatingAIButton onClick={handleOpenAIPanel} />

        {/* AI Slide Panel */}
        <BoardAISlidePanel 
          isOpen={isAIPanelOpen} 
          onClose={() => setIsAIPanelOpen(false)}
          initialPrompt={aiInitialPrompt}
        />
      </div>
    </TooltipProvider>
  );
}
