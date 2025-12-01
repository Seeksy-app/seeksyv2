import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RecordingState = "idle" | "device-check" | "recording" | "paused" | "complete";

interface RecorderOptions {
  onStateChange?: (state: RecordingState) => void;
  onError?: (error: Error) => void;
  onMarkerAdded?: (type: "clip" | "ad", timestamp: number) => void;
}

export function useStudioRecorder(options?: RecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for media handling
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Update state with callback
  const updateState = useCallback((newState: RecordingState) => {
    setState(newState);
    options?.onStateChange?.(newState);
  }, [options]);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    setError(err.message);
    options?.onError?.(err);
  }, [options]);

  // Initialize audio devices and get stream
  const initializeDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      mediaStreamRef.current = stream;

      // Set up audio analysis for level meter
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start level monitoring
      const monitorLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(monitorLevel);
      };
      
      monitorLevel();
      updateState("device-check");
      return stream;
    } catch (err) {
      handleError(err as Error);
      throw err;
    }
  }, [updateState, handleError]);

  // Create session in database
  const createSession = useCallback(async () => {
    try {
      const roomName = `recording-${Date.now()}`;

      const insertData: any = {
        daily_room_url: roomName,
      };

      const { data, error } = await supabase
        .from("studio_sessions")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      
      setSessionId(data.id);
      return data.id;
    } catch (err) {
      handleError(err as Error);
      throw err;
    }
  }, [handleError]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!mediaStreamRef.current) {
        await initializeDevices();
      }

      const stream = mediaStreamRef.current;
      if (!stream) throw new Error("No media stream");

      // Create session
      const newSessionId = await createSession();

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      updateState("recording");
    } catch (err) {
      handleError(err as Error);
    }
  }, [initializeDevices, createSession, updateState, handleError]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      updateState("paused");
    }
  }, [updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      updateState("recording");
    }
  }, [updateState]);

  // Stop recording and upload
  const stopRecording = useCallback(async () => {
    return new Promise<string | null>(async (resolve) => {
      try {
        if (!mediaRecorderRef.current || !sessionId) {
          resolve(null);
          return;
        }

        mediaRecorderRef.current.onstop = async () => {
          try {
            // Create blob from chunks
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
            });

            // Upload to Supabase Storage
            const fileName = `session-${sessionId}-${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
              .from('studio-recordings')
              .upload(fileName, audioBlob);

            if (uploadError) {
              console.error("Upload error:", uploadError);
            }

            // Update session
            const updateData: any = {
              duration_seconds: duration,
            };

            const { error: updateError } = await supabase
              .from("studio_sessions")
              .update(updateData)
              .eq("id", sessionId);

            if (updateError) throw updateError;

            updateState("complete");
            resolve(sessionId);
          } catch (err) {
            handleError(err as Error);
            resolve(null);
          }
        };

        mediaRecorderRef.current.stop();

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Stop all tracks
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      } catch (err) {
        handleError(err as Error);
        resolve(null);
      }
    });
  }, [sessionId, duration, updateState, handleError]);

  // Add clip marker
  const addClipMarker = useCallback(async (description?: string) => {
    if (!sessionId) return;

    try {
      const insertData: any = {
        session_id: sessionId,
        timestamp_seconds: duration,
      };

      if (description) {
        insertData.description = description;
      }

      const { error } = await supabase.from("clip_markers").insert([insertData]);

      if (error) throw error;
      options?.onMarkerAdded?.("clip", duration);
    } catch (err) {
      handleError(err as Error);
    }
  }, [sessionId, duration, options, handleError]);

  // Add ad marker
  const addAdMarker = useCallback(async (slotType: "pre_roll" | "mid_roll" | "post_roll", notes?: string) => {
    if (!sessionId) return;

    try {
      const insertData: any = {
        session_id: sessionId,
        timestamp_seconds: duration,
        slot_type: slotType,
      };

      if (notes) {
        insertData.notes = notes;
      }

      const { error } = await supabase.from("ad_markers").insert([insertData]);

      if (error) throw error;
      options?.onMarkerAdded?.("ad", duration);
    } catch (err) {
      handleError(err as Error);
    }
  }, [sessionId, duration, options, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return {
    state,
    duration,
    sessionId,
    audioLevel,
    error,
    initializeDevices,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    addClipMarker,
    addAdMarker,
  };
}
