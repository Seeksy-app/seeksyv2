import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { BoardSidebar } from './BoardSidebar';

interface BoardLayoutProps {
  children: ReactNode;
}

export function BoardLayout({ children }: BoardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-900">
        <BoardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-border/30 p-4 md:hidden">
            <SidebarTrigger />
          </div>
          <div className="p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
