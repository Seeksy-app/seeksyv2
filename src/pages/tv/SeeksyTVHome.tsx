import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Search, Bell, Tv, Radio, Scissors, 
  Star, TrendingUp, Sparkles, Film,
  Flame, Clock, Award
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import { TVHeroPlayer } from "@/components/tv/TVHeroPlayer";
import { TVContentRow } from "@/components/tv/TVContentRow";
import { TVCreatorCard } from "@/components/tv/TVCreatorCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  "All", "Podcasts", "Interviews", "AI Clips", "Events", "Live", 
  "Technology", "Business", "Health", "True Crime", "Design", "Entertainment"
];

export default function SeeksyTVHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  interface FeaturedItem {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    category: string | null;
    channel_name: string;
    duration_seconds: number | null;
    is_live?: boolean;
  }

  // Fetch featured content for hero
  const { data: featuredContent } = useQuery({
    queryKey: ['tv-featured-content'],
    queryFn: async (): Promise<FeaturedItem[]> => {
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          id, title, description, thumbnail_url, video_url, duration_seconds, category,
          channel:tv_channels(name)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        channel_name: item.channel?.name || "Seeksy Creator"
      }));
    }
  });

  // Fetch channels with videos
  const { data: channels } = useQuery({
    queryKey: ['tv-channels-with-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select(`
          *,
          videos:tv_content(id, title, thumbnail_url, duration_seconds, view_count)
        `)
        .eq('is_active', true)
        .order('follower_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch featured creators
  const { data: featuredCreators } = useQuery({
    queryKey: ['tv-featured-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, follower_count, category')
        .eq('is_active', true)
        .order('follower_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch latest episodes
  const { data: latestEpisodes } = useQuery({
    queryKey: ['tv-latest-episodes', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('tv_content')
        .select(`
          id, title, description, thumbnail_url, duration_seconds, view_count, category, content_type,
          channel:tv_channels(name, slug)
        `)
        .eq('is_published', true)
        .in('content_type', ['episode', 'spotlight'])
        .order('published_at', { ascending: false })
        .limit(12);
      
      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch AI clips
  const { data: aiClips } = useQuery({
    queryKey: ['tv-ai-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          id, title, thumbnail_url, duration_seconds, view_count, content_type,
          channel:tv_channels(name, slug)
        `)
        .eq('is_published', true)
        .eq('content_type', 'clip')
        .order('view_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch trending (most viewed)
  const { data: trendingContent } = useQuery({
    queryKey: ['tv-trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          id, title, thumbnail_url, duration_seconds, view_count, content_type, category,
          channel:tv_channels(name, slug)
        `)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch trending creators
  const { data: trendingCreators } = useQuery({
    queryKey: ['tv-trending-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, category, total_views, follower_count')
        .eq('is_active', true)
        .order('total_views', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const hasContent = (latestEpisodes?.length ?? 0) > 0 || (aiClips?.length ?? 0) > 0 || (channels?.length ?? 0) > 0;

  // Default featured content if none in DB
  const heroItems = featuredContent?.length ? featuredContent : [
    {
      id: "default",
      title: "Welcome to Seeksy TV",
      description: "Your destination for creator content, podcasts, AI clips, and live streams. Discover amazing creators and their best content.",
      thumbnail_url: null,
      video_url: null,
      category: "Featured",
      channel_name: "Seeksy",
      duration_seconds: 0,
      is_live: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-[#0a0a14] via-[#0a0a14]/95 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Seeksy TV
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white font-medium hover:text-amber-400 transition-colors">Home</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Shows</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Podcasts</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Clips</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Live</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">My List</a>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-amber-500 h-9"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <TVHeroPlayer 
        featuredItems={heroItems}
        onPlay={(id) => navigate(`/tv/watch/${id}`)}
      />

      {/* Category Filter */}
      <section className="container mx-auto px-4 py-6 -mt-8 relative z-10">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={
                  selectedCategory === category
                    ? "bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-lg shadow-amber-500/30"
                    : "border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white shrink-0"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Trending Now */}
      {trendingContent && trendingContent.length > 0 && (
        <TVContentRow
          title="Trending Now"
          icon={Flame}
          items={trendingContent}
          onItemClick={(id) => navigate(`/tv/watch/${id}`)}
          variant="large"
          showRank
        />
      )}

      {/* Featured Creators */}
      {featuredCreators && featuredCreators.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4 mb-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
              <Star className="h-6 w-6 text-amber-400" />
              Featured Creators
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {featuredCreators.map((creator) => (
              <TVCreatorCard
                key={creator.id}
                {...creator}
                onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* Latest Episodes */}
      {latestEpisodes && latestEpisodes.length > 0 && (
        <TVContentRow
          title="Latest Episodes"
          icon={Radio}
          items={latestEpisodes}
          onItemClick={(id) => navigate(`/tv/watch/${id}`)}
        />
      )}

      {/* AI Clips - Vertical Format */}
      {aiClips && aiClips.length > 0 && (
        <TVContentRow
          title="AI-Generated Clips"
          icon={Sparkles}
          items={aiClips}
          onItemClick={(id) => navigate(`/tv/clip/${id}`)}
          variant="portrait"
        />
      )}

      {/* Channels Grid */}
      {channels && channels.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
              <Film className="h-6 w-6 text-amber-400" />
              Popular Channels
            </h2>
          </div>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channels.map((channel: any) => (
                <div
                  key={channel.id}
                  className="group rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-amber-500/30"
                  onClick={() => navigate(`/tv/channel/${channel.slug}`)}
                >
                  {/* Channel Videos Preview */}
                  <div className="grid grid-cols-3 gap-0.5">
                    {(channel.videos?.slice(0, 3) || []).map((video: any, idx: number) => (
                      <div key={video.id || idx} className="aspect-video bg-gray-800">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Fill empty slots */}
                    {Array.from({ length: Math.max(0, 3 - (channel.videos?.length || 0)) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-video bg-gray-800/50" />
                    ))}
                  </div>
                  
                  {/* Channel Info */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all">
                      {channel.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                        {channel.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {channel.videos?.length || 0} videos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Creators */}
      {trendingCreators && trendingCreators.length > 0 && (
        <section className="py-8 mb-8">
          <div className="container mx-auto px-4 mb-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
              <TrendingUp className="h-6 w-6 text-amber-400" />
              Trending This Week
            </h2>
          </div>
          <div className="container mx-auto px-4 space-y-3">
            {trendingCreators.map((creator, index) => (
              <TVCreatorCard
                key={creator.id}
                {...creator}
                onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
                variant="compact"
                rank={index + 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasContent && (
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Tv className="h-12 w-12 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Content Yet</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Seeksy TV is ready for content! Start by seeding demo content to see the platform in action.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/admin/tv-seeder')} 
              className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 px-8"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Seed Demo Content
            </Button>
          </div>
        </section>
      )}

      <TVFooter />
    </div>
  );
}
