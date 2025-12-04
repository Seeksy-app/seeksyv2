import { createContext, useContext, useState, ReactNode } from 'react';

type DataMode = 'demo' | 'real';

interface BoardDataModeContextType {
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  isDemo: boolean;
  isReal: boolean;
}

const BoardDataModeContext = createContext<BoardDataModeContextType | undefined>(undefined);

export function BoardDataModeProvider({ children }: { children: ReactNode }) {
  const [dataMode, setDataMode] = useState<DataMode>('demo');

  return (
    <BoardDataModeContext.Provider
      value={{
        dataMode,
        setDataMode,
        isDemo: dataMode === 'demo',
        isReal: dataMode === 'real',
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
  isDemo: true,
  isReal: false,
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
