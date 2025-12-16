import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Users,
  Clock,
  ListChecks,
  MessageSquare,
  Send,
  PanelRightClose,
  PanelRightOpen,
  MonitorPlay,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import DailyIframe from "@daily-co/daily-js";
import { usePresenterMode } from "@/hooks/usePresenterMode";
import { GuestPresenterView } from "@/components/board/GuestPresenterView";
import { format } from "date-fns";

interface AgendaItem {
  id: string;
  title: string;
  timebox_minutes: number;
  is_checked: boolean;
  order_index: number;
}

interface GuestQuestion {
  name: string;
  content: string;
  timestamp: string;
}

interface MeetingInfo {
  id: string;
  title: string;
  meeting_date: string;
  room_name: string | null;
  room_url: string | null;
  status: string;
  member_questions: GuestQuestion[] | null;
  agenda_items: any;
}

interface RemoteParticipant {
  id: string;
  name: string;
  isScreenSharing: boolean;
  screenTrack?: MediaStreamTrack;
}

export default function BoardMeetingGuest() {
  const { token } = useParams<{ token: string }>();
  const [guestName, setGuestName] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [guestQuestions, setGuestQuestions] = useState<GuestQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);
  const [pollingForRoom, setPollingForRoom] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Screen share and media state
  const [remoteScreenShare, setRemoteScreenShare] = useState<MediaStreamTrack | null>(null);
  const [screenSharerName, setScreenSharerName] = useState<string>("");
  const [hostMediaUrl, setHostMediaUrl] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);

  const callFrameRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);

  const {
    presenterState,
    isFollowing,
    toggleFollowing,
  } = usePresenterMode({
    meetingId: meetingInfo?.id || '',
    isHost: false,
  });

  // Auto-collapse sidebar when video connects
  useEffect(() => {
    if (isConnected) {
      setSidebarOpen(false);
    }
  }, [isConnected]);

  // Attach screen share track to video element
  useEffect(() => {
    if (remoteScreenShare && screenShareVideoRef.current) {
      const stream = new MediaStream([remoteScreenShare]);
      screenShareVideoRef.current.srcObject = stream;
    } else if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = null;
    }
  }, [remoteScreenShare]);

  // Subscribe to host media broadcast
  useEffect(() => {
    if (!meetingInfo?.id) return;

    const channel = supabase
      .channel(`meeting-media:${meetingInfo.id}`)
      .on('broadcast', { event: 'media-play' }, (payload) => {
        console.log("[GuestView] Media broadcast received:", payload);
        setHostMediaUrl(payload.payload.url);
        setIsMediaPlaying(payload.payload.isPlaying);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingInfo?.id]);

  useEffect(() => {
    if (!token) return;
    fetchMeetingInfo();
  }, [token]);

  useEffect(() => {
    if (!meetingInfo || meetingInfo.room_url || !hasEnteredName) return;
    
    setPollingForRoom(true);
    const interval = setInterval(async () => {
      await fetchMeetingInfo();
    }, 5000);

    return () => {
      clearInterval(interval);
      setPollingForRoom(false);
    };
  }, [meetingInfo?.id, hasEnteredName, meetingInfo?.room_url]);

  const fetchMeetingInfo = async () => {
    try {
      const { data: invite } = await supabase
        .from('board_meeting_invites')
        .select('meeting_id, invitee_name')
        .eq('invite_token', token)
        .maybeSingle();

      let meetingId: string | null = null;

      if (invite) {
        meetingId = invite.meeting_id;
        if (invite.invitee_name && !guestName) {
          setGuestName(invite.invitee_name);
        }
      } else {
        const { data: meeting } = await supabase
          .from('board_meeting_notes')
          .select('id')
          .eq('guest_token', token)
          .maybeSingle();
        
        if (meeting) {
          meetingId = meeting.id;
        }
      }

      if (!meetingId) {
        setError("Invalid or expired meeting link");
        setIsLoadingMeeting(false);
        return;
      }

      const { data: meetingData, error: meetingError } = await supabase
        .from('board_meeting_notes')
        .select('id, title, meeting_date, room_name, room_url, status, member_questions, agenda_items')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meetingData) {
        setError("Meeting not found");
        setIsLoadingMeeting(false);
        return;
      }

      setMeetingInfo(meetingData as unknown as MeetingInfo);

      if (meetingData.agenda_items && Array.isArray(meetingData.agenda_items)) {
        setAgendaItems(meetingData.agenda_items as unknown as AgendaItem[]);
      }

      if (meetingData.member_questions && Array.isArray(meetingData.member_questions)) {
        setGuestQuestions(meetingData.member_questions as unknown as GuestQuestion[]);
      }

      setIsLoadingMeeting(false);
    } catch (err) {
      console.error("Error fetching meeting:", err);
      setError("Failed to load meeting");
      setIsLoadingMeeting(false);
    }
  };

  const handleEnterName = () => {
    if (!guestName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setHasEnteredName(true);
  };

  const handleJoinVideo = async () => {
    if (!meetingInfo?.room_url) {
      toast.error("Meeting video hasn't started yet");
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

      const callFrame = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
      });

      callFrameRef.current = callFrame;

      callFrame.on("joined-meeting", () => {
        setIsConnected(true);
        setIsJoining(false);
        toast.success("Joined video call");
        checkForScreenShares();
      });

      callFrame.on("left-meeting", () => {
        setIsConnected(false);
        setRemoteScreenShare(null);
        callFrameRef.current = null;
      });

      callFrame.on("participant-joined", () => {
        updateParticipantCount();
        checkForScreenShares();
      });
      
      callFrame.on("participant-left", () => {
        updateParticipantCount();
        checkForScreenShares();
      });

      callFrame.on("participant-updated", (event: any) => {
        if (event?.participant && !event.participant.local) {
          checkForScreenShares();
        }
      });

      callFrame.on("error", (event) => {
        console.error("Daily error:", event);
        toast.error("Video error occurred");
      });

      await callFrame.join({
        url: data.roomUrl,
        token: data.token,
      });

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      updateParticipantCount();
    } catch (err) {
      console.error("Join error:", err);
      const message = err instanceof Error ? err.message : "Failed to join meeting";
      toast.error(message);
      setIsJoining(false);
    }
  };

  const checkForScreenShares = () => {
    if (!callFrameRef.current) return;
    
    const participants = callFrameRef.current.participants();
    let foundScreenShare = false;
    
    for (const [id, participant] of Object.entries(participants)) {
      if (id === 'local') continue;
      
      const p = participant as any;
      if (p.screen && p.tracks?.screenVideo?.track) {
        setRemoteScreenShare(p.tracks.screenVideo.track);
        setScreenSharerName(p.user_name || 'Host');
        foundScreenShare = true;
        break;
      }
    }
    
    if (!foundScreenShare) {
      setRemoteScreenShare(null);
      setScreenSharerName("");
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
    setRemoteScreenShare(null);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !meetingInfo?.id) return;
    
    setIsAddingQuestion(true);
    try {
      const newQ: GuestQuestion = {
        name: guestName,
        content: newQuestion.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedQuestions = [...guestQuestions, newQ];

      const { error } = await supabase
        .from('board_meeting_notes')
        .update({ member_questions: updatedQuestions as unknown as any })
        .eq('id', meetingInfo.id);

      if (error) throw error;

      setGuestQuestions(updatedQuestions);
      setNewQuestion("");
      toast.success("Question added");
    } catch (err) {
      console.error("Error adding question:", err);
      toast.error("Failed to add question");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      }
    };
  }, []);

  if (isLoadingMeeting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !meetingInfo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasEnteredName) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{meetingInfo?.title || "Board Meeting"}</CardTitle>
            <CardDescription>
              Enter your name to view the agenda and join when ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterName()}
              />
            </div>
            <Button onClick={handleEnterName} disabled={!guestName.trim()} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meetingStarted = !!meetingInfo?.room_url;
  const hasPresentation = remoteScreenShare || hostMediaUrl || presenterState.isPresenting;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Compact Header with Controls */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-white font-medium text-sm">{meetingInfo?.title || "Board Meeting"}</h1>
            <p className="text-xs text-slate-400">
              {meetingInfo?.meeting_date 
                ? format(new Date(meetingInfo.meeting_date), "MMM d, yyyy")
                : guestName}
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">{participantCount}</span>
            </div>
          )}
          {remoteScreenShare && (
            <Badge variant="secondary" className="text-xs gap-1">
              <MonitorPlay className="h-3 w-3" />
              {screenSharerName} sharing
            </Badge>
          )}
          {hostMediaUrl && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Film className="h-3 w-3" />
              Media playing
            </Badge>
          )}
        </div>

        {/* Inline Controls when connected */}
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button
                variant={isMuted ? "destructive" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3"
                onClick={leaveCall}
              >
                <PhoneOff className="h-4 w-4 mr-1.5" />
                Leave
              </Button>
              <div className="w-px h-6 bg-slate-700 mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Meeting not started banner */}
      {!meetingStarted && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-500">
            {pollingForRoom 
              ? "Waiting for host to start..."
              : "Meeting hasn't started yet"}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Presentation Area - Full width when sidebar collapsed */}
        <div className={`flex-1 flex flex-col p-4 gap-4 transition-all duration-200`}>
          
          {/* Screen Share Display - Priority 1 */}
          {remoteScreenShare && (
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden min-h-[300px]">
              <video
                ref={screenShareVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white">{screenSharerName}'s Screen</span>
              </div>
            </div>
          )}

          {/* Media Playback Display - Priority 2 */}
          {hostMediaUrl && !remoteScreenShare && (
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden min-h-[300px]">
              <video
                ref={mediaVideoRef}
                src={hostMediaUrl}
                autoPlay={isMediaPlaying}
                controls
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" />
                <span className="text-sm text-white">Host Media</span>
              </div>
            </div>
          )}

          {/* Presenter Mode Content - Priority 3 */}
          {presenterState.isPresenting && !remoteScreenShare && !hostMediaUrl && meetingInfo?.id && (
            <div className="flex-1">
              <GuestPresenterView
                meetingId={meetingInfo.id}
                presenterState={presenterState}
                isFollowing={isFollowing}
                onToggleFollowing={toggleFollowing}
              />
            </div>
          )}

          {/* Default Video View when no presentation */}
          {!hasPresentation && (
            <div className="flex-1 relative bg-slate-800 rounded-lg overflow-hidden min-h-[300px]">
              {isConnected ? (
                <>
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
                      <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center">
                        <VideoOff className="h-12 w-12 text-slate-400" />
                      </div>
                    </div>
                  )}
                  <Badge className="absolute bottom-4 left-4 bg-black/60">
                    {guestName} (You)
                  </Badge>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {meetingStarted ? (
                    <div className="text-center">
                      <Video className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">Ready to join video?</p>
                      <Button onClick={handleJoinVideo} disabled={isJoining} size="lg">
                        {isJoining ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Join Video Call
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Clock className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Waiting for host to start the meeting...</p>
                      {pollingForRoom && (
                        <p className="text-xs text-slate-500 mt-2">Checking every few seconds</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video thumbnail when showing presentation */}
          {hasPresentation && isConnected && (
            <div className="relative w-48 h-36 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
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
                  <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                    <VideoOff className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
                You
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Sidebar - Agenda & Questions */}
        <div 
          className={`bg-slate-800/50 border-l border-slate-700 flex flex-col transition-all duration-200 overflow-hidden ${
            sidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className={`w-80 h-full flex flex-col ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Agenda Section */}
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h2 className="text-white font-medium text-sm">Agenda</h2>
              </div>
              <ScrollArea className="h-36">
                {agendaItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {agendaItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`p-2 rounded text-xs ${
                          item.is_checked 
                            ? 'bg-slate-700/50 text-slate-400 line-through' 
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <span className="text-slate-500 mr-1.5">{idx + 1}.</span>
                        {item.title}
                        {item.timebox_minutes > 0 && (
                          <span className="text-slate-500 ml-1">({item.timebox_minutes}m)</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No agenda items yet</p>
                )}
              </ScrollArea>
            </div>

            {/* Questions Section */}
            <div className="p-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-white font-medium text-sm">Questions & Notes</h2>
              </div>
              <ScrollArea className="flex-1 min-h-24">
                {guestQuestions.length > 0 ? (
                  <div className="space-y-2">
                    {guestQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-700 rounded p-2">
                        <p className="text-xs text-white">{q.content}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {q.name} • {format(new Date(q.timestamp), "h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No questions yet. Add one below.</p>
                )}
              </ScrollArea>
              
              <div className="mt-2 flex gap-2">
                <Textarea
                  placeholder="Add a question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[50px] resize-none text-xs"
                />
                <Button 
                  size="icon" 
                  onClick={handleAddQuestion}
                  disabled={isAddingQuestion || !newQuestion.trim()}
                  className="self-end h-8 w-8"
                >
                  {isAddingQuestion ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}