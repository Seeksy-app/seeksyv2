import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Play, Bell, Share2, Users, Radio, Scissors, Video,
  Calendar, ArrowLeft, ExternalLink, Twitter, Instagram
} from "lucide-react";
import { Tv } from "lucide-react";
import { TVFooter } from "@/components/tv/TVFooter";

// Mock creator data
const mockCreator = {
  id: "1",
  name: "The Daily Tech",
  username: "@dailytech",
  avatar: "/placeholder.svg",
  cover: "/placeholder.svg",
  bio: "Your daily source for the latest in technology, AI, and innovation. Join us for deep dives into the tech that shapes our world.",
  followers: "125K",
  totalViews: "2.5M",
  episodeCount: 156,
  isLive: true,
  category: "Technology",
  links: {
    twitter: "https://twitter.com/dailytech",
    instagram: "https://instagram.com/dailytech",
    website: "https://dailytech.com"
  }
};

const episodes = [
  { id: "1", title: "The Future of AI in 2025", duration: "45:32", thumbnail: "/placeholder.svg", views: "15K", date: "2 days ago" },
  { id: "2", title: "Apple Vision Pro: One Year Later", duration: "38:15", thumbnail: "/placeholder.svg", views: "12K", date: "5 days ago" },
  { id: "3", title: "The Rise of Open Source AI", duration: "52:18", thumbnail: "/placeholder.svg", views: "28K", date: "1 week ago" },
  { id: "4", title: "Quantum Computing Explained", duration: "41:05", thumbnail: "/placeholder.svg", views: "9.2K", date: "2 weeks ago" },
];

const clips = [
  { id: "1", title: "The AI Moment That Changed Everything", duration: "0:58", thumbnail: "/placeholder.svg", views: "45K" },
  { id: "2", title: "Why GPT-5 Matters", duration: "1:15", thumbnail: "/placeholder.svg", views: "32K" },
  { id: "3", title: "Tech Prediction for 2025", duration: "0:45", thumbnail: "/placeholder.svg", views: "67K" },
];

const livestreams = [
  { id: "1", title: "Morning Tech Roundup", status: "live", viewers: "2.3K", thumbnail: "/placeholder.svg" },
  { id: "2", title: "CES 2025 Coverage", status: "upcoming", date: "Tomorrow at 10 AM", thumbnail: "/placeholder.svg" },
  { id: "3", title: "AI Weekly Deep Dive", status: "past", views: "8.5K", duration: "1:23:45", thumbnail: "/placeholder.svg" },
];

const playlists = [
  { id: "1", title: "AI Fundamentals", episodeCount: 12, thumbnail: "/placeholder.svg" },
  { id: "2", title: "Tech News Roundup", episodeCount: 52, thumbnail: "/placeholder.svg" },
  { id: "3", title: "Interviews", episodeCount: 24, thumbnail: "/placeholder.svg" },
];

export default function SeeksyTVChannel() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  const creator = mockCreator; // In real app, fetch by channelId

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a14]/95 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/tv")}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Tv className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-amber-400">Seeksy TV</span>
              </div>
            </div>
            <Button 
              variant="default" 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80">
        <div className="absolute inset-0 bg-gradient-to-r from-[#053877] to-[#2C6BED]">
          <img src={creator.cover} alt="" className="w-full h-full object-cover opacity-50" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] to-transparent" />
      </div>

      {/* Creator Info */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-[#0a0a14]">
              <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            </div>
            {creator.isLive && (
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white">
                <span className="animate-pulse mr-1">●</span> LIVE
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold">{creator.name}</h1>
                <p className="text-gray-400">{creator.username}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={isFollowing 
                    ? "bg-white/10 hover:bg-white/20 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                  }
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-300 mb-4 max-w-2xl">{creator.bio}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="font-bold text-white">{creator.followers}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{creator.totalViews}</span>
                <span className="text-gray-400 ml-1">Total Views</span>
              </div>
              <div>
                <span className="font-bold text-white">{creator.episodeCount}</span>
                <span className="text-gray-400 ml-1">Episodes</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {creator.links.twitter && (
                <a href={creator.links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {creator.links.instagram && (
                <a href={creator.links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {creator.links.website && (
                <a href={creator.links.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="episodes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Radio className="h-4 w-4 mr-2" />
              Episodes
            </TabsTrigger>
            <TabsTrigger value="clips" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Scissors className="h-4 w-4 mr-2" />
              Clips
            </TabsTrigger>
            <TabsTrigger value="livestreams" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Video className="h-4 w-4 mr-2" />
              Livestreams
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Playlists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="episodes" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="group cursor-pointer"
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
                  <p className="text-sm text-gray-400">{episode.views} views • {episode.date}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clips" className="mt-6">
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {clips.map((clip) => (
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
          </TabsContent>

          <TabsContent value="livestreams" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {livestreams.map((stream) => (
                <div
                  key={stream.id}
                  className="group relative rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/tv/watch/${stream.id}`)}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                    <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    {stream.status === "live" && (
                      <Badge className="bg-red-600 text-white text-xs">
                        <span className="animate-pulse mr-1">●</span> LIVE
                      </Badge>
                    )}
                    {stream.status === "upcoming" && (
                      <Badge className="bg-blue-600 text-white text-xs">UPCOMING</Badge>
                    )}
                    {stream.status === "past" && (
                      <Badge variant="secondary" className="bg-gray-700 text-white text-xs">REPLAY</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">
                      {stream.title}
                    </h3>
                    {stream.status === "live" && (
                      <p className="text-sm text-gray-400">{stream.viewers} watching</p>
                    )}
                    {stream.status === "upcoming" && (
                      <p className="text-sm text-gray-400">{stream.date}</p>
                    )}
                    {stream.status === "past" && (
                      <p className="text-sm text-gray-400">{stream.views} views • {stream.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-800 to-gray-900">
                    <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{playlist.episodeCount}</p>
                        <p className="text-sm text-gray-300">Episodes</p>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold group-hover:text-amber-400 transition-colors">
                    {playlist.title}
                  </h3>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TVFooter />
    </div>
  );
}