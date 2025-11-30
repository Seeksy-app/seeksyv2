import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, Play, Pause, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VOICE_PROMPTS = [
  "Hi, my name is {name}. I'm recording this sample to verify my voice on Seeksy and protect my identity.",
  "This is {name} confirming that Seeksy can use this recording only to verify my voice and secure my account.",
  "I'm {name}, and I'm recording this voice sample so Seeksy can help keep my identity safe on the platform.",
  "My name is {name}, and I'm verifying my voice on Seeksy to protect my content and identity.",
  "This is {name}. I authorize Seeksy to use this voice recording for identity verification purposes only."
];

type RecordingState = 'idle' | 'countdown' | 'recording' | 'review' | 'verifying' | 'already-verified';

type VerifyVoiceAndMintPayload = {
  audioData: string;
  recordingDuration: number;
  selectedPrompt: string;
};

type VerifyVoiceAndMintError = {
  ok: false;
  error: 'MISSING_FIELD' | 'INVALID_AUDIO' | 'BLOCKCHAIN_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  field?: string;
};

type VerifyVoiceAndMintSuccess = {
  success: true;
  voiceProfileId: string;
  voiceHash: string;
  certificate: {
    token_id: string;
    tx_hash: string;
    explorer_url: string;
    contract_address: string;
  };
};

function mapVoiceError(e: VerifyVoiceAndMintError): string {
  switch (e.error) {
    case "MISSING_FIELD":
      return "Something went wrong with your recording. Please try again.";
    case "INVALID_AUDIO":
      return "We couldn't verify your voice from this recording. Try again from a quiet place and read the full sentence on screen.";
    case "BLOCKCHAIN_ERROR":
      return "Your voice was verified, but the blockchain network had an issue. Please try again in a moment.";
    case "DATABASE_ERROR":
      return "We hit a server issue saving your verification. Please try again, or contact support if this continues.";
    default:
      return "Verification failed. Please try again, or contact support if the issue continues.";
  }
}

