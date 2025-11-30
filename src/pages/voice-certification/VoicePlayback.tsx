import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VoicePlayback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const blob = location.state?.blob;
  const recordingTime = location.state?.recordingTime || 0;
  const selectedPrompt = location.state?.selectedPrompt || "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      navigate("/identity/voice/verify");
    }
  }, [blob]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleContinue = async () => {
    if (!blob) return;
    
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

        // Navigate to verification screen
        navigate("/identity/voice/verifying", {
          state: { 
            audioData: base64Audio, 
            recordingTime, 
            selectedPrompt,
            voicedSeconds: data.voicedSeconds
          }
        });
      };
      reader.readAsDataURL(blob);

    } catch (err) {
      console.error('Validation error:', err);
      setError("We couldn't detect any sound—please speak louder or move closer.");
      toast.error("Validation failed");
    }
  };

  const handleRerecord = () => {
    navigate("/identity/voice/record", { state: { selectedPrompt } });
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity/voice/record", { state: { selectedPrompt } })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">Here's your recording:</h1>
              <p className="text-muted-foreground">
                Duration: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Audio Playback */}
            <div className="py-8">
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
                className="w-48 h-48 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-12 w-12" />
                ) : (
                  <Play className="h-12 w-12 ml-2" />
                )}
              </Button>
            </div>

            {error && (
              <Card className="border-destructive bg-destructive/5 p-4">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              </Card>
            )}

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
        </Card>
      </div>
    </div>
  );
};

export default VoicePlayback;
