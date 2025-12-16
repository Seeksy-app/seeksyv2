import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Loader2,
  Link2,
  Check,
  Sparkles,
  PhoneOff,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { MeetingStatusBadge } from './MeetingStatusBadge';

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
  isGeneratingNotes: boolean;
  isCapturingAudio: boolean;
  participants: Participant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenShareRef?: React.RefObject<HTMLVideoElement>;
  screenShareTrack?: MediaStreamTrack | null;
  screenShareParticipantId?: string | null;
  hasActiveRoom: boolean;
  guestToken?: string | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartMeeting?: () => void;
  onJoinMeeting?: () => void;
  onStopAIAndGenerateNotes?: () => void;
  onEndCall?: () => void;
  videoUnavailable?: boolean;
  onNotesOnlyMode?: () => void;
}

const BoardMeetingVideo: React.FC<BoardMeetingVideoProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isVideoOff,
  isGeneratingNotes,
  isCapturingAudio,
  participants,
  localVideoRef,
  screenShareRef,
  screenShareTrack,
  screenShareParticipantId,
  hasActiveRoom,
  guestToken,
  onToggleMute,
  onToggleVideo,
  onStartMeeting,
  onJoinMeeting,
  onStopAIAndGenerateNotes,
  onEndCall,
  videoUnavailable = false,
  onNotesOnlyMode,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const totalParticipants = participants.length + 1;
  const isScreenSharing = !!screenShareTrack;

  const copyGuestLink = () => {
    if (!guestToken) return;
    const guestUrl = `${window.location.origin}/board/meeting-guest/${guestToken}`;
    navigator.clipboard.writeText(guestUrl);
    setLinkCopied(true);
    toast.success("Guest link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartMeeting = async () => {
    if (!onStartMeeting || isStartingMeeting) return;
    setIsStartingMeeting(true);
    try {
      await onStartMeeting();
    } finally {
      setIsStartingMeeting(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!onJoinMeeting || isJoiningMeeting) return;
    setIsJoiningMeeting(true);
    try {
      await onJoinMeeting();
    } finally {
      setIsJoiningMeeting(false);
    }
  };

  const handleEndCall = async () => {
    if (!onEndCall || isEndingCall) return;
    setIsEndingCall(true);
    try {
      await onEndCall();
    } finally {
      setIsEndingCall(false);
    }
  };

  // Video unavailable fallback
  if (videoUnavailable) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              Video Temporarily Unavailable
              <Badge variant="outline" className="text-xs">Network Issue</Badge>
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              The video service is currently unreachable. You can still run this meeting in notes-only mode.
            </p>
            {onNotesOnlyMode && (
              <Button variant="outline" size="sm" onClick={onNotesOnlyMode} className="gap-2">
                <FileText className="h-4 w-4" />
                Continue with Notes Only
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          <Button 
            onClick={handleJoinMeeting} 
            className="gap-2"
            disabled={!onJoinMeeting || isJoiningMeeting}
          >
            {isJoiningMeeting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                {onJoinMeeting ? 'Join Meeting' : 'Waiting for host...'}
              </>
            )}
          </Button>
        ) : onStartMeeting ? (
          <Button onClick={handleStartMeeting} className="gap-2" disabled={isStartingMeeting}>
            {isStartingMeeting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Start Video Meeting
              </>
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for host to start...</p>
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

  // Connected - show video grid (or screen share layout)
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      {/* Header with participant count and recording indicator */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </span>
          {/* Live status badges */}
          <MeetingStatusBadge 
            status="active" 
            isCapturingAudio={isCapturingAudio} 
            isGeneratingNotes={isGeneratingNotes} 
          />
          {isScreenSharing && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Video className="h-3 w-3" />
              Screen Sharing
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {guestToken && (
            <Button variant="ghost" size="sm" onClick={copyGuestLink} className="h-7 text-xs gap-1">
              {linkCopied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {linkCopied ? 'Copied!' : 'Copy Guest Link'}
            </Button>
          )}
        </div>
      </div>

      {/* Persistent Attendee Thumbnails Strip - Always visible */}
      <div className="p-3 flex gap-2 overflow-x-auto bg-slate-900/50 border-b border-slate-700/50">
        {/* Local video thumbnail */}
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

        {/* Remote participants thumbnails */}
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`relative flex-shrink-0 w-32 h-24 bg-slate-700 rounded-lg overflow-hidden ${
              participant.id === screenShareParticipantId ? 'ring-2 ring-primary' : ''
            }`}
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
              {participant.id === screenShareParticipantId && ' (sharing)'}
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

      {/* Screen Share Area - Only visible when screen sharing is active */}
      {isScreenSharing && screenShareRef && (
        <div className="p-3 bg-slate-950">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Video className="h-3 w-3" />
              Shared Screen
            </div>
          </div>
        </div>
      )}

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

          {/* Generate Notes Button - only shows when AI is listening */}
          {isCapturingAudio && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-2 gap-2"
              onClick={onStopAIAndGenerateNotes}
              disabled={isGeneratingNotes}
            >
              {isGeneratingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Notes
                </>
              )}
            </Button>
          )}

          {/* End Call Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="ml-2 gap-2"
                onClick={handleEndCall}
                disabled={isEndingCall}
              >
                {isEndingCall ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PhoneOff className="h-4 w-4" />
                )}
                {isEndingCall ? 'Ending...' : 'End Call'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave video call</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default BoardMeetingVideo;
