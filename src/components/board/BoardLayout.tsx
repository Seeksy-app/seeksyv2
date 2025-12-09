import { ReactNode, useEffect, Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BoardSidebar } from './BoardSidebar';
import { BoardFooter } from './BoardFooter';
import { BoardAIChat } from './BoardAIChat';
import { BoardOnboardingTour } from './BoardOnboardingTour';
import { BoardDataModeProvider } from '@/contexts/BoardDataModeContext';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { GlossaryButton } from './GlossaryModal';

interface BoardLayoutProps {
  children: ReactNode;
}

// Loading skeleton for board content
function BoardContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
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
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Dark sidebar - fixed width, always visible */}
          <BoardSidebar />
          
          {/* Light content area - fills all remaining space */}
          <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50">
            {/* Top bar with Glossary */}
            <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200 px-6 py-2 flex justify-end">
              <GlossaryButton />
            </div>
            <main className="flex-1 overflow-y-auto w-full">
              {/* Content container with smooth CSS transitions */}
              <div className="w-full px-6 lg:px-8 py-6 pb-20 page-container transition-opacity duration-300 ease-out">
                <Suspense fallback={<BoardContentSkeleton />}>
                  {children}
                </Suspense>
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
