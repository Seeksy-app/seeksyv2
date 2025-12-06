import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { WelcomeBanner } from '@/components/board/WelcomeBanner';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeBadge } from '@/components/board/DataModeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Mic,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    title: '3-Year Forecasts',
    description: 'AI-generated projections',
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
    description: 'Reports & meeting minutes',
    icon: FileText,
    path: '/board/docs',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    title: 'Creator Studio',
    description: 'Live recording preview',
    icon: Mic,
    path: '/studio',
    gradient: 'from-cyan-500 to-blue-600',
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
  { id: '2', metric_key: 'monthly_active', metric_label: 'Monthly Active', metric_value: '1,200' },
  { id: '3', metric_key: 'revenue_mtd', metric_label: 'Revenue MTD', metric_value: '$45,000' },
  { id: '4', metric_key: 'growth_rate', metric_label: 'MoM Growth', metric_value: '+18%' },
];

// Real metrics placeholders
const realMetrics = [
  { id: '1', metric_key: 'total_creators', metric_label: 'Total Creators', metric_value: '—' },
  { id: '2', metric_key: 'monthly_active', metric_label: 'Monthly Active', metric_value: '—' },
  { id: '3', metric_key: 'revenue_mtd', metric_label: 'Revenue MTD', metric_value: '—' },
  { id: '4', metric_key: 'growth_rate', metric_label: 'MoM Growth', metric_value: '—' },
];

export default function BoardDashboard() {
  const navigate = useNavigate();
  const { isDemo } = useBoardDataMode();
  const [firstName, setFirstName] = useState<string>('');
  const [metricsLoading, setMetricsLoading] = useState(true);

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

  const metrics = isDemo ? demoMetrics : realMetrics;

  return (
    <BoardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <WelcomeBanner firstName={firstName} />

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
              const Icon = metricIcons[metric.metric_key] || Activity;
              return (
                <Card key={metric.id} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-xl relative">
                  <CardContent className="p-5">
                    <DataModeBadge className="absolute top-3 right-3" />
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{metric.metric_label}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{metric.metric_value}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Links Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
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

        {/* State of the Company */}
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
                <p>
                  Seeksy is in active development with a strong foundation across creator tools, 
                  podcast hosting, and monetization systems. The platform has onboarded early 
                  creators and is preparing for broader market launch.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Key Highlights</h3>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li>Voice and Face Identity verification system live on Polygon mainnet</li>
                  <li>AI-powered clip generation and content certification operational</li>
                  <li>Podcast RSS hosting with migration support from major platforms</li>
                  <li>Board portal and investor tools completed</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Next Quarter Focus</h3>
                <p>
                  Accelerate creator acquisition, launch advertising marketplace, and expand 
                  monetization tools including digital products and paid DMs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BoardLayout>
  );
}
