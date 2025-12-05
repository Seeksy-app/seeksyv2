import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, User, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DataModeToggle } from './DataModeToggle';
import { InvestorShareModal } from './InvestorShareModal';
import { GenerateLinkModal } from './investor/GenerateLinkModal';

export function BoardTopNav() {
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-semibold text-slate-900">Seeksy</span>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-500 font-medium">Board Portal</span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <DataModeToggle />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="text-slate-600 hidden md:flex"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share with Investor
            </Button>
            
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Settings className="w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Board Member</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/board')}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/board/investor-links')}>
                  Shared Investor Links
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/board/docs')}>
                  Documents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <GenerateLinkModal open={shareModalOpen} onOpenChange={setShareModalOpen} />
    </TooltipProvider>
  );
}
