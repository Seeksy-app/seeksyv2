import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BroadcastTimeline } from "@/components/studio-broadcast/BroadcastTimeline";
import { MultiPlatformControls } from "@/components/studio-broadcast/MultiPlatformControls";
import { AdIntegrationPanel } from "@/components/studio-broadcast/AdIntegrationPanel";
import { AIToolsPanel } from "@/components/studio-broadcast/AIToolsPanel";
import { StudioLeftSidebar } from "@/components/studio/StudioLeftSidebar";
import { Video, Mic, MicOff, VideoOff, Monitor, UserPlus, Radio, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BroadcastStudio() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Broadcast State
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Media Controls
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  // Timeline
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Multi-Platform Settings
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [platforms, setPlatforms] = useState({
    myPage: true,
    youtube: false,
    spotify: false
  });

  // AI Features
  const [aiFeatures, setAIFeatures] = useState({
    liveTranscription: true,
    noiseReduction: true,
    chapterDetection: true,
    autoIntroOutro: false
  });

  // Data
  const [markers, setMarkers] = useState<any[]>([]);
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [clipSuggestions, setClipSuggestions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadBroadcastData();
    startPreview();

    return () => {
      stopAllStreams();
    };
  }, [sessionId]);

  useEffect(() => {
    if (isLive) {
      const timer = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLive]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }
  };

  const loadBroadcastData = async () => {
    if (!sessionId) return;

    try {
      // Load or create broadcast
      const { data: session } = await supabase
        .from('studio_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session) {
        setBroadcastTitle(session.room_name || 'Untitled Broadcast');

        // Check for existing broadcast
        const { data: broadcast } = await supabase
          .from('studio_broadcasts')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_live', true)
          .maybeSingle();

        if (broadcast) {
          setBroadcastId(broadcast.id);
          setIsLive(broadcast.is_live);
          loadBroadcastContent(broadcast.id);
        }
      }
    } catch (error) {
      console.error('Error loading broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to load broadcast data",
        variant: "destructive"
      });
    }
  };

  const loadBroadcastContent = async (broadcastId: string) => {
    try {
      // Load markers
      const { data: markersData } = await supabase
        .from('studio_timeline_markers')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .order('timestamp_seconds');
      
      if (markersData) setMarkers(markersData);

      // Load ad slots
      const { data: adSlotsData } = await supabase
        .from('studio_ad_slots')
        .select('*, assigned_campaign:ad_campaigns(*)')
        .eq('broadcast_id', broadcastId);
      
      if (adSlotsData) setAdSlots(adSlotsData);

      // Load transcriptions
      const { data: transcriptData } = await supabase
        .from('studio_ai_transcriptions')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .order('timestamp_seconds');
      
      if (transcriptData) setTranscriptions(transcriptData);

      // Load clip suggestions
      const { data: clipsData } = await supabase
        .from('studio_clip_suggestions')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .eq('accepted', false);
      
      if (clipsData) setClipSuggestions(clipsData);

    } catch (error) {
      console.error('Error loading broadcast content:', error);
    }
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      
      // Start with both enabled for preview
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (error) {
      console.error('Error starting preview:', error);
      toast({
        title: "Camera/Mic Access",
        description: "Could not access camera or microphone",
        variant: "destructive"
      });
    }
  };

  const stopAllStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }
      
      setScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        startPreview();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast({
        title: "Screen Share Failed",
        description: "Could not start screen sharing",
        variant: "destructive"
      });
    }
  };

  const handleGoLive = async () => {
    if (!sessionId) return;

    setIsPreparing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create broadcast record
      const { data: newBroadcast, error: broadcastError } = await supabase
        .from('studio_broadcasts')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          title: broadcastTitle || 'Untitled Broadcast',
          is_live: true,
          started_at: new Date().toISOString(),
          broadcast_to_my_page: platforms.myPage,
          broadcast_to_youtube: platforms.youtube,
          broadcast_to_spotify: platforms.spotify,
          audio_only_mode: audioOnlyMode
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      setBroadcastId(newBroadcast.id);
      setIsLive(true);
      setCurrentTime(0);

      toast({
        title: "🎉 You're Live!",
        description: "Broadcasting to selected platforms"
      });

      // Start real-time features
      subscribeToChat(newBroadcast.id);
      
    } catch (error) {
      console.error('Error going live:', error);
      toast({
        title: "Error",
        description: "Failed to start broadcast",
        variant: "destructive"
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleStopBroadcast = async () => {
    if (!broadcastId) return;

    try {
      await supabase
        .from('studio_broadcasts')
        .update({
          is_live: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      setIsLive(false);
      
      toast({
        title: "Broadcast Ended",
        description: "Your broadcast has been saved"
      });

      // Navigate to analytics/post-production
      setTimeout(() => {
        navigate(`/media-library`);
      }, 2000);

    } catch (error) {
      console.error('Error stopping broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to stop broadcast",
        variant: "destructive"
      });
    }
  };

  const subscribeToChat = (broadcastId: string) => {
    // Subscribe to real-time chat messages
    const channel = supabase
      .channel(`broadcast:${broadcastId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_live_chat',
          filter: `broadcast_id=eq.${broadcastId}`
        },
        (payload) => {
          console.log('New chat message:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddMarker = async (type: any, timestamp: number) => {
    if (!broadcastId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('studio_timeline_markers')
        .insert({
          broadcast_id: broadcastId,
          user_id: user.id,
          marker_type: type,
          timestamp_seconds: Math.floor(timestamp),
          triggered: false,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setMarkers(prev => [...prev, data]);

      toast({
        title: "Marker Added",
        description: `${type} marker added at ${Math.floor(timestamp)}s`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/studio')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{broadcastTitle || 'Broadcast Studio'}</h1>
            <p className="text-xs text-muted-foreground">Multi-Platform Live Streaming</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar - Controls */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <div className="h-full p-4 space-y-4 overflow-y-auto">
            <MultiPlatformControls
              isLive={isLive}
              audioOnlyMode={audioOnlyMode}
              platforms={platforms}
              onPlatformToggle={(platform) => {
                setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
              }}
              onAudioModeToggle={() => setAudioOnlyMode(!audioOnlyMode)}
              onGoLive={handleGoLive}
              onStopBroadcast={handleStopBroadcast}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="h-full flex flex-col">
            {/* Video Preview */}
            <div className="flex-1 bg-black relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {/* Control Bar (Bottom) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2">
                <Button
                  size="sm"
                  variant={micEnabled ? "default" : "destructive"}
                  onClick={toggleMicrophone}
                >
                  {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={cameraEnabled ? "default" : "destructive"}
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={shareScreen}>
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 border-t border-border">
              <BroadcastTimeline
                broadcastId={broadcastId || ''}
                currentTime={currentTime}
                duration={isLive ? currentTime + 300 : duration}
                isPlaying={isLive}
                markers={markers}
                onTimeSeek={(time) => setCurrentTime(time)}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onAddMarker={handleAddMarker}
                onMarkerClick={(marker) => setCurrentTime(marker.timestamp_seconds)}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Sidebar - Tools & Analytics */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={35}>
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <AIToolsPanel
              broadcastId={broadcastId || ''}
              transcriptions={transcriptions}
              clipSuggestions={clipSuggestions}
              aiFeatures={aiFeatures}
              onToggleFeature={(feature) => {
                setAIFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
              }}
              onAcceptClip={(clipId) => {
                console.log('Accept clip:', clipId);
                toast({
                  title: "Clip Created",
                  description: "Clip added to your media library",
                  duration: 2000
                });
              }}
              onSeekToTime={(timestamp) => setCurrentTime(timestamp)}
            />

            <AdIntegrationPanel
              broadcastId={broadcastId || ''}
              adSlots={adSlots}
              currentTime={currentTime}
              onDisplayScript={(slotId) => console.log('Display script:', slotId)}
              onCompleteRead={(slotId) => console.log('Complete read:', slotId)}
              onSeekToAd={(timestamp) => setCurrentTime(timestamp)}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
