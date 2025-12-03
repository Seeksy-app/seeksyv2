import { Button } from "@/components/ui/button";
import { 
  Mic, MicOff, Video, VideoOff, Monitor, 
  UserPlus, Plus, Settings, ChevronDown,
  LayoutGrid, Square, PhoneOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface VideoStudioControlsEnhancedProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isRecording: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onInviteGuest: () => void;
  onAddSource: () => void;
  onSettings: () => void;
  onLayoutChange: (layout: string) => void;
  onEndSession: () => void;
}

export function VideoStudioControlsEnhanced({
  isMuted,
  isVideoOff,
  isRecording,
  onToggleMic,
  onToggleVideo,
  onScreenShare,
  onInviteGuest,
  onAddSource,
  onSettings,
  onLayoutChange,
  onEndSession,
}: VideoStudioControlsEnhancedProps) {
  return (
    <div className="h-20 bg-[#0d0f12] border-t border-white/10 flex items-center justify-center px-6 gap-3">
      {/* Mic with Dropdown */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMic}
          className={cn(
            "h-14 w-14 rounded-full rounded-r-none transition-all",
            isMuted 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-8 rounded-full rounded-l-none border-l border-white/20",
                isMuted 
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
            <DropdownMenuItem className="text-white hover:bg-white/10">
              Default Microphone
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-white/10">
              External Microphone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Camera with Dropdown */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVideo}
          className={cn(
            "h-14 w-14 rounded-full rounded-r-none transition-all",
            isVideoOff 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-8 rounded-full rounded-l-none border-l border-white/20",
                isVideoOff 
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
            <DropdownMenuItem className="text-white hover:bg-white/10">
              Default Camera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-white/10">
              External Camera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Screen Share */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onScreenShare}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <Monitor className="w-6 h-6" />
      </Button>

      {/* Invite Guest */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onInviteGuest}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20 ring-2 ring-blue-500/50"
      >
        <UserPlus className="w-6 h-6" />
      </Button>

      {/* Add Source */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border-gray-200 w-56" align="center">
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">🎤</span>
            <div>
              <div className="font-medium">Presentations</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">P</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">☁️</span>
            <div>
              <div className="font-medium">Video storage</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">D</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={onScreenShare}>
            <Monitor className="w-4 h-4 text-gray-600" />
            <div>
              <div className="font-medium">Screen share</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">H</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">🖼️</span>
            <div>
              <div className="font-medium">Image</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">G</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">📹</span>
            <div>
              <div className="font-medium">Extra camera</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">E</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">🎬</span>
            <div>
              <div className="font-medium">Local video</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">O</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">RT</span>
            <div>
              <div className="font-medium">RTMP source</div>
            </div>
            <span className="ml-auto text-xs text-gray-400">R</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">👤</span>
            <div>
              <div className="font-medium">Media placeholder</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
            <span className="text-gray-600">👥</span>
            <div>
              <div className="font-medium">Participant placeholder</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettings}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <Settings className="w-6 h-6" />
      </Button>

      {/* End Session */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onEndSession}
        className="h-14 w-14 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 ml-4"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>
    </div>
  );
}
