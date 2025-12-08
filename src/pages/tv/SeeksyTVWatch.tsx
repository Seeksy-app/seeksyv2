import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings,
  ThumbsUp, Share2, Bell, ArrowLeft, ChevronRight,
  Tv, SkipForward, SkipBack
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TVFooter } from "@/components/tv/TVFooter";

// Mock video data
const mockVideo = {
  id: "1",
  title: "The Future of AI in 2025",
  description: "In this episode, we dive deep into what AI developments we can expect in 2025. From multimodal models to AI agents, we cover everything you need to know about the future of artificial intelligence.",
  creator: {
    id: "1",
    name: "The Daily Tech",
    avatar: "/placeholder.svg",
    followers: "125K"
  },
  duration: "45:32",
  views: "15K",
  likes: "2.3K",
  publishedAt: "2 days ago",
  thumbnail: "/placeholder.svg",
  chapters: [
    { time: "0:00", title: "Introduction" },
    { time: "2:15", title: "GPT-5 and Beyond" },
    { time: "12:30", title: "AI Agents Revolution" },
    { time: "25:00", title: "Open Source AI" },
    { time: "38:45", title: "Predictions & Conclusions" },
  ]
};

const upNext = [
  { id: "2", title: "Apple Vision Pro: One Year Later", creator: "The Daily Tech", duration: "38:15", thumbnail: "/placeholder.svg", views: "12K" },
  { id: "3", title: "The Rise of Open Source AI", creator: "The Daily Tech", duration: "52:18", thumbnail: "/placeholder.svg", views: "28K" },
  { id: "4", title: "Quantum Computing Explained", creator: "The Daily Tech", duration: "41:05", thumbnail: "/placeholder.svg", views: "9.2K" },
  { id: "5", title: "Building with AI APIs", creator: "The Daily Tech", duration: "35:20", thumbnail: "/placeholder.svg", views: "6.8K" },
];

const recommendations = [
  { id: "10", title: "The Future of Work with AI", creator: "Business Insider Pod", duration: "42:15", thumbnail: "/placeholder.svg", views: "18K" },
  { id: "11", title: "Tech Giants: 2025 Strategy", creator: "Market Watch", duration: "55:30", thumbnail: "/placeholder.svg", views: "24K" },
  { id: "12", title: "AI in Healthcare", creator: "Health & Wellness", duration: "38:45", thumbnail: "/placeholder.svg", views: "11K" },
];

export default function SeeksyTVWatch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [volume, setVolume] = useState([80]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const video = mockVideo; // In real app, fetch by videoId

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
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/tv")}>
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

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
              
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 rounded-full bg-amber-500/90 hover:bg-amber-500 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-10 w-10 text-white" />
                  ) : (
                    <Play className="h-10 w-10 text-white fill-current ml-1" />
                  )}
                </button>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress bar */}
                <div className="mb-3">
                  <Slider
                    value={progress}
                    onValueChange={setProgress}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <SkipForward className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <div className="w-20">
                        <Slider
                          value={isMuted ? [0] : volume}
                          onValueChange={(v) => {
                            setVolume(v);
                            setIsMuted(false);
                          }}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>

                    <span className="text-sm text-gray-300">0:00 / {video.duration}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <h1 className="text-2xl font-bold mb-3">{video.title}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              {/* Creator info */}
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/tv/channel/${video.creator.id}`)}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img src={video.creator.avatar} alt={video.creator.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold hover:text-amber-400 transition-colors">{video.creator.name}</p>
                  <p className="text-sm text-gray-400">{video.creator.followers} followers</p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFollowing(!isFollowing);
                  }}
                  size="sm"
                  className={isFollowing 
                    ? "bg-white/10 hover:bg-white/20 text-white ml-4" 
                    : "bg-amber-500 hover:bg-amber-600 text-white ml-4"
                  }
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={isLiked 
                    ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                    : "border-white/20 text-white hover:bg-white/10"
                  }
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {video.likes}
                </Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Stats */}
            <p className="text-sm text-gray-400 mb-4">
              {video.views} views • {video.publishedAt}
            </p>

            {/* Description */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-gray-300 whitespace-pre-line">{video.description}</p>
            </div>

            {/* Chapters */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Chapters</h3>
              <div className="space-y-2">
                {video.chapters.map((chapter, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="text-amber-400 font-mono text-sm w-12">{chapter.time}</span>
                    <span>{chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Up Next */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Up Next</h3>
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
                  Autoplay
                </Button>
              </div>
              <div className="space-y-3">
                {upNext.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigate(`/tv/watch/${item.id}`)}
                  >
                    <div className="relative w-40 shrink-0">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                        {item.duration}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{item.creator}</p>
                      <p className="text-xs text-gray-500">{item.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-white/10 mb-6" />

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
              <div className="space-y-3">
                {recommendations.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigate(`/tv/watch/${item.id}`)}
                  >
                    <div className="relative w-40 shrink-0">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                        {item.duration}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{item.creator}</p>
                      <p className="text-xs text-gray-500">{item.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TVFooter />
    </div>
  );
}