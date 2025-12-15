import { useState, useRef, useEffect, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isLocal?: boolean;
}

export const useBoardMeetingVideo = (meetingNoteId: string) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomName, setRoomName] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize Daily call and create/join room
  const startVideoMeeting = useCallback(async () => {
    if (!meetingNoteId || callObject) return;
    
    setIsConnecting(true);
    
    try {
      // Create board meeting room via edge function
      const { data, error } = await supabase.functions.invoke('daily-create-board-room', {
        body: { meetingNoteId },
      });

      if (error || !data) {
        throw new Error(data?.error || 'Failed to create meeting room');
      }

      setRoomName(data.roomName);

      // Create Daily call object
      const daily = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });

      // Set up event handlers
      daily.on('joined-meeting', () => {
        setIsConnected(true);
        setIsConnecting(false);
        
        // Get local video
        if (localVideoRef.current) {
          const localParticipant = daily.participants().local;
          if (localParticipant?.tracks?.video?.track) {
            const stream = new MediaStream([localParticipant.tracks.video.track]);
            localVideoRef.current.srcObject = stream;
          }
        }
        
        // Capture audio stream for AI transcription
        const localParticipant = daily.participants().local;
        if (localParticipant?.tracks?.audio?.track) {
          const audioOnlyStream = new MediaStream([localParticipant.tracks.audio.track]);
          setAudioStream(audioOnlyStream);
        }
        
        toast.success('Joined video meeting');
      });

      daily.on('left-meeting', () => {
        setIsConnected(false);
        setParticipants([]);
        setAudioStream(null);
      });

      daily.on('participant-joined', (event: any) => {
        if (!event?.participant || event.participant.local) return;
        
        const p = event.participant;
        setParticipants(prev => [...prev, {
          id: p.session_id,
          name: p.user_name || 'Guest',
          isVideoOff: !p.video,
          isMuted: !p.audio,
          isLocal: false,
        }]);
      });

      daily.on('participant-left', (event: any) => {
        if (!event?.participant) return;
        setParticipants(prev => prev.filter(p => p.id !== event.participant.session_id));
      });

      daily.on('participant-updated', (event: any) => {
        if (!event?.participant) return;
        const p = event.participant;
        
        if (p.local) {
          setIsMuted(!p.audio);
          setIsVideoOff(!p.video);
          
          // Update local video
          if (localVideoRef.current && p.tracks?.video?.track) {
            const stream = new MediaStream([p.tracks.video.track]);
            localVideoRef.current.srcObject = stream;
          }
        } else {
          setParticipants(prev => prev.map(participant =>
            participant.id === p.session_id
              ? { ...participant, isVideoOff: !p.video, isMuted: !p.audio }
              : participant
          ));
        }
      });

      daily.on('recording-started', () => {
        setIsRecording(true);
        toast.success('Recording started');
      });

      daily.on('recording-stopped', () => {
        setIsRecording(false);
        toast.info('Recording stopped');
      });

      daily.on('recording-error', (event: any) => {
        console.error('Recording error:', event);
        toast.error('Recording error occurred');
      });

      daily.on('error', (event: any) => {
        console.error('Daily error:', event);
        toast.error(event?.errorMsg || 'Meeting error occurred');
      });

      setCallObject(daily);

      // Join the room
      await daily.join({
        url: data.roomUrl,
        token: data.token,
      });

    } catch (error: any) {
      console.error('Error starting video meeting:', error);
      toast.error(error.message || 'Failed to start video meeting');
      setIsConnecting(false);
    }
  }, [meetingNoteId, callObject]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalAudio(isMuted);
    setIsMuted(!isMuted);
  }, [callObject, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalVideo(isVideoOff);
    setIsVideoOff(!isVideoOff);
  }, [callObject, isVideoOff]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!callObject || !roomName) return;
    
    try {
      await callObject.startRecording();
      
      // Update database
      await supabase
        .from('board_meeting_notes')
        .update({ recording_status: 'recording' })
        .eq('id', meetingNoteId);
        
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, [callObject, roomName, meetingNoteId]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!callObject) return;
    
    try {
      await callObject.stopRecording();
      
      // Update database
      await supabase
        .from('board_meeting_notes')
        .update({ recording_status: 'processing' })
        .eq('id', meetingNoteId);
        
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [callObject, meetingNoteId]);

  // Leave meeting
  const leaveCall = useCallback(async () => {
    if (!callObject) return;
    
    try {
      if (isRecording) {
        await callObject.stopRecording();
      }
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setIsConnected(false);
      setParticipants([]);
      setAudioStream(null);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [callObject, isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave().catch(console.error);
        callObject.destroy();
      }
    };
  }, [callObject]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isVideoOff,
    isRecording,
    participants,
    localVideoRef,
    audioStream,
    startVideoMeeting,
    toggleMute,
    toggleVideo,
    startRecording,
    stopRecording,
    leaveCall,
  };
};
