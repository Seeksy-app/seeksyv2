import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Monitor, MessageSquare, Users, Settings,
  Send, X, Volume2, VolumeX, Link, Copy, Check
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeviceTestDialog } from "@/components/meeting/DeviceTestDialog";

export default function SimpleMeetingStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDeviceTest, setShowDeviceTest] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<{
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch meeting details
  const { data: meeting } = useQuery({
    queryKey: ["meeting-studio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select(`*, meeting_attendees (*)`)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch chat messages
  const { data: dbChatMessages = [] } = useQuery({
    queryKey: ["meeting-chat-studio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_chat")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    setChatMessages(dbChatMessages);
  }, [dbChatMessages]);

  // Subscribe to realtime chat
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`studio-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_chat",
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleDeviceTestComplete = (devices: {
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  }) => {
    setSelectedDevices(devices);
    setShowDeviceTest(false);
  };

  // Start media stream
  useEffect(() => {
    if (!selectedDevices || showDeviceTest) return;

    let mounted = true;

    const startStream = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDevices.videoDeviceId
            ? { deviceId: { exact: selectedDevices.videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: selectedDevices.audioInputDeviceId
            ? { deviceId: { exact: selectedDevices.audioInputDeviceId }, echoCancellation: true, noiseSuppression: true }
            : { echoCancellation: true, noiseSuppression: true },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) videoTrack.enabled = isVideoOn;
        if (audioTrack) audioTrack.enabled = isMicOn;
      } catch (error) {
        console.error("Media error:", error);
        toast.error("Unable to access camera or microphone");
      }
    };

    startStream();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDevices, showDeviceTest]);

  // Toggle video
  useEffect(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isVideoOn;
    }
  }, [isVideoOn]);

  // Toggle audio
  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMicOn;
    }
  }, [isMicOn]);

  // Screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        };
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Screen share error:", error);
        toast.error("Unable to share screen");
      }
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      await supabase.from("meeting_chat").insert({
        meeting_id: id,
        sender_name: profile?.full_name || user?.email || "Host",
        sender_email: user?.email,
        message: chatMessage,
      });

      setChatMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
    }
  };

  // End meeting
  const endMeeting = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    navigate("/meetings");
    toast.success("Meeting ended");
  };

  // Copy invite link
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/meetings/join/${id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DeviceTestDialog open={showDeviceTest} onContinue={handleDeviceTestComplete} />

      <div className="flex flex-col h-screen bg-zinc-950 fixed inset-0 z-50">
        {/* Header */}
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-medium truncate max-w-[300px]">
              {meeting?.title || "Meeting"}
            </h1>
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              Live
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Invite"}
            </Button>
            <span className="flex items-center gap-1 text-zinc-400 text-sm">
              <Users className="h-4 w-4" />
              {(meeting?.meeting_attendees?.length || 0) + 1}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex">
          {/* Video area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full max-h-[calc(100vh-200px)] object-contain rounded-xl bg-zinc-900"
              />
              {!isVideoOn && !isScreenSharing && (
                <div className="absolute inset-4 flex items-center justify-center bg-zinc-900 rounded-xl">
                  <div className="text-center text-zinc-500">
                    <VideoOff className="h-16 w-16 mx-auto mb-3" />
                    <p>Camera Off</p>
                  </div>
                </div>
              )}
              {isScreenSharing && (
                <Badge className="absolute top-6 left-6 bg-green-500">
                  Sharing Screen
                </Badge>
              )}
            </div>

            {/* Controls */}
            <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-3">
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleScreenShare}
              >
                <Monitor className="h-5 w-5" />
              </Button>

              <Button
                variant={showChat ? "default" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={endMeeting}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Chat sidebar */}
          {showChat && (
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
              <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                <h2 className="text-white font-medium">Chat</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-zinc-500 text-center text-sm">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg: any, idx: number) => (
                      <div key={msg.id || idx} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{msg.sender_name}</span>
                          <span className="text-xs text-zinc-500">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-zinc-300">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!chatMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
