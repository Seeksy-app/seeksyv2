import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings,
  ThumbsUp, Share2, ArrowLeft,
  Tv, SkipForward, SkipBack, Loader2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TVFooter } from "@/components/tv/TVFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdData {
  id: string;
  title: string;
  type: string;
  asset_url: string;
  duration_seconds: number;
  click_url?: string | null;
  thumbnail_url?: string | null;
}

export default function SeeksyTVWatch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [volume, setVolume] = useState([80]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Ad states
  const [playingAd, setPlayingAd] = useState<'pre' | 'post' | null>(null);
  const [preAd, setPreAd] = useState<AdData | null>(null);
  const [postAd, setPostAd] = useState<AdData | null>(null);
  const [prePlacementId, setPrePlacementId] = useState<string | null>(null);
  const [postPlacementId, setPostPlacementId] = useState<string | null>(null);
  const [adSkipTimer, setAdSkipTimer] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [viewerSessionId] = useState(() => crypto.randomUUID());

  // Check if videoId is a valid UUID
  const isValidUUID = videoId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);

  // Fetch video from database
  const { data: video, isLoading } = useQuery({
    queryKey: ['tv-video', videoId],
    queryFn: async () => {
      if (!isValidUUID) return null;
      
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          *,
          channel:tv_channels(id, name, slug)
        `)
        .eq('id', videoId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!videoId && isValidUUID
  });

  // Fetch ads for this video
  useEffect(() => {
    if (!video) return;
    
    const fetchAds = async () => {
      try {
        const channelId = video.channel ? (video.channel as { id: string }).id : null;
        const { data, error } = await supabase.functions.invoke('seeksy-tv-get-ads', {
          body: { video_id: videoId, channel_id: channelId }
        });
        
        if (error) {
          console.error('[SeeksyTVWatch] Error fetching ads:', error);
          return;
        }
        
        if (data?.preAd) {
          setPreAd(data.preAd);
          setPrePlacementId(data.prePlacementId);
          setPlayingAd('pre');
        }
        if (data?.postAd) {
          setPostAd(data.postAd);
          setPostPlacementId(data.postPlacementId);
        }
      } catch (err) {
        console.error('[SeeksyTVWatch] Failed to fetch ads:', err);
      }
    };
    
    fetchAds();
  }, [video, videoId]);

  // Ad skip timer
  useEffect(() => {
    if (playingAd && adSkipTimer > 0) {
      const timer = setInterval(() => {
        setAdSkipTimer(prev => {
          if (prev <= 1) {
            setCanSkipAd(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [playingAd, adSkipTimer]);

  // Log impression when ad starts
  const logImpression = async (adId: string, placementId: string, position: 'pre' | 'post') => {
    try {
      const channelId = video?.channel ? (video.channel as { id: string }).id : null;
      await supabase.functions.invoke('seeksy-tv-log-impression', {
        body: {
          ad_id: adId,
          placement_id: placementId,
          video_id: videoId,
          channel_id: channelId,
          position,
          viewer_session_id: viewerSessionId
        }
      });
    } catch (err) {
      console.error('[SeeksyTVWatch] Failed to log impression:', err);
    }
  };

  const handleAdEnded = () => {
    if (playingAd === 'pre') {
      setPlayingAd(null);
      setCanSkipAd(false);
      setAdSkipTimer(5);
      // Auto-play main content
      setTimeout(() => videoRef.current?.play(), 100);
    } else if (playingAd === 'post') {
      setPlayingAd(null);
    }
  };

  const skipAd = () => {
    if (canSkipAd) {
      handleAdEnded();
    }
  };

  const handleMainVideoEnded = () => {
    if (postAd && postPlacementId) {
      setPlayingAd('post');
      setCanSkipAd(false);
      setAdSkipTimer(5);
      setTimeout(() => {
        adVideoRef.current?.play();
        logImpression(postAd.id, postPlacementId, 'post');
      }, 100);
    }
  };

  // Start pre-roll ad when it loads
  useEffect(() => {
    if (playingAd === 'pre' && preAd && prePlacementId && adVideoRef.current) {
      adVideoRef.current.play();
      logImpression(preAd.id, prePlacementId, 'pre');
    }
  }, [playingAd, preAd, prePlacementId]);

  // Fetch related videos
  const { data: relatedVideos } = useQuery({
    queryKey: ['tv-related-videos', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select('*')
        .neq('id', videoId)
        .eq('is_published', true)
        .limit(8);
      
      if (error) throw error;
      return data;
    },
    enabled: !!videoId
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (playingAd) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(current);
      setProgress(dur > 0 ? [(current / dur) * 100] : [0]);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (playingAd) return;
    if (videoRef.current && videoRef.current.duration) {
      const newTime = (value[0] / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
    }
    if (adVideoRef.current) {
      adVideoRef.current.volume = value[0] / 100;
    }
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    if (adVideoRef.current) {
      adVideoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume[0] / 100;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col items-center justify-center gap-4">
        <Tv className="h-16 w-16 text-gray-500" />
        <h1 className="text-xl font-semibold">Video not found</h1>
        <Button onClick={() => navigate("/tv")} className="bg-amber-500 hover:bg-amber-600">
          Back to Seeksy TV
        </Button>
      </div>
    );
  }

  const channelName = video.channel ? (video.channel as { name: string }).name : video.series_name || "Seeksy TV";
  const channelSlug = video.channel ? (video.channel as { slug: string }).slug : null;
  const currentAd = playingAd === 'pre' ? preAd : playingAd === 'post' ? postAd : null;

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
              {/* Ad Video Layer */}
              {playingAd && currentAd && (
                <div className="absolute inset-0 z-20">
                  <video
                    ref={adVideoRef}
                    src={currentAd.asset_url}
                    className="w-full h-full object-contain"
                    onEnded={handleAdEnded}
                    autoPlay
                    onClick={() => currentAd.click_url && window.open(currentAd.click_url, '_blank')}
                  />
                  {/* Ad overlay */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-amber-500 text-white">Ad</Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    {canSkipAd ? (
                      <Button size="sm" onClick={skipAd} className="bg-white text-black hover:bg-gray-200">
                        Skip Ad <SkipForward className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        Skip in {adSkipTimer}s
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Main Video */}
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                className={`w-full h-full object-contain ${playingAd ? 'invisible' : ''}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleMainVideoEnded}
              />
              
              {/* Play overlay - only show when not playing and no ad */}
              {!isPlaying && !playingAd && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={handlePlayPause}
                    className="w-20 h-20 rounded-full bg-amber-500/90 hover:bg-amber-500 flex items-center justify-center transition-colors"
                  >
                    <Play className="h-10 w-10 text-white fill-current ml-1" />
                  </button>
                </div>
              )}

              {/* Controls - hide during ads */}
              {!playingAd && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress bar */}
                  <div className="mb-3">
                    <Slider
                      value={progress}
                      onValueChange={handleProgressChange}
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
                        onClick={handlePlayPause}
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
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <div className="w-20">
                          <Slider
                            value={isMuted ? [0] : volume}
                            onValueChange={handleVolumeChange}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>

                      <span className="text-sm text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration || video.duration_seconds || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Settings className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-white/20"
                        onClick={() => videoRef.current?.requestFullscreen()}
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <h1 className="text-2xl font-bold mb-3">{video.title}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              {/* Creator info */}
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => channelSlug ? navigate(`/tv/channel/${channelSlug}`) : null}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{channelName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold hover:text-amber-400 transition-colors">{channelName}</p>
                  <p className="text-sm text-gray-400">{video.category || "Video"}</p>
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
                  {video.view_count || 0}
                </Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Stats */}
            <p className="text-sm text-gray-400 mb-4">
              {video.view_count || 0} views • {new Date(video.created_at).toLocaleDateString()}
            </p>

            {/* Description */}
            {video.description && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-gray-300 whitespace-pre-line">{video.description}</p>
              </div>
            )}
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
                {relatedVideos?.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigate(`/tv/watch/${item.id}`)}
                  >
                    <div className="relative w-40 shrink-0">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      {item.duration_seconds && (
                        <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                          {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{item.series_name || "Seeksy TV"}</p>
                      <p className="text-xs text-gray-500">{item.view_count || 0} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-white/10 mb-6" />

            {/* More from this channel */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
              <div className="space-y-3">
                {relatedVideos?.slice(4, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigate(`/tv/watch/${item.id}`)}
                  >
                    <div className="relative w-40 shrink-0">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      {item.duration_seconds && (
                        <Badge variant="secondary" className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                          {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{item.series_name || "Seeksy TV"}</p>
                      <p className="text-xs text-gray-500">{item.view_count || 0} views</p>
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
