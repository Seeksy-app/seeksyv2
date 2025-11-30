import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const VoiceRecording = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPrompt = location.state?.selectedPrompt || "";
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setError("Microphone not available. Please enable access and retry.");
      toast.error("Microphone blocked", {
        description: "Please enable microphone access in your browser."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Wait for blob to be ready
      setTimeout(() => {
        if (recordingTime < 5) {
          setError("Recording too short. Try again with at least 5 seconds of audio.");
          chunksRef.current = [];
          setRecordingTime(0);
        } else {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          navigate("/identity/voice/playback", {
            state: { blob, recordingTime, selectedPrompt }
          });
        }
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity/voice/verify")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-8">
            {!isRecording && (
              <>
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-16 w-16 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-3">Ready to Record</h1>
                  <p className="text-muted-foreground">
                    Recording… 3…2…1…
                  </p>
                </div>
                <Button size="lg" onClick={startRecording} className="w-full">
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              </>
            )}

            {isRecording && (
              <>
                <div className="relative">
                  {/* Waveform visualization */}
                  <div className="h-32 flex items-center justify-center gap-1">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 80 + 20}%`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-4xl font-bold">{formatTime(recordingTime)}</div>
                
                <Button 
                  size="lg" 
                  variant="destructive" 
                  onClick={stopRecording}
                  className="w-full"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {error && (
              <Card className="border-destructive bg-destructive/5 p-4">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceRecording;
