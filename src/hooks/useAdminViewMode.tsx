/**
 * Session-only admin view mode switcher
 * Allows admins to quickly switch between viewing as Admin, Creator, Advertiser, or Board
 * Stored in sessionStorage - resets when browser closes
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserRoles } from './useUserRoles';

export type ViewMode = 'admin' | 'creator' | 'advertiser' | 'board';

const STORAGE_KEY = 'seeksy_admin_view_mode';

export function useAdminViewMode() {
  const { isAdmin } = useUserRoles();
  const [viewMode, setViewModeState] = useState<ViewMode>('admin');

  // Load from sessionStorage on mount
  useEffect(() => {
    if (!isAdmin) return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && ['admin', 'creator', 'advertiser', 'board'].includes(stored)) {
      setViewModeState(stored as ViewMode);
    }
  }, [isAdmin]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    sessionStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const getRouteForMode = (mode: ViewMode): string => {
    switch (mode) {
      case 'admin':
        return '/admin';
      case 'creator':
        return '/my-day';
      case 'advertiser':
        return '/advertiser';
      case 'board':
        return '/board';
      default:
        return '/admin';
    }
  };

  return {
    viewMode,
    setViewMode,
    getRouteForMode,
    canSwitch: isAdmin,
  };
}
