import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Calendar, Radio, ChevronDown, 
  Circle, Edit2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoStudioHeaderProps {
  sessionTitle: string;
  onBack: () => void;
  isRecording: boolean;
  onRecordToggle: () => void;
  onGoLive: () => void;
  onChannels: () => void;
  onSchedule: () => void;
  onEditTitle: () => void;
}

export function VideoStudioHeader({
  sessionTitle,
  onBack,
  isRecording,
  onRecordToggle,
  onGoLive,
  onChannels,
  onSchedule,
  onEditTitle,
}: VideoStudioHeaderProps) {
  return (
    <header className="h-12 bg-[#1a1d21] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {sessionTitle}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEditTitle}
            className="text-white/40 hover:text-white hover:bg-white/10 h-6 w-6"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Record Toggle */}
        <div className="flex items-center gap-2">
          <Switch 
            checked={isRecording}
            onCheckedChange={onRecordToggle}
            className="data-[state=checked]:bg-red-500"
          />
          <span className="text-sm text-white/70">Record</span>
        </div>

        {/* Channels Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onChannels}
          className="border-white/20 text-white hover:bg-white/10 gap-2"
        >
          <span className="text-lg">+</span>
          Channels
        </Button>

        {/* Schedule Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSchedule}
          className="border-white/20 text-white hover:bg-white/10 gap-2"
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </Button>

        {/* Go Live Button */}
        <div className="flex items-center">
          <Button 
            onClick={onGoLive}
            className={cn(
              "rounded-r-none gap-2 px-4",
              "bg-gradient-to-r from-green-500 to-emerald-600",
              "hover:from-green-400 hover:to-emerald-500",
              "text-white font-semibold"
            )}
          >
            Go Live
          </Button>
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
        </div>
      </div>
    </header>
  );
}
