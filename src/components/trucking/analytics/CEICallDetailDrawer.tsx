import { useState, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, Flag, AlertTriangle, Phone, Clock, Package, Play, Pause, TrendingDown, TrendingUp, Minus, Calculator } from 'lucide-react';
import { TruckingCall, TruckingCallEvent, useTruckingCallEvents, useMarkCallReviewed, useFlagCallForCoaching, useUpdateCallNotes } from '@/hooks/trucking/useTruckingCalls';
import { getCEIBandInfo, CALL_OUTCOMES, EVENT_TYPES, CEI_BASE_SCORE, CEI_PENALTIES, CEI_BONUSES, CEI_DURATION_PENALTIES, getEventDelta } from '@/constants/ceiScoring';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// CEI Rule descriptions for tooltips
const CEI_RULE_DESCRIPTIONS: Record<string, string> = {
  // Duration
  quick_hangup_under_30s: 'Call lasted less than 30 seconds',
  short_call_30_to_90s: 'Call lasted 30-90 seconds',
  early_handoff_request_under_60s: 'Caller requested handoff within first 60 seconds',
  // Handoff
  dispatch_requested: 'Caller asked for dispatch',
  human_requested: 'Caller asked for a human/agent',
  repeat_human_request: 'Caller asked for human multiple times',
  // Frustration
  impatience_phrase_detected: 'Detected impatience phrases',
  confusion_correction_detected: 'Caller corrected the AI',
  hard_frustration_detected: 'Detected frustration keywords',
  // Failures
  load_lookup_failed: 'Failed to find requested load',
  lead_create_failed: 'Failed to create lead record',
  // Bonuses
  caller_thanked: 'Caller expressed thanks',
  booking_interest_confirmed: 'Caller confirmed interest in booking',
  call_resolved_without_handoff: 'Call completed without requesting human',
  alternate_load_provided: 'Offered alternative load option',
  ai_verified_phone: 'AI successfully verified phone number',
  ai_repeated_info_correctly: 'AI repeated info back correctly',
  lead_created: 'Successfully created lead record',
  load_confirmed: 'Load was confirmed/booked',
};

interface CEIBreakdownItem {
  rule: string;
  label: string;
  description: string;
  delta: number;
  category: 'duration' | 'handoff' | 'frustration' | 'failure' | 'bonus';
  trigger?: string;
}

