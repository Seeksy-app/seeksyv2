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

export function useBoardDataMode() {
  const context = useContext(BoardDataModeContext);
  if (!context) {
    throw new Error('useBoardDataMode must be used within BoardDataModeProvider');
  }
  return context;
}
