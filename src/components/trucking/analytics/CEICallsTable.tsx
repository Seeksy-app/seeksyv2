import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Flag, CheckCircle, AlertTriangle, Phone, Loader2, Play, Clock } from 'lucide-react';
import { TruckingCall } from '@/hooks/trucking/useTruckingCalls';
import { getCEIBandInfo, CALL_OUTCOMES } from '@/constants/ceiScoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface CEICallsTableProps {
  calls: TruckingCall[];
  isLoading?: boolean;
  onSelectCall: (call: TruckingCall) => void;
}

export function CEICallsTable({ calls, isLoading, onSelectCall }: CEICallsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (calls.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Phone className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No calls yet for this date.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Calls</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[70px]">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Dur
                      </TooltipTrigger>
                      <TooltipContent>Call duration in minutes:seconds</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Tooltip>
                      <TooltipTrigger>Outcome</TooltipTrigger>
                      <TooltipContent>
                        confirmed / declined / callback_requested / incomplete / error
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-[70px]">
                    <Tooltip>
                      <TooltipTrigger>CEI</TooltipTrigger>
                      <TooltipContent>
                        0–100. Click for event breakdown and transcript excerpt.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-[100px]">Load</TableHead>
                  <TableHead className="w-[80px]">
                    <Tooltip>
                      <TooltipTrigger>Handoff</TooltipTrigger>
                      <TooltipContent>Yes if caller requested dispatch/human.</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-[70px]">
                    <Tooltip>
                      <TooltipTrigger>Lead</TooltipTrigger>
                      <TooltipContent>Created if create_lead succeeded.</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead>Top Signals</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const ceiBand = getCEIBandInfo(call.cei_score);
                  const outcomeInfo = CALL_OUTCOMES.find(o => o.value === call.call_outcome);
                  
                  return (
                    <TableRow 
                      key={call.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectCall(call)}
                    >
                      <TableCell>
                        {call.audio_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCall(call);
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/50 pl-2">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {format(new Date(call.created_at), 'HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {formatDuration(call.call_duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${outcomeInfo?.color || 'hsl(var(--muted))'}20`,
                            color: outcomeInfo?.color || 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {outcomeInfo?.label || call.call_outcome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span 
                            className="font-semibold text-sm"
                            style={{ color: ceiBand.color }}
                          >
                            {call.cei_score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {call.primary_load_id || '—'}
                      </TableCell>
                      <TableCell>
                        {call.handoff_requested ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {call.lead_created ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {call.cei_reasons?.slice(0, 3).map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                              {reason.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {(call.cei_reasons?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{call.cei_reasons!.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {call.flagged_for_coaching && (
                            <Flag className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {call.reviewed_at && (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCall(call);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
