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

// Mock data for demo
const featuredCreators = [
  { id: "1", name: "The Daily Tech", avatar: "/placeholder.svg", followers: "125K", category: "Technology" },
  { id: "2", name: "Creative Minds", avatar: "/placeholder.svg", followers: "89K", category: "Design" },
  { id: "3", name: "Business Insider Pod", avatar: "/placeholder.svg", followers: "203K", category: "Business" },
  { id: "4", name: "Health & Wellness", avatar: "/placeholder.svg", followers: "156K", category: "Health" },
  { id: "5", name: "True Crime Weekly", avatar: "/placeholder.svg", followers: "312K", category: "True Crime" },
];

const liveNow = [
  { id: "1", title: "Morning Tech Roundup", creator: "The Daily Tech", viewers: "2.3K", thumbnail: "/placeholder.svg" },
  { id: "2", title: "Design Systems Workshop", creator: "Creative Minds", viewers: "1.1K", thumbnail: "/placeholder.svg" },
];

const latestEpisodes = [
  { id: "1", title: "The Future of AI in 2025", creator: "The Daily Tech", duration: "45:32", thumbnail: "/placeholder.svg", views: "15K" },
  { id: "2", title: "Building a Brand from Scratch", creator: "Business Insider Pod", duration: "38:15", thumbnail: "/placeholder.svg", views: "12K" },
  { id: "3", title: "Meditation for Beginners", creator: "Health & Wellness", duration: "22:45", thumbnail: "/placeholder.svg", views: "8.5K" },
  { id: "4", title: "The Missing Evidence", creator: "True Crime Weekly", duration: "52:18", thumbnail: "/placeholder.svg", views: "28K" },
  { id: "5", title: "Remote Work Best Practices", creator: "Business Insider Pod", duration: "41:05", thumbnail: "/placeholder.svg", views: "9.2K" },
  { id: "6", title: "Color Theory Deep Dive", creator: "Creative Minds", duration: "35:20", thumbnail: "/placeholder.svg", views: "6.8K" },
];

const aiClips = [
  { id: "1", title: "The AI Moment That Changed Everything", creator: "The Daily Tech", duration: "0:58", thumbnail: "/placeholder.svg", views: "45K" },
  { id: "2", title: "This One Habit...", creator: "Health & Wellness", duration: "1:15", thumbnail: "/placeholder.svg", views: "32K" },
  { id: "3", title: "The Suspect's Confession", creator: "True Crime Weekly", duration: "0:45", thumbnail: "/placeholder.svg", views: "67K" },
  { id: "4", title: "Design Hack in 60 Seconds", creator: "Creative Minds", duration: "1:00", thumbnail: "/placeholder.svg", views: "28K" },
];

const categories = [
  "All", "Podcasts", "Interviews", "AI Clips", "Events", "Live", "Technology", "Business", "Health", "True Crime", "Design"
];

const trendingCreators = [
  { id: "1", name: "Rising Star Pod", avatar: "/placeholder.svg", growth: "+245%", category: "Entertainment" },
  { id: "2", name: "The Mindset Show", avatar: "/placeholder.svg", growth: "+180%", category: "Self-Help" },
  { id: "3", name: "Startup Stories", avatar: "/placeholder.svg", growth: "+156%", category: "Business" },
];

export default function SeeksyTVHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
            <h1 className="text-5xl font-bold mb-4">
              Morning Tech Roundup
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Join The Daily Tech for a live discussion on the latest AI developments and tech news.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Play className="h-5 w-5 fill-current" />
                Watch Now
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
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
                    : "border-white/20 text-gray-300 hover:text-white hover:bg-white/10 shrink-0"
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

      {/* Live Now Section */}
      {liveNow.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-bold">Live Now</h2>
            </div>
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
              See all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveNow.map((stream) => (
              <div
                key={stream.id}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                onClick={() => navigate(`/tv/watch/${stream.id}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                  <img src={stream.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-red-600 text-white text-xs">
                    <span className="animate-pulse mr-1">●</span> LIVE
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                    {stream.viewers} watching
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-sm text-gray-400">{stream.creator}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white fill-current ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Creators */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
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
                onClick={() => navigate(`/tv/channel/${creator.id}`)}
              >
                <div className="relative w-48 h-48 rounded-xl overflow-hidden mb-3">
                  <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold group-hover:text-amber-400 transition-colors truncate">
                  {creator.name}
                </h3>
                <p className="text-sm text-gray-400">{creator.followers} followers</p>
                <Badge variant="outline" className="mt-2 text-xs border-gray-600 text-gray-400">
                  {creator.category}
                </Badge>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Latest Episodes */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
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
                  <img src={episode.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      {episode.duration}
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
                <p className="text-sm text-gray-400">{episode.creator}</p>
                <p className="text-xs text-gray-500 mt-1">{episode.views} views</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* AI Clips */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
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
                  <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      <Scissors className="h-3 w-3 mr-1" /> AI Clip
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      {clip.duration}
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
                <p className="text-xs text-gray-400 mt-1">{clip.views} views</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Trending Creators */}
      <section className="container mx-auto px-4 py-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Trending This Week
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingCreators.map((creator, index) => (
            <div
              key={creator.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => navigate(`/tv/channel/${creator.id}`)}
            >
              <span className="text-3xl font-bold text-gray-600">#{index + 1}</span>
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{creator.name}</h3>
                <p className="text-sm text-gray-400">{creator.category}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-0">
                {creator.growth}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Tv className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-400">Seeksy TV</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 Seeksy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}