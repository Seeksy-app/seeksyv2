import { DataModeToggle } from '@/components/board/DataModeToggle';
import { BoardSearchBar } from '@/components/board/BoardSearchBar';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { AlertCircle } from 'lucide-react';

interface BoardHeaderProps {
  onSearchQuery: (query: string) => void;
}

export function BoardHeader({ onSearchQuery }: BoardHeaderProps) {
  const { isReal } = useBoardDataMode();

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

      {/* Real data placeholder message */}
      {isReal && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Real data not yet connected</p>
            <p className="text-xs text-amber-600 mt-0.5">
              This dashboard is currently showing placeholder values. Connect your data sources in settings to see actual platform metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
