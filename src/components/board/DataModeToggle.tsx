import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { cn } from '@/lib/utils';
import { Database, Activity } from 'lucide-react';

export function DataModeToggle() {
  const { dataMode, setDataMode } = useBoardDataMode();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500 font-medium">Data Mode:</span>
      <div className="flex bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setDataMode('demo')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            dataMode === 'demo'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          Demo
        </button>
        <button
          onClick={() => setDataMode('real')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            dataMode === 'real'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Activity className="w-3.5 h-3.5" />
          Real
        </button>
      </div>
    </div>
  );
}

export function DataModeLabel() {
  const { dataMode } = useBoardDataMode();

  return (
    <p className="text-sm text-slate-500">
      {dataMode === 'demo' 
        ? 'Viewing: Demo Data – sample metrics for illustration'
        : 'Viewing: Real Data – based on current Seeksy performance'}
    </p>
  );
}

export function DataModeBadge({ className }: { className?: string }) {
  const { dataMode } = useBoardDataMode();

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
        dataMode === 'demo'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-emerald-100 text-emerald-700',
        className
      )}
    >
      {dataMode === 'demo' ? 'Demo' : 'Live'}
    </span>
  );
}
