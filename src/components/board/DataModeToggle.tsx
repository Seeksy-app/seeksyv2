import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { cn } from '@/lib/utils';
import { Activity, Sparkles, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function DataModeToggle() {
  const { dataMode, setDataMode, availableModes, modeTooltip } = useBoardDataMode();

  const modeConfig = {
    cfo: { icon: Sparkles, label: 'CFO Model' },
    live: { icon: Activity, label: 'Live Data' },
  };

  // Only show toggle if there are multiple available modes
  if (availableModes.length <= 1) {
    const mode = availableModes[0] || 'cfo';
    const { icon: Icon, label } = modeConfig[mode];
    
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium hidden sm:inline">Data Mode:</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-foreground">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{modeTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground font-medium hidden sm:inline">Data Mode:</span>
      <div className="flex bg-muted rounded-lg p-1">
        {availableModes.map((mode) => {
          const { icon: Icon, label } = modeConfig[mode];
          const isActive = dataMode === mode;
          
          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDataMode(mode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {mode === 'cfo' && 'All metrics powered by CFO assumptions. Baseline for all Board forecasts.'}
                  {mode === 'live' && 'Real-time operational metrics from Seeksy platform.'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export function DataModeLabel() {
  const { isCFO, isLive } = useBoardDataMode();

  return (
    <p className="text-sm text-muted-foreground">
      {isCFO && 'Viewing: CFO-Controlled Financial Model'}
      {isLive && 'Viewing: Real-time platform metrics'}
    </p>
  );
}

export function DataModeBadge({ className }: { className?: string }) {
  const { dataMode } = useBoardDataMode();

  const badgeStyles = {
    cfo: 'bg-primary/10 text-primary',
    live: 'bg-emerald-100 text-emerald-700',
  };

  const labels = {
    cfo: 'CFO Model',
    live: 'Live',
  };

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
        badgeStyles[dataMode],
        className
      )}
    >
      {labels[dataMode]}
    </span>
  );
}