function buildCEIBreakdown(call: TruckingCall, events: TruckingCallEvent[]): CEIBreakdownItem[] {
  const breakdown: CEIBreakdownItem[] = [];
  
  // Duration bucket
  const duration = call.call_duration_seconds || 0;
  if (duration > 0 && duration < 30) {
    breakdown.push({
      rule: 'quick_hangup_under_30s',
      label: 'Quick Hangup',
      description: CEI_RULE_DESCRIPTIONS.quick_hangup_under_30s,
      delta: CEI_DURATION_PENALTIES.quick_hangup_under_30s,
      category: 'duration',
      trigger: `${Math.round(duration)}s call`,
    });
  } else if (duration >= 30 && duration < 90) {
    breakdown.push({
      rule: 'short_call_30_to_90s',
      label: 'Short Call',
      description: CEI_RULE_DESCRIPTIONS.short_call_30_to_90s,
      delta: CEI_DURATION_PENALTIES.short_call_30_to_90s,
      category: 'duration',
      trigger: `${Math.round(duration)}s call`,
    });
  }
  
  // Early handoff timing
  const handoffTime = call.time_to_handoff_seconds;
  if (handoffTime && handoffTime < 60) {
    breakdown.push({
      rule: 'early_handoff_request_under_60s',
      label: 'Early Handoff Request',
      description: CEI_RULE_DESCRIPTIONS.early_handoff_request_under_60s,
      delta: CEI_DURATION_PENALTIES.early_handoff_request_under_60s,
      category: 'handoff',
      trigger: `${Math.round(handoffTime)}s into call`,
    });
  }
  
  // Process events for penalties and bonuses
  const seenRules = new Set<string>();
  for (const event of events) {
    const eventType = event.event_type;
    if (seenRules.has(eventType)) continue;
    
    if (CEI_PENALTIES[eventType] !== undefined) {
      const delta = CEI_PENALTIES[eventType];
      // Skip duration penalties already handled above
      if (['quick_hangup_under_30s', 'short_call_30_to_90s', 'early_handoff_request_under_60s'].includes(eventType)) {
        continue;
      }
      
      let category: CEIBreakdownItem['category'] = 'failure';
      if (['dispatch_requested', 'human_requested', 'repeat_human_request'].includes(eventType)) {
        category = 'handoff';
      } else if (['impatience_phrase_detected', 'confusion_correction_detected', 'hard_frustration_detected'].includes(eventType)) {
        category = 'frustration';
      }
      
      breakdown.push({
        rule: eventType,
        label: EVENT_TYPES[eventType as keyof typeof EVENT_TYPES]?.label || eventType,
        description: CEI_RULE_DESCRIPTIONS[eventType] || eventType,
        delta,
        category,
        trigger: event.phrase || undefined,
      });
      seenRules.add(eventType);
    }
    
    if (CEI_BONUSES[eventType] !== undefined) {
      breakdown.push({
        rule: eventType,
        label: EVENT_TYPES[eventType as keyof typeof EVENT_TYPES]?.label || eventType,
        description: CEI_RULE_DESCRIPTIONS[eventType] || eventType,
        delta: CEI_BONUSES[eventType],
        category: 'bonus',
      });
      seenRules.add(eventType);
    }
  }
  
  // Check lead_created and load_confirmed from call record
  if (call.lead_created && !seenRules.has('lead_created')) {
    breakdown.push({
      rule: 'lead_created',
      label: 'Lead Created',
      description: CEI_RULE_DESCRIPTIONS.lead_created,
      delta: CEI_BONUSES.lead_created,
      category: 'bonus',
    });
  }
  
  // Check for no handoff bonus
  if (!call.handoff_requested && !seenRules.has('call_resolved_without_handoff') && duration > 30) {
    breakdown.push({
      rule: 'call_resolved_without_handoff',
      label: 'AI-Resolved',
      description: CEI_RULE_DESCRIPTIONS.call_resolved_without_handoff,
      delta: CEI_BONUSES.call_resolved_without_handoff,
      category: 'bonus',
    });
  }
  
  return breakdown;
}

