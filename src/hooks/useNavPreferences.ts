import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';

export interface NavConfig {
  order: string[];
  hidden: string[];
  pinned: string[];
}

const DEFAULT_NAV_CONFIG: NavConfig = {
  order: [
    'my_day',
    'dashboard',
    'creator_hub',
    'meetings',
    'studio',
    'podcasts',
    'brand_campaigns',
    'revenue_tracking',
    'content_library',
    'social_analytics',
    'settings'
  ],
  hidden: [],
  pinned: ['my_day', 'dashboard', 'creator_hub']
};

const DEFAULT_LANDING_ROUTE = '/my-day';

export const NAV_ITEMS = [
  { id: 'my_day', label: 'My Day', path: '/my-day', isHome: true },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', isHome: true },
  { id: 'creator_hub', label: 'Creator Hub', path: '/creator-hub', isHome: true },
  { id: 'meetings', label: 'Meetings', path: '/meetings' },
  { id: 'studio', label: 'Studio', path: '/studio' },
  { id: 'podcasts', label: 'Podcasts', path: '/podcasts' },
  { id: 'brand_campaigns', label: 'Brand Campaigns', path: '/creator-campaigns' },
  { id: 'revenue_tracking', label: 'Revenue Tracking', path: '/monetization' },
  { id: 'content_library', label: 'Content Library', path: '/media' },
  { id: 'social_analytics', label: 'Social Analytics', path: '/social-analytics' },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

export const LANDING_OPTIONS = [
  { id: '/my-day', label: 'My Day', description: 'Your daily schedule and action items' },
  { id: '/dashboard', label: 'Dashboard', description: 'Key metrics and performance snapshot' },
  { id: '/creator-hub', label: 'Creator Hub', description: 'Tools and monetization opportunities' },
];

function parseNavConfig(value: unknown): NavConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.order) && Array.isArray(obj.hidden) && Array.isArray(obj.pinned)) {
    return {
      order: obj.order as string[],
      hidden: obj.hidden as string[],
      pinned: obj.pinned as string[]
    };
  }
  return null;
}

export function useNavPreferences() {
  const [navConfig, setNavConfig] = useState<NavConfig>(DEFAULT_NAV_CONFIG);
  const [defaultLandingRoute, setDefaultLandingRoute] = useState<string>(DEFAULT_LANDING_ROUTE);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('nav_config, default_landing_route')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading nav preferences:', error);
      }

      if (data) {
        const parsed = parseNavConfig(data.nav_config);
        if (parsed) {
          setNavConfig(parsed);
        }
        if (data.default_landing_route) {
          setDefaultLandingRoute(data.default_landing_route);
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = useCallback(async (config: NavConfig, landingRoute: string) => {
    if (!userId) return;

    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update({
            nav_config: config as unknown as Json,
            default_landing_route: landingRoute,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            nav_config: config as unknown as Json,
            default_landing_route: landingRoute,
          });
        if (error) throw error;
      }

      setNavConfig(config);
      setDefaultLandingRoute(landingRoute);
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    } catch (err) {
      console.error('Error saving preferences:', err);
      throw err;
    }
  }, [userId, queryClient]);

  const resetToDefaults = useCallback(async () => {
    await savePreferences(DEFAULT_NAV_CONFIG, DEFAULT_LANDING_ROUTE);
  }, [savePreferences]);

  return {
    navConfig,
    defaultLandingRoute,
    isLoading,
    savePreferences,
    resetToDefaults,
    NAV_ITEMS,
    LANDING_OPTIONS
  };
}
