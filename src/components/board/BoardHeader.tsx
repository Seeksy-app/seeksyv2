import { DataModeToggle, DataModeLabel } from '@/components/board/DataModeToggle';
import { BoardSearchBar } from '@/components/board/BoardSearchBar';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { AlertCircle, Sparkles } from 'lucide-react';

interface BoardHeaderProps {
  onSearchQuery: (query: string) => void;
}

export function BoardHeader({ onSearchQuery }: BoardHeaderProps) {
  const { isDemo, isCFO, isLive } = useBoardDataMode();

  return (
    <div className="space-y-4">
      {/* Top row with toggle and search */}
      <div className="flex items-center justify-between gap-4">
        <DataModeToggle />
        <BoardSearchBar 
          onSearch={onSearchQuery} 
          className="flex-1 max-w-md"
        />
      </div>

      {/* CFO Model indicator */}
      {isCFO && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">CFO-Controlled Financial Model</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All KPIs and forecasts are derived from CFO assumptions. This is the baseline for all Board forecasts.
            </p>
          </div>
        </div>
      )}

      {/* Demo data fallback message */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Demo Data Mode</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Showing sample data. Once CFO publishes assumptions, this will switch to CFO-controlled mode automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
