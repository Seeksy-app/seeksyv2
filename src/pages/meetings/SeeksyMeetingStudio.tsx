import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Clock, Users, Shield } from 'lucide-react';
import MeetingControls from '@/components/meetings/MeetingControls';
import MeetingParticipantGrid from '@/components/meetings/MeetingParticipantGrid';
import MeetingChat from '@/components/meetings/MeetingChat';
import MeetingWaitingRoom from '@/components/meetings/MeetingWaitingRoom';
import { useMeetingStudio } from '@/hooks/useMeetingStudio';

const MeetingStudio = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);

  const {
    isConnected,
    isConnecting,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    participants,
    localVideoRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
    leaveCall,
    joinCall,
  } = useMeetingStudio(meetingId || '');

  // Fetch meeting details
  useEffect(() => {
    if (!meetingId) return;

    const fetchMeeting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error || !data) {
        toast({ title: 'Meeting not found', variant: 'destructive' });
        navigate('/');
        return;
      }

      setMeeting(data);
      setIsHost(data.user_id === user?.id);
    };

    fetchMeeting();
  }, [meetingId]);

  // Timer
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Subscribe to waiting participants
  useEffect(() => {
    if (!meetingId || !isHost) return;

    const channel = supabase
      .channel(`waiting-${meetingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_participants',
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload) => {
        fetchWaitingParticipants();
      })
      .subscribe();

    fetchWaitingParticipants();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, isHost]);

  const fetchWaitingParticipants = async () => {
    const { data } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('status', 'waiting');
    
    setWaitingParticipants(data || []);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeave = async () => {
    await leaveCall();
    navigate('/');
  };

  const handleEndMeeting = async () => {
    if (!isHost) return;
    
    await supabase
      .from('meetings')
      .update({ is_active: false, status: 'completed' })
      .eq('id', meetingId);
    
    await leaveCall();
    toast({ title: 'Meeting ended for all participants' });
    navigate('/admin/meetings/scheduled');
  };

  const admitParticipant = async (participantId: string) => {
    await supabase
      .from('meeting_participants')
      .update({ status: 'admitted' })
      .eq('id', participantId);
    
    toast({ title: 'Participant admitted' });
  };

  const rejectParticipant = async (participantId: string) => {
    await supabase
      .from('meeting_participants')
      .update({ status: 'rejected' })
      .eq('id', participantId);
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-medium">{meeting.title}</h1>
          {isHost && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Host
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-4 w-4" />
            <span>{participants.length + 1}</span>
          </div>

          {isHost && waitingParticipants.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWaitingRoomOpen(true)}
              className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
            >
              {waitingParticipants.length} waiting
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className={`flex-1 p-4 ${isChatOpen ? 'pr-0' : ''}`}>
          <MeetingParticipantGrid
            participants={participants}
            localVideoRef={localVideoRef}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
          />
        </div>

        {/* Chat Drawer */}
        {isChatOpen && (
          <MeetingChat
            meetingId={meetingId || ''}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isHost={isHost}
        isChatOpen={isChatOpen}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onEndMeeting={handleEndMeeting}
      />

      {/* Waiting Room Modal */}
      {isWaitingRoomOpen && (
        <MeetingWaitingRoom
          participants={waitingParticipants}
          onAdmit={admitParticipant}
          onReject={rejectParticipant}
          onClose={() => setIsWaitingRoomOpen(false)}
        />
      )}
    </div>
  );
};

export default MeetingStudio;
