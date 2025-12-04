/**
 * StartOnboardingButton Component
 * Compact pill button to start product tours
 * Navigates to page and triggers tour
 */

import { Button } from '@/components/ui/button';
import { Sparkles, HelpCircle, ChevronDown, Play } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPageTourKeyFromRoute, getPageTour, PageTourKey } from '@/onboarding/tourConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useProductTourContext } from './ProductTourProvider';

// Page routes for navigation
const PAGE_ROUTES: Record<PageTourKey, string> = {
  dashboard: '/dashboard',
  myDay: '/my-day',
  creatorHub: '/creator-hub',
  meetings: '/meetings',
  appsTools: '/apps-and-tools',
};

const tourPages: { key: PageTourKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'myDay', label: 'My Day' },
  { key: 'creatorHub', label: 'Creator Hub' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'appsTools', label: 'Apps & Tools' },
];

interface StartOnboardingButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function StartOnboardingButton({ className, variant = 'default' }: StartOnboardingButtonProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  let startBasicTour: (pageKey?: PageTourKey) => void = () => {};
  let isActive = false;
  
  try {
    const context = useProductTourContext();
    startBasicTour = context.startBasicTour;
    isActive = context.isActive;
  } catch {
    // Context not available
  }
  
  const currentPageKey = getPageTourKeyFromRoute(location.pathname);
  const hasTipsForCurrentPage = currentPageKey && getPageTour(currentPageKey);

  // Handle tour selection - navigate if needed, then start tour
  const handleStartTour = (pageKey: PageTourKey) => {
    const targetRoute = PAGE_ROUTES[pageKey];
    const isOnTargetPage = location.pathname === targetRoute || 
      location.pathname.startsWith(targetRoute);
    
    if (isOnTargetPage) {
      // Already on the page, start tour immediately
      startBasicTour(pageKey);
    } else {
      // Navigate to the page, then start tour after a short delay
      navigate(targetRoute);
      // Use timeout to allow page to render before starting tour
      setTimeout(() => {
        startBasicTour(pageKey);
      }, 500);
    }
  };

  // Don't show if tour is active
  if (isActive) {
    return null;
  }

  // Compact pill variant
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full border border-border/50 hover:border-border hover:bg-muted/50"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tour</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Start a guided tour
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {currentPageKey && hasTipsForCurrentPage && (
            <>
              <DropdownMenuItem 
                onClick={() => handleStartTour(currentPageKey)} 
                className="gap-2 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>This page</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {tourPages.map((page) => (
            <DropdownMenuItem
              key={page.key}
              onClick={() => handleStartTour(page.key)}
              className="gap-2 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{page.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant - pill style
  if (hasTipsForCurrentPage) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-2 text-xs font-medium rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
            id="creatorhub-start-onboarding-button"
            data-onboarding="start-onboarding"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Start Onboarding
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-popover">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Choose a page to explore
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleStartTour(currentPageKey)}
            className="gap-2 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Tour this page</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {tourPages.filter(p => p.key !== currentPageKey).map((page) => (
            <DropdownMenuItem 
              key={page.key}
              onClick={() => handleStartTour(page.key)}
              className="gap-2 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{page.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Fallback: show dropdown with all available tours
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2 text-xs font-medium rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Start Onboarding
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Choose a page to explore
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tourPages.map((page) => (
          <DropdownMenuItem 
            key={page.key}
            onClick={() => handleStartTour(page.key)}
            className="gap-2 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{page.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
