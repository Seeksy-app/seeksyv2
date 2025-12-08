import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Force light theme for board portal main content
  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return (
    <BoardDataModeProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Dark sidebar - fixed width */}
          <BoardSidebar />
          
          {/* Light content area - fills all remaining space */}
          <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50">
            <main className="flex-1 overflow-y-auto w-full">
              <div 
                key={location.pathname} 
                className="w-full px-6 lg:px-8 py-6 pb-20 page-container"
              >
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