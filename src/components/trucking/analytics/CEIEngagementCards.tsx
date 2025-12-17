import { Card, CardContent } from '@/components/ui/card';
import { Clock, PhoneCall, PhoneOff, UserRound } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CEIEngagementCardsProps {
  avgDurationSeconds: number;
  engagedCallsCount: number;
  quickHangupsCount: number;
  avgTimeToHandoffSeconds: number | null;
  totalCalls: number;
  isLoading?: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function CEIEngagementCards({
  avgDurationSeconds,
  engagedCallsCount,
  quickHangupsCount,
  avgTimeToHandoffSeconds,
  totalCalls,
  isLoading,
}: CEIEngagementCardsProps) {
  const engagedPct = totalCalls > 0 ? Math.round((engagedCallsCount / totalCalls) * 100) : 0;
  const quickHangupPct = totalCalls > 0 ? Math.round((quickHangupsCount / totalCalls) * 100) : 0;

  const cards = [
    {
      label: 'Avg Call Duration',
      value: formatDuration(avgDurationSeconds),
      subValue: null,
      icon: Clock,
      tooltip: 'Mean call length across all calls today.',
      color: 'text-cyan-500',
    },
    {
      label: 'Engaged Calls',
      value: engagedCallsCount,
      subValue: `${engagedPct}%`,
      icon: PhoneCall,
      tooltip: 'Calls longer than 90 seconds — indicates meaningful conversation.',
      color: 'text-emerald-500',
    },
    {
      label: 'Quick Hangups',
      value: quickHangupsCount,
      subValue: `${quickHangupPct}%`,
      icon: PhoneOff,
      tooltip: 'Calls under 30 seconds — may indicate friction or caller abandonment.',
      color: 'text-rose-500',
    },
    {
      label: 'Avg Time to Agent Request',
      value: avgTimeToHandoffSeconds !== null ? formatDuration(avgTimeToHandoffSeconds) : '—',
      subValue: null,
      icon: UserRound,
      tooltip: 'Average seconds until caller asks for dispatch or human agent.',
      color: 'text-orange-500',
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Tooltip key={card.label}>
              <TooltipTrigger asChild>
                <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-border transition-colors cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${card.color}`} />
                      <span className="text-xs text-muted-foreground truncate">{card.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      ) : (
                        <>
                          <span className="text-2xl font-bold">{card.value}</span>
                          {card.subValue && (
                            <span className="text-sm text-muted-foreground">
                              ({card.subValue})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="max-w-xs text-sm">{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
