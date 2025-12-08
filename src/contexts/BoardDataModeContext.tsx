import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useRealPlatformMetrics } from '@/hooks/useRealPlatformMetrics';

type DataMode = 'cfo' | 'live' | 'demo';

interface BoardDataModeContextType {
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  isCFO: boolean;
  isLive: boolean;
  isDemo: boolean;
  hasCFOAssumptions: boolean;
  hasLiveData: boolean;
  availableModes: DataMode[];
  modeLabel: string;
  modeTooltip: string;
}

const BoardDataModeContext = createContext<BoardDataModeContextType | undefined>(undefined);

export function BoardDataModeProvider({ children }: { children: ReactNode }) {
  const { hasCFOAssumptions } = useCFOAssumptions();
  const { data: realData, isLoading: realLoading } = useRealPlatformMetrics();
  
  // Check if we have live data
  const hasLiveData = !realLoading && realData && (
    realData.totalCreators > 0 || 
    realData.totalPodcasts > 0 || 
    realData.totalEpisodes > 0
  );

  // Determine available modes based on data availability
  const availableModes: DataMode[] = [];
  if (hasCFOAssumptions) availableModes.push('cfo');
  if (hasLiveData) availableModes.push('live');
  if (!hasCFOAssumptions && !hasLiveData) availableModes.push('demo');

  // Default to CFO if available, otherwise live, otherwise demo
  const defaultMode: DataMode = hasCFOAssumptions ? 'cfo' : (hasLiveData ? 'live' : 'demo');
  
  const [dataMode, setDataMode] = useState<DataMode>(defaultMode);

  // Update mode when availability changes
  useEffect(() => {
    if (!availableModes.includes(dataMode)) {
      setDataMode(defaultMode);
    }
  }, [availableModes, dataMode, defaultMode]);

  // Get label and tooltip for current mode
  const getModeInfo = (mode: DataMode): { label: string; tooltip: string } => {
    switch (mode) {
      case 'cfo':
        return {
          label: 'CFO Model',
          tooltip: 'Powered by CFO assumptions. Baseline for all Board forecasts.',
        };
      case 'live':
        return {
          label: 'Live Data',
          tooltip: 'Real-time operational metrics from Seeksy.',
        };
      case 'demo':
        return {
          label: 'Demo',
          tooltip: 'Sample data for demonstration purposes.',
        };
    }
  };

  const { label: modeLabel, tooltip: modeTooltip } = getModeInfo(dataMode);

  return (
    <BoardDataModeContext.Provider
      value={{
        dataMode,
        setDataMode,
        isCFO: dataMode === 'cfo',
        isLive: dataMode === 'live',
        isDemo: dataMode === 'demo',
        hasCFOAssumptions,
        hasLiveData: !!hasLiveData,
        availableModes,
        modeLabel,
        modeTooltip,
      }}
    >
      {children}
    </BoardDataModeContext.Provider>
  );
}

// Safe default values for when hook is used outside provider
const defaultContextValue: BoardDataModeContextType = {
  dataMode: 'demo',
  setDataMode: () => {
    if (import.meta.env.DEV) {
      console.warn('useBoardDataMode: setDataMode called outside provider - no effect');
    }
  },
  isCFO: false,
  isLive: false,
  isDemo: true,
  hasCFOAssumptions: false,
  hasLiveData: false,
  availableModes: ['demo'],
  modeLabel: 'Demo',
  modeTooltip: 'Sample data for demonstration purposes.',
};

export function useBoardDataMode(): BoardDataModeContextType {
  const context = useContext(BoardDataModeContext);
  
  if (!context) {
    // Log warning in development only
    if (import.meta.env.DEV) {
      console.warn('useBoardDataMode: used outside BoardDataModeProvider - falling back to demo mode');
    }
    // Return safe defaults instead of throwing
    return defaultContextValue;
  }
  
  return context;
}
