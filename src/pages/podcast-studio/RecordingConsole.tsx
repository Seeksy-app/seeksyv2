import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Pause, Play } from "lucide-react";
import { initializeRecordingSession, startRecording, stopRecording, type AudioTrack } from "@/lib/api/podcastStudioAPI";

type RecordingState = "idle" | "recording" | "paused";

// Placeholder for future ad-read features
const adScriptPlaceholder = null;
const selectedAdScript = null;
const adReadEvents: any[] = [];

const RecordingConsole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { micSettings } = location.state || {};

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Multitrack recording architecture
  const [participants] = useState([
    { id: "host", name: "Host" },
    { id: "guest1", name: "Guest 1" }, // Mock guest for now
  ]);

  useEffect(() => {
    // Initialize multitrack session on mount
    initializeRecordingSession(participants).then(({ sessionId }) => {
      setSessionId(sessionId);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecording = async () => {
    if (!sessionId) return;

    await startRecording(sessionId);
    setRecordingState("recording");
    setDuration(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handlePauseRecording = () => {
    setRecordingState("paused");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResumeRecording = () => {
    setRecordingState("recording");
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (!sessionId) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const { tracks, duration: finalDuration } = await stopRecording(sessionId);
    setAudioTracks(tracks);
    setDuration(finalDuration);
    setRecordingState("idle");

    // Navigate to cleanup with recording data
    navigate("/podcast-studio/cleanup", {
      state: {
        tracks,
        duration: finalDuration,
        micSettings,
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#053877]">
              Recording Console
            </h2>
            <p className="text-sm text-muted-foreground">
              Multitrack recording in progress
            </p>
          </div>

          {/* Waveform Animation */}
          <div className="relative h-32 bg-gradient-to-r from-[#053877]/5 via-[#2C6BED]/10 to-[#053877]/5 rounded-lg flex items-center justify-center overflow-hidden">
            {recordingState === "recording" && (
              <div className="flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-[#2C6BED] rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 20}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {recordingState === "idle" && (
              <div className="text-muted-foreground text-sm">
                Press record to start
              </div>
            )}
            {recordingState === "paused" && (
              <div className="text-muted-foreground text-sm">
                Recording paused
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-[#053877]">
              {formatTime(duration)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {participants.length} tracks recording
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {recordingState === "idle" && (
              <Button
                onClick={handleStartRecording}
                disabled={!sessionId}
                className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-14 px-8"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  onClick={handlePauseRecording}
                  variant="outline"
                  className="h-14 px-8"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white h-14 px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  onClick={handleResumeRecording}
                  className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-14 px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
                <Button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white h-14 px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            )}
          </div>

          {/* Placeholder space for future Script Popup and Ad Dropdown */}
          {/* Will be implemented when ad-read marketplace is integrated */}
          <div className="hidden" data-future-feature="script-popup">
            {adScriptPlaceholder}
            {selectedAdScript}
            {adReadEvents}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecordingConsole;