const VoiceVerificationUnified = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // User & Script
  const [userName, setUserName] = useState<string>("there");
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [existingCertId, setExistingCertId] = useState<string | null>(null);
  const [mintProgress, setMintProgress] = useState(0);
  
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
    checkExistingVerification();
    fetchUserAndPrompt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const checkExistingVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing verified certificate
      const { data: certData } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("id, certification_status")
        .eq("creator_id", user.id)
        .eq("certification_status", "verified")
        .maybeSingle();

      if (certData) {
        setExistingCertId(certData.id);
        setState('already-verified');
      }
    } catch (error) {
      console.error("Error checking existing verification:", error);
    }
  };

  const fetchUserAndPrompt = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || "there";
    setUserName(name);
    
    // Generate all prompts with user's name
    const personalizedPrompts = VOICE_PROMPTS.map(prompt => prompt.replace('{name}', name));
    setPrompts(personalizedPrompts);
  };

  const handleResetVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !existingCertId) return;

      // Mark old certificate as revoked
      const { error: updateError } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .update({ certification_status: "revoked" })
        .eq("id", existingCertId)
        .eq("creator_id", user.id);

      if (updateError) throw updateError;

      // Reset state to allow new verification
      setExistingCertId(null);
      setState('idle');
      setShowResetModal(false);
      
      toast.success("Reset complete", {
        description: "You can now verify your voice again."
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] });
      queryClient.invalidateQueries({ queryKey: ['identity-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      
    } catch (error) {
      console.error("Error resetting verification:", error);
      toast.error("Reset failed", {
        description: "Could not reset verification. Please try again."
      });
    }
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
          if (newTime >= 30) {
            // Auto-stop at 30 seconds
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
        if (recordingTime < 12) {
          setError("Recording too short\nWe couldn't hear enough speech to verify your voice. Try again with at least 12 seconds of audio.");
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
    setState('verifying');
    setMintProgress(0);
    
    // Simulate progress during minting
    const progressInterval = setInterval(() => {
      setMintProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Prepare payload with selected prompt
        const payload: VerifyVoiceAndMintPayload = {
          audioData: base64Audio,
          recordingDuration: recordingTime,
          selectedPrompt: prompts[selectedPromptIndex]
        };

        // Call verify-voice-and-mint edge function
        const { data, error: invokeError } = await supabase.functions.invoke<VerifyVoiceAndMintSuccess | VerifyVoiceAndMintError>(
          'verify-voice-and-mint',
          { body: payload }
        );

        clearInterval(progressInterval);
        setMintProgress(100);

        if (invokeError) {
          throw new Error(invokeError.message || "Failed to verify voice");
        }

        // Check if response is an error
        if (data && 'ok' in data && data.ok === false) {
          const errorResponse = data as VerifyVoiceAndMintError;
          setError(mapVoiceError(errorResponse));
          setState('review');
          toast.error("Verification failed", {
            description: mapVoiceError(errorResponse)
          });
          return;
        }

        // Success - navigate to success page
        if (data && 'success' in data && data.success) {
          const successResponse = data as VerifyVoiceAndMintSuccess;
          
          // Invalidate all identity-related queries to update UI instantly
          queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] });
          queryClient.invalidateQueries({ queryKey: ['identity-status'] });
          queryClient.invalidateQueries({ queryKey: ['identity-status-widget'] });
          queryClient.invalidateQueries({ queryKey: ['identity-assets'] });
          queryClient.invalidateQueries({ queryKey: ['identity-activity-logs'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
          
          toast.success("Voice verified!", {
            description: "Your voice identity is now on-chain."
          });

          // Add smooth transition delay
          setTimeout(() => {
            navigate("/identity/voice/success", {
              state: {
                voiceProfileId: successResponse.voiceProfileId,
                voiceHash: successResponse.voiceHash,
                tokenId: successResponse.certificate.token_id,
                explorerUrl: successResponse.certificate.explorer_url,
                transactionHash: successResponse.certificate.tx_hash
              }
            });
          }, 500);
        } else {
          throw new Error("Unexpected response format");
        }
      };
      reader.readAsDataURL(audioBlob);

    } catch (err) {
      console.error('Verification error:', err);
      clearInterval(progressInterval);
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError("Something went wrong\nWe hit a problem verifying this recording. Please try again. If it keeps happening, contact support.");
      setState('review');
      toast.error("Verification failed", {
        description: errorMsg
      });
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

        <Card className="p-12 transition-all duration-300">
          <div className="text-center space-y-6">
            {/* Already Verified State */}
            {state === 'already-verified' && (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
                  <ShieldCheck className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-3">Voice Identity Verified</h1>
                  <p className="text-muted-foreground">
                    Your voice is already verified on-chain. To verify again, you must reset your current certificate.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate("/identity")}
                    className="w-full"
                  >
                    Return to Identity Hub
                  </Button>
                  <Button 
                    onClick={() => setShowResetModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Voice Identity
                  </Button>
                </div>
              </div>
            )}

            {/* Verification Flow States */}
            {state !== 'already-verified' && (
              <>
                {/* Header - Always visible */}
                <div>
                  <h1 className="text-3xl font-bold mb-3">Verify Your Voice Identity</h1>
                  <p className="text-muted-foreground">
                    {state === 'countdown' && `Recording starts in...`}
                    {state === 'recording' && 'Recording in progress'}
                    {(state === 'idle' || state === 'review') && 'Read the phrase below out loud.'}
                    {state === 'verifying' && 'Processing your voice sample...'}
                  </p>
                </div>

                {/* Script Selector - Show only in idle state */}
                {state === 'idle' && prompts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Choose a verification phrase:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {prompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPromptIndex(index)}
                          className={`
                            flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${selectedPromptIndex === index
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }
                          `}
                        >
                          Phrase {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script Block - Always visible except in review and verifying */}
                {state !== 'review' && state !== 'verifying' && prompts.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20 p-8">
                    <p className="text-lg leading-relaxed">
                      "{prompts[selectedPromptIndex]}"
                    </p>
                  </Card>
                )}

                {/* Countdown Display */}
                {state === 'countdown' && (
                  <div className="space-y-6" style={{ minHeight: '320px' }}>
                    <div className="text-8xl font-bold text-primary animate-pulse">
                      {countdown}
                    </div>
                    <Button 
                      size="lg" 
                      disabled
                      className="w-full opacity-50"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Starting...
                    </Button>
                  </div>
                )}

                {/* State: Idle */}
                {state === 'idle' && prompts.length > 0 && (
                  <div style={{ minHeight: '80px' }}>
                    <Button 
                      size="lg" 
                      onClick={handleBeginRecording}
                      className="w-full"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Begin Recording
                    </Button>
                  </div>
                )}

                {/* State: Recording */}
                {state === 'recording' && (
                  <div className="space-y-6" style={{ minHeight: '320px' }}>
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

                    {/* Timer - Large Apple-style */}
                    <div className="text-7xl font-bold tracking-tight">{formatTime(recordingTime)}</div>
                    
                    {/* Fixed height container for button and label */}
                    <div className="space-y-2" style={{ minHeight: '80px' }}>
                      <Button 
                        size="lg" 
                        variant="destructive" 
                        onClick={stopRecording}
                        className={`w-full transition-opacity duration-300 ${recordingTime < 12 ? 'opacity-50' : 'opacity-100'}`}
                        disabled={recordingTime < 12}
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop Recording
                      </Button>

                      <p className="text-xs text-muted-foreground transition-opacity duration-300" style={{ minHeight: '20px' }}>
                        {recordingTime < 12 ? 'Minimum 12 seconds required' : 'Ready to stop'}
                      </p>
                    </div>
                  </div>
                )}

                {/* State: Verifying */}
                {state === 'verifying' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="bg-primary/5 border-primary/20 p-8">
                      <p className="text-lg leading-relaxed text-muted-foreground">
                        "{prompts[selectedPromptIndex]}"
                      </p>
                    </Card>
                    
                    <div className="animate-pulse">
                      <div className="h-24 flex items-center justify-center gap-1">
                        {new Array(40).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary/30 rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 20}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Minting your voice certificate on-chain… this may take a few seconds.
                      </p>
                      <Progress value={mintProgress} className="w-full" />
                    </div>
                  </div>
                )}

                {/* State: Review */}
                {state === 'review' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
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
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Voice Identity?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Resetting will invalidate your existing voice certificate and mint a new one. 
                This action is permanent.
              </p>
              <p className="font-medium">
                Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetVerification}>
              Reset and Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceVerificationUnified;
