import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Phone, Clock, FileText, Search, AlertCircle, CheckCircle2, DollarSign, Bot
} from 'lucide-react';
import { getOutcomeLabel, getOutcomeTooltip } from '@/constants/truckingOutcomes';

interface CallLog {
  id: string;
  carrier_phone: string | null;
  call_started_at: string | null;
  duration_seconds: number | null;
  outcome: string | null;
  call_outcome: string | null;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  routed_to_voicemail: boolean | null;
  voicemail_transcript: string | null;
  is_demo: boolean | null;
  // ElevenLabs tracking fields
  elevenlabs_conversation_id?: string | null;
  elevenlabs_agent_id?: string | null;
  call_cost_credits?: number | null;
  call_cost_usd?: number | null;
  llm_cost_usd_total?: number | null;
  ended_reason?: string | null;
  call_status?: string | null;
  estimated_cost_usd?: number | null;
  trucking_loads?: { load_number: string } | null;
  trucking_call_transcripts?: {
    transcript_text: string | null;
    sentiment: string | null;
    key_topics: string[] | null;
    negotiation_outcome: string | null;
    rate_discussed: number | null;
  }[] | null;
}

interface CallDetailDrawerProps {
  call: CallLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPlaybackTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CallDetailDrawer({ call, open, onOpenChange }: CallDetailDrawerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);

  // Reset state when call changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSearchQuery('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [call?.id]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  if (!call) return null;

  const outcome = call.routed_to_voicemail ? 'voicemail' : (call.outcome || call.call_outcome || 'unknown');
  const transcriptText = call.trucking_call_transcripts?.[0]?.transcript_text || call.transcript || call.voicemail_transcript;
  const hasRecording = !!call.recording_url;

  // Filter transcript by search
  const highlightedTranscript = searchQuery && transcriptText
    ? transcriptText.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() 
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
          : part
      )
    : transcriptText;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* ElevenLabs Verification Badge */}
            {call.elevenlabs_conversation_id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs">
                      <Bot className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">
                          Agent: Jess {call.elevenlabs_agent_id?.slice(-8) === 'f1n9k4vw' ? '✓' : '⚠'}
                        </span>
                        <span className="text-muted-foreground font-mono truncate max-w-[280px]">
                          {call.elevenlabs_conversation_id}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Conversation ID: {call.elevenlabs_conversation_id}</p>
                    <p>Agent ID: {call.elevenlabs_agent_id || 'Unknown'}</p>
                    {call.ended_reason && <p>Ended: {call.ended_reason}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Call Metadata */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{call.carrier_phone || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {call.call_started_at 
                      ? format(new Date(call.call_started_at), 'MMM d, h:mm a')
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formatDuration(call.duration_seconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Load:</span>
                  <span className="font-mono">{call.trucking_loads?.load_number || '—'}</span>
                </div>
              </div>

              {/* Cost Info */}
              {(call.call_cost_usd || call.estimated_cost_usd) && (
                <div className="flex items-center gap-4 text-sm pt-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">
                      ${(call.call_cost_usd || call.estimated_cost_usd || 0).toFixed(3)}
                    </span>
                  </div>
                  {call.call_cost_credits && (
                    <span className="text-xs text-muted-foreground">
                      ({call.call_cost_credits} credits)
                    </span>
                  )}
                  {call.llm_cost_usd_total && (
                    <span className="text-xs text-muted-foreground">
                      LLM: ${call.llm_cost_usd_total.toFixed(3)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={
                    outcome === 'confirmed' || outcome === 'booked' ? 'bg-green-500/10 text-green-600' :
                    outcome === 'declined' ? 'bg-red-500/10 text-red-600' :
                    outcome === 'voicemail' ? 'bg-purple-500/10 text-purple-600' :
                    outcome === 'callback_requested' ? 'bg-orange-500/10 text-orange-600' :
                    'bg-gray-500/10 text-gray-600'
                  }
                  title={getOutcomeTooltip(outcome)}
                >
                  {getOutcomeLabel(outcome)}
                </Badge>
                {call.is_demo && (
                  <Badge variant="outline" className="text-xs">DEMO</Badge>
                )}
                {call.call_status && call.call_status !== 'completed' && (
                  <Badge variant="outline" className="text-xs capitalize">{call.call_status}</Badge>
                )}
              </div>
            </div>

            {/* Audio Player */}
            {hasRecording && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Recording
                  </h3>
                  <audio
                    ref={audioRef}
                    src={call.recording_url!}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatPlaybackTime(currentTime)}</span>
                      <span>{formatPlaybackTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => skip(-10)}
                      title="Skip back 10s"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => skip(10)}
                      title="Skip forward 10s"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-xs"
                      onClick={changePlaybackRate}
                      title="Change playback speed"
                    >
                      {playbackRate}x
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>
                </div>
              </>
            )}

            {!hasRecording && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <AlertCircle className="h-4 w-4" />
                  No recording available for this call
                </div>
              </>
            )}

            {/* Transcript */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcript
                </h3>
                {transcriptText && (
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 w-32 pl-7 text-xs"
                    />
                  </div>
                )}
              </div>
              
              {transcriptText ? (
                <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                  {highlightedTranscript}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <AlertCircle className="h-4 w-4" />
                  No transcript available for this call
                </div>
              )}
            </div>

            {/* Analysis */}
            {call.trucking_call_transcripts?.[0] && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Analysis
                  </h3>
                  <div className="space-y-2 text-sm">
                    {call.trucking_call_transcripts[0].sentiment && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sentiment:</span>
                        <Badge variant="outline" className="capitalize">
                          {call.trucking_call_transcripts[0].sentiment}
                        </Badge>
                      </div>
                    )}
                    {call.trucking_call_transcripts[0].negotiation_outcome && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Negotiation:</span>
                        <span className="capitalize">
                          {call.trucking_call_transcripts[0].negotiation_outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {call.trucking_call_transcripts[0].rate_discussed && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Rate discussed:</span>
                        <span>${call.trucking_call_transcripts[0].rate_discussed}</span>
                      </div>
                    )}
                    {call.trucking_call_transcripts[0].key_topics && call.trucking_call_transcripts[0].key_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {call.trucking_call_transcripts[0].key_topics.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Summary */}
            {call.summary && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Summary
                  </h3>
                  <p className="text-sm text-muted-foreground">{call.summary}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
