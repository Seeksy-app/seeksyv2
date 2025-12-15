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
  Link2,
  Check,
  Radio,
  Sparkles,
  Square,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

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
  isCapturingAudio: boolean;
  isGeneratingNotes: boolean;
  participants: Participant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  hasActiveRoom: boolean;
  guestToken?: string | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeaveCall: () => void;
  onStartMeeting: () => void;
  onJoinMeeting: () => void;
  onStartAudioCapture: () => void;
  onStopAudioCapture: () => void;
  onEndMeetingAndGenerateNotes: () => void;
}

const BoardMeetingVideo: React.FC<BoardMeetingVideoProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isVideoOff,
  isRecording,
  isCapturingAudio,
  isGeneratingNotes,
  participants,
  localVideoRef,
  hasActiveRoom,
  guestToken,
  onToggleMute,
  onToggleVideo,
  onStartRecording,
  onStopRecording,
  onLeaveCall,
  onStartMeeting,
  onJoinMeeting,
  onStartAudioCapture,
  onStopAudioCapture,
  onEndMeetingAndGenerateNotes,
}) => {
  const [linkCopied, setLinkCopied] = React.useState(false);
  const totalParticipants = participants.length + 1;

  const copyGuestLink = () => {
    if (!guestToken) return;
    const guestUrl = `${window.location.origin}/board/meeting-guest/${guestToken}`;
    navigator.clipboard.writeText(guestUrl);
    setLinkCopied(true);
    toast.success("Guest link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Not connected - show start or join button
  if (!isConnected && !isConnecting) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Video className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Video Meeting</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {hasActiveRoom 
            ? 'A meeting is in progress. Join the video call with board members.'
            : 'Start a video call with board members for this meeting'
          }
        </p>
        {hasActiveRoom ? (
          <Button onClick={onJoinMeeting} className="gap-2">
            <Users className="h-4 w-4" />
            Join Meeting
          </Button>
        ) : (
          <Button onClick={onStartMeeting} className="gap-2">
            <Video className="h-4 w-4" />
            Start Video Meeting
          </Button>
        )}
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

  // Generating notes state
  if (isGeneratingNotes) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Sparkles className="h-12 w-12 text-primary animate-pulse mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Generating AI Notes</p>
        <p className="text-sm text-muted-foreground text-center">
          Transcribing audio and generating meeting notes...
        </p>
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
        <div className="flex items-center gap-2">
          {guestToken && (
            <Button variant="ghost" size="sm" onClick={copyGuestLink} className="h-7 text-xs gap-1">
              {linkCopied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {linkCopied ? 'Copied!' : 'Copy Guest Link'}
            </Button>
          )}
          {isCapturingAudio && (
            <Badge variant="default" className="bg-green-600 animate-pulse">
              <Radio className="h-2 w-2 fill-current mr-1" />
              AI Listening
            </Badge>
          )}
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="h-2 w-2 fill-current mr-1" />
              Recording
            </Badge>
          )}
        </div>
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
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-center gap-2 flex-wrap">
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

          {/* AI Audio Capture Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCapturingAudio ? 'default' : 'secondary'}
                size="sm"
                className={`rounded-full w-10 h-10 ${isCapturingAudio ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={isCapturingAudio ? onStopAudioCapture : onStartAudioCapture}
              >
                <Radio className={`h-4 w-4 ${isCapturingAudio ? 'animate-pulse' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCapturingAudio ? 'Stop AI Listening' : 'Start AI Listening'}
            </TooltipContent>
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

          {/* Simple Leave */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full w-10 h-10"
                onClick={onLeaveCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave Call</TooltipContent>
          </Tooltip>

          {/* End Meeting & Generate Notes */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="ml-2 gap-2 bg-primary hover:bg-primary/90"
                onClick={onEndMeetingAndGenerateNotes}
              >
                <Sparkles className="h-4 w-4" />
                End & Generate Notes
              </Button>
            </TooltipTrigger>
            <TooltipContent>End meeting and generate AI notes</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default BoardMeetingVideo;
