import { Card, CardContent } from '@/components/ui/card';
import { Phone, CheckCircle2, AlertTriangle, UserPlus, Gauge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCEIBandInfo } from '@/constants/ceiScoring';

interface CEIKPICardsProps {
  totalCalls: number;
  resolvedWithoutHandoffPct: number;
  handoffRequestedPct: number;
  leadCreatedPct: number;
  avgCeiScore: number;
  isLoading?: boolean;
}

export function CEIKPICards({
  totalCalls,
  resolvedWithoutHandoffPct,
  handoffRequestedPct,
  leadCreatedPct,
  avgCeiScore,
  isLoading,
}: CEIKPICardsProps) {
  const ceiBandInfo = getCEIBandInfo(avgCeiScore);

  const cards = [
    {
      label: 'Total Calls',
      value: totalCalls,
      format: 'number',
      icon: Phone,
      tooltip: 'All inbound calls handled by Jess today.',
      color: 'text-blue-500',
    },
    {
      label: 'Resolved Without Dispatch',
      value: resolvedWithoutHandoffPct,
      format: 'percent',
      icon: CheckCircle2,
      tooltip: 'Calls completed without a request to speak to dispatch or a human.',
      color: 'text-green-500',
    },
    {
      label: 'Handoff Requests',
      value: handoffRequestedPct,
      format: 'percent',
      icon: AlertTriangle,
      tooltip: 'Calls where the caller asked for dispatch / a real person.',
      color: 'text-amber-500',
    },
    {
      label: 'Leads Created',
      value: leadCreatedPct,
      format: 'percent',
      icon: UserPlus,
      tooltip: 'Calls where we successfully created a qualified lead for dispatch.',
      color: 'text-purple-500',
    },
    {
      label: 'Avg CEI Score',
      value: avgCeiScore,
      format: 'score',
      icon: Gauge,
      tooltip: '0–100 score. Higher = smoother call experience.',
      color: ceiBandInfo.label === 'Excellent' || ceiBandInfo.label === 'Good' ? 'text-green-500' : 
             ceiBandInfo.label === 'Fair' ? 'text-amber-500' : 'text-red-500',
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <div className="flex items-baseline gap-1">
                      {isLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      ) : (
                        <>
                          <span className="text-2xl font-bold">
                            {card.format === 'number' && card.value}
                            {card.format === 'percent' && `${Math.round(card.value)}%`}
                            {card.format === 'score' && card.value}
                          </span>
                          {card.format === 'score' && (
                            <span 
                              className="text-xs font-medium px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${ceiBandInfo.color}20`,
                                color: ceiBandInfo.color,
                              }}
                            >
                              {ceiBandInfo.label}
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
