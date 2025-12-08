import { ReactNode, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BoardSidebar } from './BoardSidebar';
import { BoardTopNav } from './BoardTopNav';
import { BoardFooter } from './BoardFooter';
import { BoardAIChat } from './BoardAIChat';
import { BoardOnboardingTour } from './BoardOnboardingTour';
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
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          {/* Dark sidebar - fixed width */}
          <BoardSidebar />
          
          {/* Light content area - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <main className="flex-1 bg-slate-50 overflow-auto">
              <div className="p-6 lg:p-8 pb-20 w-full max-w-full">
                {children}
              </div>
              <BoardFooter />
            </main>
          </div>
        </div>
        
        {/* Board AI Chat Widget */}
        <BoardAIChat />
        
        {/* Onboarding Tour */}
        <BoardOnboardingTour />
      </SidebarProvider>
    </BoardDataModeProvider>
  );
}