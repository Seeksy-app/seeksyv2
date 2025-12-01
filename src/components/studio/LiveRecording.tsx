import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Square, Pause, Play, Scissors, DollarSign,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface LiveRecordingProps {
  recorder: {
    state: string;
    duration: number;
    audioLevel: number;
    pauseRecording: () => void;
    resumeRecording: () => void;
    addClipMarker: () => void;
    addAdMarker: (type: "pre_roll" | "mid_roll" | "post_roll") => void;
  };
  onEndSession: () => void;
  onBack: () => void;
}

export function LiveRecording({ recorder, onEndSession, onBack }: LiveRecordingProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecording = recorder.state === "recording";
  const isPaused = recorder.state === "paused";

  // Simplified identity status
  const identityStatus = { voiceVerified: false, faceVerified: false };

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
        {/* Top Bar */}
        <div className="border-b bg-card/80 backdrop-blur-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Session Name & Status */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Untitled Session</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge 
                    variant={isRecording ? "destructive" : "secondary"}
                    className="gap-1.5"
                  >
                    {isRecording && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    {isRecording ? "Recording" : isPaused ? "Paused" : "Stopped"}
                  </Badge>
                  {/* Identity badges */}
                  <div className="flex items-center gap-2 text-xs">
                    {identityStatus.faceVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">Face</span>
                    {identityStatus.voiceVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">Voice</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="text-4xl font-mono font-bold tabular-nums">
              {formatTime(recorder.duration)}
            </div>

            {/* Right: End Session */}
            <Button 
              variant="ghost" 
              onClick={() => setShowEndConfirm(true)}
            >
              End Session
            </Button>
          </div>
        </div>

        {/* Main Recording Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl space-y-8">
            {/* Waveform / Level Meter */}
            <Card className="aspect-video bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5" />
              <div className="relative w-full px-16">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Host Track</span>
                    <span>Level: {Math.round(recorder.audioLevel * 100)}%</span>
                  </div>
                  <div className="h-24 bg-muted/30 rounded-lg overflow-hidden flex items-center">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100 rounded-r-lg"
                      style={{ width: `${recorder.audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4">
              {isPaused ? (
                <Button
                  size="lg"
                  className="h-16 px-8 gap-2 bg-green-600 hover:bg-green-700"
                  onClick={recorder.resumeRecording}
                >
                  <Play className="w-6 h-6" />
                  Resume
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-8 gap-2"
                  onClick={recorder.pauseRecording}
                >
                  <Pause className="w-6 h-6" />
                  Pause
                </Button>
              )}
              
              <Button
                size="lg"
                variant="destructive"
                className="h-16 px-8 gap-2"
                onClick={() => setShowEndConfirm(true)}
              >
                <Square className="w-6 h-6" />
                Stop & Save
              </Button>
            </div>

            {/* Marker Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 gap-3 hover:border-purple-500 hover:bg-purple-500/10"
                onClick={recorder.addClipMarker}
              >
                <Scissors className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Mark Clip</div>
                  <div className="text-xs text-muted-foreground">Create highlight</div>
                </div>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-20 gap-3 hover:border-green-500 hover:bg-green-500/10"
                  >
                    <DollarSign className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Mark Ad Slot</div>
                      <div className="text-xs text-muted-foreground">Choose placement</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => recorder.addAdMarker("pre_roll")}>
                    Pre-roll (Before content)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => recorder.addAdMarker("mid_roll")}>
                    Mid-roll (During content)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => recorder.addAdMarker("post_roll")}>
                    Post-roll (After content)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* End Session Confirmation */}
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Recording Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the recording and save your session. You'll be able to review and edit it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onEndSession}>
              End & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
