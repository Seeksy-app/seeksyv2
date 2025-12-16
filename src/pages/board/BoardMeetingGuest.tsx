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

  const callFrameRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    presenterState,
    isFollowing,
    toggleFollowing,
  } = usePresenterMode({
    meetingId: meetingInfo?.id || '',
    isHost: false,
  });

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

      // Parse agenda_items from JSON if available
      if (meetingData.agenda_items && Array.isArray(meetingData.agenda_items)) {
        setAgendaItems(meetingData.agenda_items as unknown as AgendaItem[]);
      }

      // Parse member_questions for guest questions
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
      });

      callFrame.on("left-meeting", () => {
        setIsConnected(false);
        callFrameRef.current = null;
      });

      callFrame.on("participant-joined", updateParticipantCount);
      callFrame.on("participant-left", updateParticipantCount);

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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div>
          <h1 className="text-white font-medium">{meetingInfo?.title || "Board Meeting"}</h1>
          <p className="text-sm text-slate-400">
            {meetingInfo?.meeting_date 
              ? format(new Date(meetingInfo.meeting_date), "MMMM d, yyyy")
              : "Guest: " + guestName}
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">{participantCount}</span>
          </div>
        )}
      </div>

      {/* Meeting not started banner */}
      {!meetingStarted && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-amber-500 font-medium">Meeting hasn't started yet</p>
            <p className="text-sm text-amber-500/80">
              {pollingForRoom 
                ? "Waiting for host to start... You can review the agenda below."
                : "Review the agenda below while waiting for the host."}
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video area */}
        <div className="lg:flex-1 p-4">
          {isConnected ? (
            <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden">
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
          ) : (
            <div className="w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
              {meetingStarted ? (
                <div className="text-center">
                  <Video className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">Ready to join video?</p>
                  <Button onClick={handleJoinVideo} disabled={isJoining}>
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
                  <Clock className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Waiting for host to start the meeting...</p>
                  {pollingForRoom && (
                    <p className="text-xs text-slate-500 mt-2">Checking every few seconds</p>
                  )}
                </div>
              )}
            </div>
          )}

          {meetingInfo?.id && presenterState.isPresenting && (
            <div className="mt-4">
              <GuestPresenterView
                meetingId={meetingInfo.id}
                presenterState={presenterState}
                isFollowing={isFollowing}
                onToggleFollowing={toggleFollowing}
              />
            </div>
          )}
        </div>

        {/* Sidebar - Agenda & Questions */}
        <div className="w-full lg:w-96 bg-slate-800/50 border-l border-slate-700 flex flex-col">
          {/* Agenda Section */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="text-white font-medium">Agenda</h2>
            </div>
            <ScrollArea className="h-48">
              {agendaItems.length > 0 ? (
                <div className="space-y-2">
                  {agendaItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-2 rounded text-sm ${
                        item.is_checked 
                          ? 'bg-slate-700/50 text-slate-400 line-through' 
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      <span className="text-slate-500 mr-2">{idx + 1}.</span>
                      {item.title}
                      {item.timebox_minutes > 0 && (
                        <span className="text-slate-500 ml-2">({item.timebox_minutes}m)</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No agenda items yet</p>
              )}
            </ScrollArea>
          </div>

          {/* Questions Section */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-white font-medium">Questions & Notes</h2>
            </div>
            <ScrollArea className="flex-1 min-h-32">
              {guestQuestions.length > 0 ? (
                <div className="space-y-3">
                  {guestQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-700 rounded p-2">
                      <p className="text-sm text-white">{q.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {q.name} • {format(new Date(q.timestamp), "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No questions yet. Add one below.</p>
              )}
            </ScrollArea>
            
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="Add a question or note..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px] resize-none"
              />
              <Button 
                size="icon" 
                onClick={handleAddQuestion}
                disabled={isAddingQuestion || !newQuestion.trim()}
                className="self-end"
              >
                {isAddingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Controls */}
      {isConnected && (
        <div className="bg-slate-800 px-4 py-4 flex items-center justify-center gap-3 border-t border-slate-700">
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
      )}
    </div>
  );
}
