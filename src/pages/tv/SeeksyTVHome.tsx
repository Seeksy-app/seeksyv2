import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Play, Search, Bell, User, Tv, Radio, Scissors, 
  Calendar, Star, TrendingUp, Clock, ChevronRight,
  Mic, Video, Sparkles
} from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper to format duration
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Helper to format view counts
const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const categories = [
  "All", "Podcasts", "Interviews", "AI Clips", "Events", "Live", "Technology", "Business", "Health", "True Crime", "Design"
];

export default function SeeksyTVHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch channels with published videos
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

  // Fetch featured creators (channels with most followers)
  const { data: featuredCreators } = useQuery({
    queryKey: ['tv-featured-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, follower_count, category')
        .eq('is_active', true)
        .order('follower_count', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch latest episodes (full-length content)
  const { data: latestEpisodes } = useQuery({
    queryKey: ['tv-latest-episodes', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('tv_content')
        .select(`
          id, title, description, thumbnail_url, duration_seconds, view_count, category,
          channel:tv_channels(name, slug)
        `)
        .eq('is_published', true)
        .in('content_type', ['episode', 'spotlight'])
        .order('published_at', { ascending: false })
        .limit(8);
      
      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch AI clips (short-form content)
  const { data: aiClips } = useQuery({
    queryKey: ['tv-ai-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          id, title, thumbnail_url, duration_seconds, view_count,
          channel:tv_channels(name, slug)
        `)
        .eq('is_published', true)
        .eq('content_type', 'clip')
        .order('view_count', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch trending creators (by total views)
  const { data: trendingCreators } = useQuery({
    queryKey: ['tv-trending-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name, slug, avatar_url, category, total_views, follower_count')
        .eq('is_active', true)
        .order('total_views', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Check if we have any content
  const hasContent = (latestEpisodes?.length ?? 0) > 0 || (aiClips?.length ?? 0) > 0 || (channels?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#0a0a14] to-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Seeksy TV
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search creators, episodes, clips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#053877] to-[#2C6BED]">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-20 bg-cover bg-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <Badge className="bg-red-600 text-white mb-4">
              <span className="animate-pulse mr-2">●</span> LIVE NOW
            </Badge>
            <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Morning Tech Roundup
            </h1>
            <p className="text-xl text-white/90 mb-6 drop-shadow-md">
              Join The Daily Tech for a live discussion on the latest AI developments and tech news.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Play className="h-5 w-5 fill-current" />
                Watch Now
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white bg-white/10 hover:bg-white/20">
                <Bell className="h-5 w-5 mr-2" />
                Set Reminder
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 py-6">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={
                  selectedCategory === category
                    ? "bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                    : "border-white/30 bg-white text-gray-800 hover:bg-gray-100 shrink-0"
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

      {/* Channels Section - Shows published channel videos */}
      {channels && channels.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Radio className="h-6 w-6 text-amber-400" />
              Channels
            </h2>
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
              Browse all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel: any) => (
              <div
                key={channel.id}
                className="group rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/tv/channel/${channel.slug}`)}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {channel.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors truncate">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {channel.videos?.length || 0} videos
                    </p>
                  </div>
                </div>
                {channel.videos && channel.videos.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 p-2 pt-0">
                    {channel.videos.slice(0, 3).map((video: any) => (
                      <div key={video.id} className="aspect-video rounded overflow-hidden bg-gray-800">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Creators */}
      {featuredCreators && featuredCreators.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Star className="h-6 w-6 text-amber-400" />
              Featured Creators
            </h2>
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
              Browse all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {featuredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="shrink-0 w-48 group cursor-pointer"
                  onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
                >
                  <div className="relative w-48 h-48 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-primary/40">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/60">
                        {creator.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold group-hover:text-amber-400 transition-colors truncate">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-gray-400">{formatViews(creator.follower_count || 0)} followers</p>
                  {creator.category && (
                    <Badge variant="outline" className="mt-2 text-xs border-gray-600 text-gray-400">
                      {creator.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Latest Episodes */}
      {latestEpisodes && latestEpisodes.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Radio className="h-6 w-6 text-amber-400" />
              Latest Episodes
            </h2>
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
              See all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {latestEpisodes.map((episode) => (
                <div
                  key={episode.id}
                  className="shrink-0 w-72 group cursor-pointer"
                  onClick={() => navigate(`/tv/watch/${episode.id}`)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-900">
                    {episode.thumbnail_url ? (
                      <img src={episode.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Radio className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        {formatDuration(episode.duration_seconds || 0)}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold group-hover:text-amber-400 transition-colors line-clamp-2 mb-1">
                    {episode.title}
                  </h3>
                  <p className="text-sm text-gray-400">{episode.channel?.name || "Unknown Creator"}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatViews(episode.view_count || 0)} views</p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* AI Clips */}
      {aiClips && aiClips.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="h-6 w-6 text-amber-400" />
              AI-Generated Clips
            </h2>
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
              Explore clips <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {aiClips.map((clip) => (
                <div
                  key={clip.id}
                  className="shrink-0 w-44 group cursor-pointer"
                  onClick={() => navigate(`/tv/clip/${clip.id}`)}
                >
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-purple-900 to-pink-900">
                    {clip.thumbnail_url ? (
                      <img src={clip.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-purple-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                        <Scissors className="h-3 w-3 mr-1" /> AI Clip
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        {formatDuration(clip.duration_seconds || 0)}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm group-hover:text-amber-400 transition-colors line-clamp-2">
                    {clip.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{formatViews(clip.view_count || 0)} views</p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Trending Creators */}
      {trendingCreators && trendingCreators.length > 0 && (
        <section className="container mx-auto px-4 py-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <TrendingUp className="h-6 w-6 text-amber-400" />
              Trending This Week
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/tv/channel/${creator.slug || creator.id}`)}
              >
                <span className="text-3xl font-bold text-gray-600">#{index + 1}</span>
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-primary/20 to-primary/40">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/60">
                      {creator.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{creator.name}</h3>
                  <p className="text-sm text-gray-400">{creator.category}</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-0">
                  {formatViews(creator.total_views || 0)} views
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasContent && (
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <Tv className="h-16 w-16 text-amber-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No Content Yet</h2>
            <p className="text-gray-400 mb-6">
              Seeksy TV is ready for content! Start by creating channels and uploading videos.
            </p>
            <Button 
              onClick={() => navigate('/admin/tv-seeder')} 
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Seed Demo Content
            </Button>
          </div>
        </section>
      )}

      <TVFooter />
    </div>
  );
}