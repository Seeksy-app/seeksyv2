import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import DailyIframe from "@daily-co/daily-js";
import { usePresenterMode } from "@/hooks/usePresenterMode";
import { GuestPresenterView } from "@/components/board/GuestPresenterView";

export default function BoardMeetingGuest() {
  const { token } = useParams<{ token: string }>();
  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);

  const callFrameRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Presenter mode for guests
  const {
    presenterState,
    isFollowing,
    toggleFollowing,
  } = usePresenterMode({
    meetingId: meetingId || '',
    isHost: false,
  });

  const handleJoin = async () => {
    if (!guestName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("daily-guest-join", {
        body: { guestToken: token, guestName: guestName.trim() },
      });

      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Failed to join meeting");
      }

      setMeetingTitle(data.meetingTitle || "Board Meeting");
      setMeetingId(data.meetingId || null);

      // Create Daily call object
      const callFrame = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
      });

      callFrameRef.current = callFrame;

      // Set up event handlers
      callFrame.on("joined-meeting", () => {
        setIsConnected(true);
        setIsJoining(false);
        toast.success("Joined meeting");
      });

      callFrame.on("left-meeting", () => {
        setIsConnected(false);
        callFrameRef.current = null;
      });

      callFrame.on("participant-joined", () => {
        updateParticipantCount();
      });

      callFrame.on("participant-left", () => {
        updateParticipantCount();
      });

      callFrame.on("error", (event) => {
        console.error("Daily error:", event);
        toast.error("Meeting error occurred");
      });

      // Join the room
      await callFrame.join({
        url: data.roomUrl,
        token: data.token,
      });

      // Get local video stream
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      updateParticipantCount();
    } catch (err) {
      console.error("Join error:", err);
      const message = err instanceof Error ? err.message : "Failed to join meeting";
      setError(message);
      toast.error(message);
      setIsJoining(false);
    }
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      setParticipantCount(Object.keys(participants).length);
    }
  };

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      }
    };
  }, []);

  // Not connected - show join form
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Join Board Meeting</CardTitle>
            <CardDescription>
              Enter your name to join the video meeting as a guest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.toLowerCase().includes('not started') || error.toLowerCase().includes('wait for the host')
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}>
                {error.toLowerCase().includes('not started') || error.toLowerCase().includes('wait for the host')
                  ? '⏳ The meeting hasn\'t started yet. Please wait for the host to begin the video call, then try again.'
                  : error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                disabled={isJoining}
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={isJoining || !guestName.trim()}
              className="w-full"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected - show video + presenter view
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-medium">{meetingTitle}</h1>
          <p className="text-sm text-slate-400">Guest: {guestName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">{participantCount}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Video area */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-video bg-slate-800 rounded-lg overflow-hidden">
            {!isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center">
                  <VideoOff className="h-10 w-10 text-slate-400" />
                </div>
              </div>
            )}
            <Badge className="absolute bottom-3 left-3 bg-black/60">
              {guestName} (You)
            </Badge>
          </div>
        </div>

        {/* Presenter View - shows when host is presenting */}
        {meetingId && presenterState.isPresenting && (
          <div className="max-w-2xl mx-auto w-full">
            <GuestPresenterView
              meetingId={meetingId}
              presenterState={presenterState}
              isFollowing={isFollowing}
              onToggleFollowing={toggleFollowing}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-800 px-4 py-4 flex items-center justify-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={leaveCall}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
