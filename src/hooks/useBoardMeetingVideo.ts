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
  const [hasActiveRoom, setHasActiveRoom] = useState(false);
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);
  const [aiNotesStatus, setAiNotesStatus] = useState<string>('none');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if meeting has an active room
  useEffect(() => {
    const checkActiveRoom = async () => {
      if (!meetingNoteId) return;
      
      const { data } = await supabase
        .from('board_meeting_notes')
        .select('room_name, room_url')
        .eq('id', meetingNoteId)
        .single();
      
      setHasActiveRoom(!!(data?.room_name && data?.room_url));
    };
    
    checkActiveRoom();
  }, [meetingNoteId]);

  // Common function to join a Daily room
  const joinRoom = useCallback(async (roomUrl: string, token: string, roomNameVal: string) => {
    setRoomName(roomNameVal);

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
      url: roomUrl,
      token: token,
    });
  }, []);

  // Start a new video meeting (host)
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

      setHasActiveRoom(true);
      await joinRoom(data.roomUrl, data.token, data.roomName);

    } catch (error: any) {
      console.error('Error starting video meeting:', error);
      toast.error(error.message || 'Failed to start video meeting');
      setIsConnecting(false);
    }
  }, [meetingNoteId, callObject, joinRoom]);

  // Join an existing video meeting (participant)
  const joinVideoMeeting = useCallback(async () => {
    if (!meetingNoteId || callObject) return;
    
    setIsConnecting(true);
    
    try {
      // Get participant token via edge function
      const { data, error } = await supabase.functions.invoke('daily-join-board-room', {
        body: { meetingNoteId },
      });

      if (error || !data) {
        throw new Error(data?.error || 'Failed to join meeting room');
      }

      await joinRoom(data.roomUrl, data.token, data.roomName);

    } catch (error: any) {
      console.error('Error joining video meeting:', error);
      toast.error(error.message || 'Failed to join video meeting');
      setIsConnecting(false);
    }
  }, [meetingNoteId, callObject, joinRoom]);

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
      // Stop audio capture if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setIsConnected(false);
      setParticipants([]);
      setAudioStream(null);
      setIsCapturingAudio(false);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [callObject, isRecording]);

  // Start capturing audio from the meeting
  const startAudioCapture = useCallback(async () => {
    if (!callObject || isCapturingAudio) return;
    
    try {
      // Get all audio tracks from participants
      const allParticipants = callObject.participants();
      const audioTracks: MediaStreamTrack[] = [];
      
      Object.values(allParticipants).forEach((p: any) => {
        if (p.tracks?.audio?.track) {
          audioTracks.push(p.tracks.audio.track);
        }
      });
      
      if (audioTracks.length === 0) {
        toast.error('No audio tracks available');
        return;
      }
      
      // Create a combined audio stream
      const combinedStream = new MediaStream(audioTracks);
      
      // Set up MediaRecorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('Audio capture stopped, saving to storage...');
        await saveAudioToStorage();
      };
      
      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsCapturingAudio(true);
      
      toast.success('Audio capture started');
      console.log('Started audio capture with', audioTracks.length, 'tracks');
    } catch (error) {
      console.error('Error starting audio capture:', error);
      toast.error('Failed to start audio capture');
    }
  }, [callObject, isCapturingAudio, meetingNoteId]);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsCapturingAudio(false);
      toast.info('Audio capture stopped');
    }
  }, []);

  // Save captured audio to Supabase Storage
  const saveAudioToStorage = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || !meetingNoteId) {
      console.log('No audio chunks to save');
      return null;
    }
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `${meetingNoteId}/${Date.now()}-meeting-audio.webm`;
      
      console.log('Saving audio file:', fileName, 'size:', audioBlob.size);
      
      const { data, error } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Update meeting record with audio file URL
      const { error: updateError } = await supabase
        .from('board_meeting_notes')
        .update({ 
          audio_file_url: fileName,
          ai_notes_status: 'audio_saved',
        })
        .eq('id', meetingNoteId);
      
      if (updateError) {
        console.error('Update error:', updateError);
      }
      
      toast.success('Meeting audio saved');
      console.log('Audio saved to storage:', data?.path);
      return fileName;
    } catch (error) {
      console.error('Error saving audio:', error);
      toast.error('Failed to save meeting audio');
      return null;
    }
  }, [meetingNoteId]);

  // End meeting and trigger AI notes generation
  const endMeetingAndGenerateNotes = useCallback(async () => {
    if (!meetingNoteId) return;
    
    setIsGeneratingNotes(true);
    
    try {
      // Stop audio capture and save
      let audioFilePath: string | null = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        // Wait for onstop handler
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get the saved audio file path
      const { data: meetingData } = await supabase
        .from('board_meeting_notes')
        .select('audio_file_url')
        .eq('id', meetingNoteId)
        .single();
      
      audioFilePath = meetingData?.audio_file_url;
      
      if (!audioFilePath) {
        // If no audio was captured, we still allow generating notes from existing transcript
        const { data: existingData } = await supabase
          .from('board_meeting_notes')
          .select('audio_transcript')
          .eq('id', meetingNoteId)
          .single();
        
        if (!existingData?.audio_transcript) {
          toast.error('No audio recorded. Please record the meeting first.');
          setIsGeneratingNotes(false);
          return;
        }
      }
      
      // Leave the video call
      await leaveCall();
      
      // Step 1: Transcribe audio (if we have audio file)
      if (audioFilePath) {
        setAiNotesStatus('transcribing');
        toast.info('Transcribing meeting audio...');
        
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
          'transcribe-meeting-audio',
          { body: { meetingNoteId, audioFilePath } }
        );
        
        if (transcribeError || transcribeData?.error) {
          throw new Error(transcribeData?.error || 'Transcription failed');
        }
        
        toast.success('Transcription complete');
      }
      
      // Step 2: Generate AI notes
      setAiNotesStatus('generating');
      toast.info('Generating AI meeting notes...');
      
      const { data: notesData, error: notesError } = await supabase.functions.invoke(
        'generate-board-ai-notes',
        { body: { meetingNoteId } }
      );
      
      if (notesError || notesData?.error) {
        throw new Error(notesData?.error || 'AI notes generation failed');
      }
      
      setAiNotesStatus('draft');
      toast.success('AI meeting notes generated! Review and publish when ready.');
      
    } catch (error: any) {
      console.error('Error ending meeting:', error);
      toast.error(error.message || 'Failed to generate meeting notes');
      setAiNotesStatus('error');
    } finally {
      setIsGeneratingNotes(false);
    }
  }, [meetingNoteId, leaveCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave().catch(console.error);
        callObject.destroy();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [callObject]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isVideoOff,
    isRecording,
    isCapturingAudio,
    isGeneratingNotes,
    aiNotesStatus,
    participants,
    localVideoRef,
    audioStream,
    hasActiveRoom,
    startVideoMeeting,
    joinVideoMeeting,
    toggleMute,
    toggleVideo,
    startRecording,
    stopRecording,
    leaveCall,
    startAudioCapture,
    stopAudioCapture,
    endMeetingAndGenerateNotes,
  };
};
