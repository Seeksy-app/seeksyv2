import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { WelcomeBanner } from '@/components/board/WelcomeBanner';
import { BoardFloatingAIButton } from '@/components/board/BoardFloatingAIButton';
import { BoardAISlidePanel } from '@/components/board/BoardAISlidePanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Target,
  TrendingUp,
  Video,
  ArrowRight,
  Activity,
  Play,
  ExternalLink,
} from 'lucide-react';
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
  const [firstName, setFirstName] = useState<string>('');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [aiInitialPrompt, setAIInitialPrompt] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch demo videos from database (videos are static investor media, not tied to data mode)
  const { data: dbVideos } = useQuery({
    queryKey: ['boardDashboardVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index')
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const featuredVideo = dbVideos && dbVideos.length > 0 ? dbVideos[0] : null;
  const additionalVideos = dbVideos && dbVideos.length > 1 ? dbVideos.slice(1) : [];

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenAIPanel = () => {
    setAIInitialPrompt('');
    setIsAIPanelOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Welcome Banner */}
      <WelcomeBanner firstName={firstName} />

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

      {/* Featured Investor Video - Static investor media, not tied to data mode */}
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

      {/* Additional Video Cards */}
      {additionalVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">More Investor Videos</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/board/videos')}
            >
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {additionalVideos.map((video) => (
              <Card 
                key={video.id}
                className="bg-white border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group rounded-xl overflow-hidden"
                onClick={() => navigate('/board/videos')}
              >
                <div className="aspect-video bg-slate-900 relative">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Play className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <Badge className={cn('text-[10px] mb-1.5', categoryColors[video.category] || 'bg-slate-100 text-slate-600')}>
                    {video.category}
                  </Badge>
                  <h3 className="text-sm font-medium text-slate-900 line-clamp-1">{video.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      <BoardFloatingAIButton onClick={handleOpenAIPanel} />

      {/* AI Slide Panel */}
      <BoardAISlidePanel 
        isOpen={isAIPanelOpen} 
        onClose={() => setIsAIPanelOpen(false)}
        initialPrompt={aiInitialPrompt}
      />
    </div>
  );
}
