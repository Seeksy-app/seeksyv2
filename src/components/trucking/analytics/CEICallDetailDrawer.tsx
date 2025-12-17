import { useState } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, Flag, AlertTriangle, Phone, Clock, Package } from 'lucide-react';
import { TruckingCall, TruckingCallEvent, useTruckingCallEvents, useMarkCallReviewed, useFlagCallForCoaching, useUpdateCallNotes } from '@/hooks/trucking/useTruckingCalls';
import { getCEIBandInfo, CALL_OUTCOMES, EVENT_TYPES, getEventDelta } from '@/constants/ceiScoring';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Get user ID
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

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
