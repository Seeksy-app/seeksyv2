import { useState, useRef, useEffect } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Video, ArrowLeft, Lock, Check, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useVideoProgress, useAllVideoProgress } from '@/hooks/useVideoProgress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: string;
}

export default function BoardVideos() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const { allProgress, isVideoUnlocked } = useAllVideoProgress();

  // Fetch board-specific videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['boardVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index');

      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  // Video progress for selected video
  const {
    progress,
    updateProgress,
    isUnlocked,
    UNLOCK_THRESHOLD_SECONDS,
  } = useVideoProgress(selectedVideo?.id || '');

  // Set first video as selected
  useEffect(() => {
    if (videos && videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedVideo) return;

    const handleTimeUpdate = () => {
      const time = Math.floor(video.currentTime);
      setCurrentTime(time);
      
      // Update progress every 5 seconds
      if (time > 0 && time % 5 === 0) {
        updateProgress(time);
      }
    };

    const handleEnded = () => {
      if (selectedVideo) {
        updateProgress(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [selectedVideo, updateProgress]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (video: DemoVideo, index: number) => {
    // Check if previous video is unlocked (watched 30+ seconds)
    if (index > 0) {
      const prevVideo = videos?.[index - 1];
      if (prevVideo) {
        const prevProgress = allProgress?.find(p => p.video_id === prevVideo.id);
        if (!prevProgress || prevProgress.seconds_watched < UNLOCK_THRESHOLD_SECONDS) {
          return; // Don't allow selection
        }
      }
    }
    setSelectedVideo(video);
    setCurrentTime(0);
  };

  const getVideoStatus = (videoId: string, index: number) => {
    if (index === 0) return 'unlocked';
    
    // Check if previous video has been watched for 30+ seconds
    const prevVideo = videos?.[index - 1];
    if (prevVideo) {
      const prevProgress = allProgress?.find(p => p.video_id === prevVideo.id);
      if (prevProgress && prevProgress.seconds_watched >= UNLOCK_THRESHOLD_SECONDS) {
        return 'unlocked';
      }
    }
    return 'locked';
  };

  return (
    <BoardLayout>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white mb-6"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Investor Videos</h1>
            <p className="text-slate-400">Product demos & presentations</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="aspect-video bg-black relative">
                {selectedVideo?.video_url ? (
                  <video
                    ref={videoRef}
                    key={selectedVideo.id}
                    src={selectedVideo.video_url}
                    controls
                    className="w-full h-full"
                    poster={selectedVideo.thumbnail_url || undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <Play className="w-16 h-16" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedVideo?.title || 'Select a video'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {selectedVideo?.description || 'Choose a video from the playlist to begin.'}
                </p>
                
                {/* Progress indicator */}
                {selectedVideo && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                      <span>Watch progress</span>
                      <span>{currentTime >= UNLOCK_THRESHOLD_SECONDS ? 'Next video unlocked!' : `${UNLOCK_THRESHOLD_SECONDS - currentTime}s to unlock next`}</span>
                    </div>
                    <Progress 
                      value={Math.min((currentTime / UNLOCK_THRESHOLD_SECONDS) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Playlist */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Playlist</h3>
            <div className="space-y-3">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-700 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : videos?.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center text-slate-400">
                    No videos available yet.
                  </CardContent>
                </Card>
              ) : (
                videos?.map((video, index) => {
                  const status = getVideoStatus(video.id, index);
                  const isSelected = selectedVideo?.id === video.id;
                  const videoProgress = allProgress?.find(p => p.video_id === video.id);
                  const isCompleted = videoProgress && videoProgress.seconds_watched >= UNLOCK_THRESHOLD_SECONDS;

                  return (
                    <Card
                      key={video.id}
                      className={cn(
                        'border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500'
                          : status === 'locked'
                          ? 'bg-slate-800/30 border-slate-700 opacity-60 cursor-not-allowed'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      )}
                      onClick={() => handleVideoSelect(video, index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : status === 'locked'
                              ? 'bg-slate-700 text-slate-500'
                              : 'bg-blue-500/20 text-blue-400'
                          )}>
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : status === 'locked' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{video.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(video.duration_seconds)}</span>
                              {videoProgress && (
                                <span className="text-slate-500">
                                  • {formatDuration(videoProgress.seconds_watched)} watched
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              Watch at least 30 seconds to unlock the next video
            </p>
          </div>
        </div>
      </div>
    </BoardLayout>
  );
}
