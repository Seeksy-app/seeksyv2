/**
 * StartOnboardingButton Component
 * Button to manually trigger product tours
 */

import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getPageTourKeyFromRoute, getPageTour, PageTourKey } from '@/onboarding/tourConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Import the provider context - fallback to try/catch for backward compat
let useProductTourContext: () => {
  startBasicTour: (pageKey?: PageTourKey) => void;
  isActive: boolean;
};

try {
  useProductTourContext = require('./ProductTourProvider').useProductTourContext;
} catch {
  // Fallback if provider not available yet
  useProductTourContext = () => ({
    startBasicTour: () => {},
    isActive: false,
  });
}

const tourPages: { key: PageTourKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'myDay', label: 'My Day' },
  { key: 'creatorHub', label: 'Creator Hub' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'appsTools', label: 'Apps & Tools' },
];

export function StartOnboardingButton() {
  const location = useLocation();
  
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

  // Don't show if tour is active
  if (isActive) {
    return null;
  }

  // If current page has tips, show simple button + dropdown
  if (hasTipsForCurrentPage) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            id="creatorhub-start-onboarding-button"
            data-onboarding="start-onboarding"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Start Tour</span>
            <ChevronDown className="h-3 w-3 hidden sm:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">Start tour for...</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => startBasicTour(currentPageKey)}
            className="font-medium"
          >
            This page ({getPageTour(currentPageKey)?.pageName})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {tourPages.filter(p => p.key !== currentPageKey).map((page) => (
            <DropdownMenuItem 
              key={page.key}
              onClick={() => startBasicTour(page.key)}
            >
              {page.label}
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
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Tours</span>
          <ChevronDown className="h-3 w-3 hidden sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Start a tour</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tourPages.map((page) => (
          <DropdownMenuItem 
            key={page.key}
            onClick={() => startBasicTour(page.key)}
          >
            {page.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
