import { ReactNode, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BoardSidebar } from './BoardSidebar';
import { BoardTopNav } from './BoardTopNav';
import { BoardFooter } from './BoardFooter';
import { BoardAIChat } from './BoardAIChat';
import { BoardDataModeProvider } from '@/contexts/BoardDataModeContext';
import { useTheme } from 'next-themes';

interface BoardLayoutProps {
  children: ReactNode;
}

export function BoardLayout({ children }: BoardLayoutProps) {
  const { setTheme, theme } = useTheme();

  // Force light theme for board portal main content
  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return (
    <BoardDataModeProvider>
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          {/* Dark sidebar */}
          <BoardSidebar />
          
          {/* Light content area - no left margin or gap */}
          <div className="flex-1 flex flex-col overflow-auto min-w-0 bg-white">
            <BoardTopNav />
            <main className="flex-1 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 pb-16">
                {children}
              </div>
            </main>
            <BoardFooter />
          </div>
        </div>
        
        {/* Board AI Chat Widget */}
        <BoardAIChat />
      </SidebarProvider>
    </BoardDataModeProvider>
  );
}