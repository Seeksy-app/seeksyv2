import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, Edit2, ChevronDown, 
  Circle, Radio, MonitorPlay
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StudioMode = "record" | "live";

interface VideoStudioHeaderProps {
  sessionTitle: string;
  onBack: () => void;
  isRecording: boolean;
  studioMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  onStartSession: () => void;
  onStopSession: () => void;
  onChannels: () => void;
  onSchedule: () => void;
  onEditTitle: () => void;
  recordingTime?: number;
}

export function VideoStudioHeader({
  sessionTitle,
  onBack,
  isRecording,
  studioMode,
  onModeChange,
  onStartSession,
  onStopSession,
  onChannels,
  onSchedule,
  onEditTitle,
  recordingTime = 0,
}: VideoStudioHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-14 bg-[#1a1d21] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
      {/* Left: Exit + Title */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack} 
          className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 font-medium rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Studio
        </Button>
        
        <div className="h-6 w-px bg-white/20" />
        
        <div className="flex items-center gap-2">
          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 mr-2">
              <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-red-500 text-sm font-medium">
                REC {formatTime(recordingTime)}
              </span>
            </div>
          )}
          
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {sessionTitle}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEditTitle}
            className="text-white/40 hover:text-white hover:bg-white/10 h-6 w-6"
            disabled={isRecording}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Right: Restream-style controls */}
      <div className="flex items-center gap-3">
        {/* + Channels Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onChannels}
          className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 rounded-lg"
          disabled={isRecording}
        >
          <span className="text-lg leading-none">+</span>
          Channels
        </Button>

        {/* Schedule Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSchedule}
          className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 rounded-lg"
          disabled={isRecording}
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </Button>

        {/* Go Live Button with Mode Dropdown */}
        <div className="flex items-center">
          {isRecording ? (
            <Button 
              onClick={onStopSession}
              className={cn(
                "gap-2 px-4 rounded-lg",
                "bg-red-600 hover:bg-red-700",
                "text-white font-semibold"
              )}
            >
              <Circle className="w-4 h-4 fill-current" />
              Stop Recording
            </Button>
          ) : (
            <>
              <Button 
                onClick={onStartSession}
                className={cn(
                  "rounded-r-none gap-2 px-4",
                  "bg-gradient-to-r from-green-500 to-emerald-600",
                  "hover:from-green-400 hover:to-emerald-500",
                  "text-white font-semibold"
                )}
              >
                {studioMode === "live" ? (
                  <>
                    <Radio className="w-4 h-4" />
                    Go Live
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 fill-current" />
                    Go Live
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon"
                    className={cn(
                      "rounded-l-none border-l border-white/20 h-9 w-8",
                      "bg-gradient-to-r from-green-500 to-emerald-600",
                      "hover:from-green-400 hover:to-emerald-500"
                    )}
                  >
                    <ChevronDown className="w-4 h-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 bg-[#1a1d21] border-white/10"
                >
                  <DropdownMenuItem 
                    onClick={() => onModeChange("live")}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      studioMode === "live" ? "border-green-500" : "border-white/30"
                    )}>
                      {studioMode === "live" && (
                        <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Live streaming
                      </span>
                      <span className="text-white/50 text-xs">
                        Go live on your channels
                      </span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => onModeChange("record")}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      studioMode === "record" ? "border-green-500" : "border-white/30"
                    )}>
                      {studioMode === "record" && (
                        <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4" />
                        Record only
                      </span>
                      <span className="text-white/50 text-xs">
                        Create without broadcasting
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
