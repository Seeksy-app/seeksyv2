import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'seeksy-admin-sidebar-v1';

interface SidebarState {
  openGroups: Record<string, boolean>;
}

// Map of route prefixes to their parent group names
const ROUTE_TO_GROUP: Record<string, string> = {
  '/admin/users': 'User Management',
  '/admin/identity': 'User Management',
  '/admin/permissions': 'User Management',
  '/admin/advertising': 'Advertising & Revenue',
  '/admin/rate-desk': 'Advertising & Revenue',
  '/admin/ad-campaigns': 'Advertising & Revenue',
  '/admin/ad-analytics': 'Advertising & Revenue',
  '/admin/revenue': 'Advertising & Revenue',
  '/admin/financial-models': 'Advertising & Revenue',
  '/admin/cfo-models': 'Advertising & Revenue',
  '/admin/support': 'Business Operations',
  '/admin/leads': 'Business Operations',
  '/admin/billing': 'Business Operations',
  '/admin/payments': 'Business Operations',
  '/admin/investor': 'Business Operations',
  '/admin/marketing-gtm': 'Business Operations',
  '/admin/business-tools': 'Business Tools',
  '/admin/gtm': 'Business Tools',
  '/admin/proposal': 'Business Tools',
  '/admin/rd-intelligence': 'R&D & Intelligence',
  '/admin/cfo-assumptions': 'R&D & Intelligence',
  '/admin/market-intelligence': 'R&D & Intelligence',
  '/admin/api-keys': 'Developer Tools',
  '/admin/webhooks': 'Developer Tools',
  '/admin/logs': 'Developer Tools',
  '/admin/help': 'Support',
  '/admin/contact': 'Support',
};

const DEFAULT_STATE: SidebarState = {
  openGroups: {
    "Email": true,
    "Marketing": true,
    "Media": true,
    "User Management": false,
    "Advertising & Revenue": false,
    "Business Operations": false,
    "Business Tools": false,
    "R&D & Intelligence": false,
    "Content Management": false,
    "Developer Tools": false,
    "Support": false,
  }
};

function getGroupForPath(pathname: string): string | null {
  // Find the most specific matching route prefix
  const matchingPrefixes = Object.keys(ROUTE_TO_GROUP)
    .filter(prefix => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length);
  
  return matchingPrefixes.length > 0 ? ROUTE_TO_GROUP[matchingPrefixes[0]] : null;
}

function loadState(): SidebarState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        openGroups: { ...DEFAULT_STATE.openGroups, ...parsed.openGroups }
      };
    }
  } catch (e) {
    console.warn('Failed to load sidebar state:', e);
  }
  return DEFAULT_STATE;
}

function saveState(state: SidebarState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save sidebar state:', e);
  }
}

export function useSidebarState() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = loadState();
    // Ensure the group containing the active route is open
    const activeGroup = getGroupForPath(location.pathname);
    if (activeGroup) {
      return { ...saved.openGroups, [activeGroup]: true };
    }
    return saved.openGroups;
  });

  // When route changes, ensure the active group is expanded
  useEffect(() => {
    const activeGroup = getGroupForPath(location.pathname);
    if (activeGroup && !openGroups[activeGroup]) {
      setOpenGroups(prev => ({ ...prev, [activeGroup]: true }));
    }
  }, [location.pathname]);

  // Persist state changes
  useEffect(() => {
    saveState({ openGroups });
  }, [openGroups]);

  const toggleGroup = useCallback((groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  const isGroupOpen = useCallback((groupName: string): boolean => {
    return openGroups[groupName] ?? true;
  }, [openGroups]);

  return {
    openGroups,
    toggleGroup,
    isGroupOpen,
  };
}
