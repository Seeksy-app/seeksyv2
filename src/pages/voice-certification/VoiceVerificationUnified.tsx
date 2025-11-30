import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, Play, Pause, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform."
];

type RecordingState = 'idle' | 'countdown' | 'recording' | 'review';

const VoiceVerificationUnified = () => {
  const navigate = useNavigate();
  
  // User & Script
  const [userName, setUserName] = useState<string>("there");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  
  // State Machine
  const [state, setState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  
  // Recording
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));

  useEffect(() => {
    fetchUserAndPrompt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const fetchUserAndPrompt = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || "there";
    setUserName(name);
    
    const randomPrompt = VOICE_PROMPTS[Math.floor(Math.random() * VOICE_PROMPTS.length)];
    setSelectedPrompt(randomPrompt.replace('{name}', name));
  };

  const handleBeginRecording = () => {
    setState('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start waveform animation
      animateWaveform();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 20) {
            // Auto-stop at 20 seconds
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setError("Microphone not available. Please enable access and retry.");
      setState('idle');
      toast.error("Microphone blocked", {
        description: "Please enable microphone access in your browser."
      });
    }
  };

  const animateWaveform = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Take 40 samples and normalize to 0-1
      const samples = [];
      const sampleSize = Math.floor(dataArray.length / 40);
      for (let i = 0; i < 40; i++) {
        const start = i * sampleSize;
        const slice = dataArray.slice(start, start + sampleSize);
        const average = slice.reduce((a, b) => a + b, 0) / slice.length;
        samples.push(average / 255);
      }
      
      setWaveformData(samples);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setTimeout(() => {
        if (recordingTime < 8) {
          setError("Recording too short\nWe couldn't hear enough speech to verify your voice. Try again with at least 8 seconds of audio.");
          setState('idle');
          chunksRef.current = [];
          setRecordingTime(0);
        } else {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setState('review');
        }
      }, 100);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRerecord = () => {
    setAudioBlob(null);
    setAudioUrl("");
    setRecordingTime(0);
    setError("");
    setState('idle');
    chunksRef.current = [];
  };

  const handleContinue = async () => {
    if (!audioBlob) return;
    
    setError("");
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Validate with backend
        const { data, error: validationError } = await supabase.functions.invoke('verify-voice-quality', {
          body: {
            audioData: base64Audio,
            recordingDuration: recordingTime,
            selectedPrompt
          }
        });

        if (validationError) {
          throw validationError;
        }

        if (!data.valid) {
          setError(data.errorMessage || "Voice verification failed");
          return;
        }

        // Navigate to minting screen
        navigate("/identity/voice/verifying", {
          state: { 
            audioData: base64Audio, 
            recordingTime, 
            selectedPrompt,
            voicedSeconds: data.voicedSeconds
          }
        });
      };
      reader.readAsDataURL(audioBlob);

    } catch (err) {
      console.error('Validation error:', err);
      setError("Something went wrong\nWe hit a problem verifying this recording. Please try again. If it keeps happening, contact support.");
      toast.error("Validation failed");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Identity
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-6">
            {/* Header - Always visible */}
            <div>
              <h1 className="text-3xl font-bold mb-3">Verify Your Voice Identity</h1>
              <p className="text-muted-foreground">
                {state === 'countdown' && `Recording starts in ${countdown}…`}
                {state === 'recording' && 'Recording in progress'}
                {(state === 'idle' || state === 'review') && 'Read the phrase below out loud.'}
              </p>
            </div>

            {/* Script Block - Always visible except in review */}
            {state !== 'review' && (
              <Card className="bg-primary/5 border-primary/20 p-8">
                <p className="text-lg leading-relaxed">
                  "{selectedPrompt}"
                </p>
              </Card>
            )}

            {/* State 1: Idle */}
            {state === 'idle' && (
              <Button 
                size="lg" 
                onClick={handleBeginRecording}
                className="w-full"
              >
                <Mic className="h-5 w-5 mr-2" />
                Begin Recording
              </Button>
            )}

            {/* State 2: Countdown - Button disabled */}
            {state === 'countdown' && (
              <Button 
                size="lg" 
                disabled
                className="w-full"
              >
                <Mic className="h-5 w-5 mr-2" />
                Starting...
              </Button>
            )}

            {/* State 3: Recording */}
            {state === 'recording' && (
              <div className="space-y-6">
                {/* Live Waveform */}
                <div className="h-32 flex items-center justify-center gap-1">
                  {waveformData.map((value, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(20, value * 100)}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-4xl font-bold">{formatTime(recordingTime)}</div>
                
                {/* Stop Button */}
                <Button 
                  size="lg" 
                  variant="destructive" 
                  onClick={stopRecording}
                  className="w-full"
                  disabled={recordingTime < 8}
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>

                {recordingTime < 8 && (
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 seconds required
                  </p>
                )}
              </div>
            )}

            {/* State 4: Review */}
            {state === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Here's your recording:</h2>
                  <p className="text-muted-foreground">
                    Duration: {formatTime(recordingTime)}
                  </p>
                </div>

                {/* Static Waveform Preview */}
                <div className="h-24 flex items-center justify-center gap-1">
                  {new Array(40).fill(0).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary/50 rounded-full"
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Audio Playback */}
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={togglePlayback}
                  className="w-full"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleRerecord}
                    className="flex-1"
                  >
                    Re-record
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-destructive bg-destructive/5 p-4">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-left whitespace-pre-line">{error}</p>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceVerificationUnified;
