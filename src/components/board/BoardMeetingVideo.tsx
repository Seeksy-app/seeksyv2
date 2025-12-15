import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Circle,
  Users,
  Loader2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Participant {
  id: string;
  name: string;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isLocal?: boolean;
}

interface BoardMeetingVideoProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isRecording: boolean;
  participants: Participant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeaveCall: () => void;
  onStartMeeting: () => void;
}

const BoardMeetingVideo: React.FC<BoardMeetingVideoProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isVideoOff,
  isRecording,
  participants,
  localVideoRef,
  onToggleMute,
  onToggleVideo,
  onStartRecording,
  onStopRecording,
  onLeaveCall,
  onStartMeeting,
}) => {
  const totalParticipants = participants.length + 1;

  // Not connected - show start button
  if (!isConnected && !isConnecting) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Video className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Video Meeting</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Start a video call with board members for this meeting
        </p>
        <Button onClick={onStartMeeting} className="gap-2">
          <Video className="h-4 w-4" />
          Start Video Meeting
        </Button>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Connecting to video meeting...</p>
      </div>
    );
  }

  // Connected - show video grid
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      {/* Header with participant count and recording indicator */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </span>
        </div>
        {isRecording && (
          <Badge variant="destructive" className="animate-pulse">
            <Circle className="h-2 w-2 fill-current mr-1" />
            Recording
          </Badge>
        )}
      </div>

      {/* Video thumbnails - horizontal layout */}
      <div className="p-3 flex gap-2 overflow-x-auto bg-slate-900/50">
        {/* Local video */}
        <div className="relative flex-shrink-0 w-32 h-24 bg-slate-700 rounded-lg overflow-hidden">
          {!isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                <VideoOff className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
            You
          </div>
          {isMuted && (
            <div className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Remote participants */}
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="relative flex-shrink-0 w-32 h-24 bg-slate-700 rounded-lg overflow-hidden"
          >
            {!participant.isVideoOff ? (
              <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                  <VideoOff className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white truncate max-w-[90%]">
              {participant.name}
            </div>
            {participant.isMuted && (
              <div className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Empty slot indicator */}
        {participants.length === 0 && (
          <div className="flex-shrink-0 w-32 h-24 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
            <span className="text-xs text-slate-500">Waiting...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <TooltipProvider>
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size="sm"
                className="rounded-full w-10 h-10"
                onClick={onToggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoOff ? 'destructive' : 'secondary'}
                size="sm"
                className="rounded-full w-10 h-10"
                onClick={onToggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isVideoOff ? 'Start Video' : 'Stop Video'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'default' : 'secondary'}
                size="sm"
                className={`rounded-full w-10 h-10 ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={isRecording ? onStopRecording : onStartRecording}
              >
                <Circle className={`h-4 w-4 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? 'Stop Recording' : 'Start Recording'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full w-10 h-10 ml-2"
                onClick={onLeaveCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave Meeting</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default BoardMeetingVideo;