interface CEICallDetailDrawerProps {
  call: TruckingCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CEICallDetailDrawer({ call, open, onOpenChange }: CEICallDetailDrawerProps) {
  const { data: events, isLoading: eventsLoading } = useTruckingCallEvents(call?.id || null);
  const markReviewed = useMarkCallReviewed();
  const flagForCoaching = useFlagCallForCoaching();
  const updateNotes = useUpdateCallNotes();
  const { toast } = useToast();
  const [notes, setNotes] = useState(call?.internal_notes || '');
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get user ID
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Build CEI breakdown
  const ceiBreakdown = useMemo(() => {
    if (!call) return [];
    return buildCEIBreakdown(call, events || []);
  }, [call, events]);

  const calculatedScore = useMemo(() => {
    let score = CEI_BASE_SCORE;
    for (const item of ceiBreakdown) {
      score += item.delta;
    }
    return Math.max(0, Math.min(100, score));
  }, [ceiBreakdown]);

  if (!call) return null;

  const ceiBand = getCEIBandInfo(call.cei_score);
  const outcomeInfo = CALL_OUTCOMES.find(o => o.value === call.call_outcome);

  const handleMarkReviewed = async () => {
    if (!userId) return;
    try {
      await markReviewed.mutateAsync({ callId: call.id, userId });
      toast({ title: 'Call marked as reviewed' });
    } catch (error) {
      toast({ title: 'Failed to mark as reviewed', variant: 'destructive' });
    }
  };

  const handleFlagForCoaching = async () => {
    try {
      await flagForCoaching.mutateAsync({ 
        callId: call.id, 
        flagged: !call.flagged_for_coaching 
      });
      toast({ 
        title: call.flagged_for_coaching ? 'Flag removed' : 'Flagged for coaching' 
      });
    } catch (error) {
      toast({ title: 'Failed to update flag', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateNotes.mutateAsync({ callId: call.id, notes });
      toast({ title: 'Notes saved' });
    } catch (error) {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-6 pt-4">
            {/* Summary Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(call.created_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm font-medium">
                    {formatDuration(call.call_duration_seconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${outcomeInfo?.color || 'hsl(var(--muted))'}20`,
                      color: outcomeInfo?.color || 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {outcomeInfo?.label || call.call_outcome}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">CEI Score:</span>
                  <span 
                    className="font-bold"
                    style={{ color: ceiBand.color }}
                  >
                    {call.cei_score}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: ceiBand.color, color: ceiBand.color }}
                  >
                    {ceiBand.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {call.primary_load_id || 'No load'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5">
                  {call.handoff_requested ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm">
                    {call.handoff_requested ? 'Handoff requested' : 'No handoff'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {call.lead_created ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {call.lead_created ? 'Lead created' : 'No lead'}
                  </span>
                </div>
              </div>
              {call.handoff_reason && (
                <div className="text-sm text-muted-foreground">
                  Handoff reason: <span className="text-foreground">{call.handoff_reason}</span>
                </div>
              )}
              {call.lead_create_error && (
                <div className="text-sm text-red-500">
                  Lead error: {call.lead_create_error}
                </div>
              )}
            </div>

            {/* CEI Reason Breakdown Section */}
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                CEI Score Breakdown
              </h3>
              
              {/* Base Score */}
              <div className="p-3 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base Score</span>
                  <span className="text-sm font-mono font-medium">{CEI_BASE_SCORE}</span>
                </div>
                
                {/* Applied Rules */}
                {ceiBreakdown.length > 0 ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    {ceiBreakdown.map((item, idx) => (
                      <div 
                        key={`${item.rule}-${idx}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.delta < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{item.label}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 ${
                                item.category === 'duration' ? 'border-blue-500/50 text-blue-500' :
                                item.category === 'handoff' ? 'border-amber-500/50 text-amber-500' :
                                item.category === 'frustration' ? 'border-red-500/50 text-red-500' :
                                item.category === 'failure' ? 'border-red-500/50 text-red-500' :
                                'border-green-500/50 text-green-500'
                              }`}
                            >
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                            {item.description}
                            {item.trigger && (
                              <span className="italic"> — "{item.trigger}"</span>
                            )}
                          </p>
                        </div>
                        <span className={`text-sm font-mono font-medium flex-shrink-0 ${
                          item.delta < 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {item.delta > 0 ? '+' : ''}{item.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Minus className="h-3.5 w-3.5" />
                      No adjustments applied
                    </p>
                  </div>
                )}
                
                {/* Final Score */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold">Final Score</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-lg font-bold font-mono"
                      style={{ color: ceiBand.color }}
                    >
                      {call.cei_score}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: ceiBand.color, color: ceiBand.color }}
                    >
                      {ceiBand.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {call.audio_url && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Call Recording
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <audio
                        ref={audioRef}
                        src={call.audio_url}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        className="w-full"
                        controls
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Signals Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Signals
              </h3>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => {
                    const eventInfo = EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES];
                    const delta = getEventDelta(event.event_type);
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              event.severity === 'error' ? 'border-red-500 text-red-500' :
                              event.severity === 'warn' ? 'border-amber-500 text-amber-500' :
                              'border-muted-foreground text-muted-foreground'
                            }`}
                          >
                            {eventInfo?.label || event.event_type}
                          </Badge>
                          {event.phrase && (
                            <span className="text-xs text-muted-foreground italic">
                              "{event.phrase}"
                            </span>
                          )}
                        </div>
                        {delta !== 0 && (
                          <span className={`text-xs font-mono ${
                            delta > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events recorded.</p>
              )}
            </div>

            <Separator />

            {/* Transcript Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Transcript Excerpt
              </h3>
              {call.transcript_text ? (
                <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {call.transcript_text.slice(0, 1000)}
                  {call.transcript_text.length > 1000 && '...'}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No transcript available.</p>
              )}
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Internal Notes
              </h3>
              <Textarea
                placeholder="Add internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={updateNotes.isPending}
              >
                {updateNotes.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Notes
              </Button>
            </div>

            <Separator />

            {/* Actions Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkReviewed}
                  disabled={!!call.reviewed_at || markReviewed.isPending}
                >
                  {markReviewed.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {call.reviewed_at ? 'Reviewed' : 'Mark Reviewed'}
                </Button>
                <Button
                  variant={call.flagged_for_coaching ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleFlagForCoaching}
                  disabled={flagForCoaching.isPending}
                >
                  {flagForCoaching.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  {call.flagged_for_coaching ? 'Flagged' : 'Flag for Coaching'}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
