import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';

export interface SubItemConfig {
  id: string;
  visible: boolean;
  pinned: boolean;
  order: number;
}

export interface NavConfig {
  order: string[];
  hidden: string[];
  pinned: string[];
  subItems?: Record<string, SubItemConfig[]>;
}

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  isHome?: boolean;
  subItems?: NavSubItem[];
  /** Module ID required for this nav item to be visible (for module activation) */
  moduleId?: string;
  /** Navigation level: 0 = top-level (left-justified), 1 = sub-item (indented) */
  level: 0 | 1;
}

const DEFAULT_NAV_CONFIG: NavConfig = {
  order: [
    'my_day',
    'dashboard',
    'creator_hub',
    'settings',
    'my_workspaces',
    'media_content',
    'seekies',
    'email',
    'marketing',
    'meetings',
    'awards',
  ],
  hidden: [],
  pinned: ['my_day', 'dashboard', 'creator_hub'],
  subItems: {}
};

const DEFAULT_LANDING_ROUTE = '/my-day';

/**
 * Creator navigation items - clean, consistent structure
 * Top-level items in order:
 * 1. My Workspaces
 * 2. Creator Hub
 * 3. My Day
 * 4. Dashboard
 * 5. Media & Content (with Studio Hub, AI Post-Production, AI Clip Generation, Media Library, Blog Posts, Podcasts)
 * 6. Seekies & Apps
 * 7. Email
 * 8. Marketing
 * 9. Settings
 * 10. Awards
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'my_day', label: 'My Day', path: '/my-day', isHome: true, level: 0 },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', isHome: true, level: 0 },
  { id: 'creator_hub', label: 'Creator Hub', path: '/creator-hub', isHome: true, level: 0 },
  { id: 'settings', label: 'Settings', path: '/settings', level: 0 },
  { id: 'my_workspaces', label: 'My Workspaces', path: '/apps?category=my-workspaces', level: 0 },
  { 
    id: 'media_content', 
    label: 'Media & Content', 
    path: '/studio',
    level: 0,
    moduleId: 'studio',
    subItems: [
      { id: 'studio_hub', label: 'Studio Hub', path: '/studio' },
      { id: 'ai_post_production', label: 'AI Post-Production', path: '/studio/ai-post-production' },
      { id: 'ai_clip_generation', label: 'AI Clips Studio', path: '/clips-studio' },
      { id: 'content_library', label: 'Content Library', path: '/studio/media' },
      { id: 'podcasts', label: 'Podcasts', path: '/podcasts' },
    ]
  },
  { id: 'seekies', label: 'Seekies & Apps', path: '/apps', level: 0 },
  { 
    id: 'email', 
    label: 'Email', 
    path: '/email/inbox',
    level: 0,
    moduleId: 'email',
    subItems: [
      { id: 'email_inbox', label: 'Inbox', path: '/email/inbox' },
      { id: 'email_scheduled', label: 'Scheduled', path: '/email/scheduled' },
      { id: 'email_drafts', label: 'Drafts', path: '/email/drafts' },
      { id: 'email_sent', label: 'Sent', path: '/email/sent' },
    ]
  },
  { 
    id: 'marketing', 
    label: 'Marketing', 
    path: '/contacts',
    level: 0,
    moduleId: 'marketing',
    subItems: [
      { id: 'marketing_blog', label: 'Blog', path: '/marketing/blog' },
      { id: 'marketing_newsletters', label: 'Newsletters', path: '/marketing/newsletters' },
      { id: 'marketing_audience', label: 'Contacts & Audience', path: '/contacts' },
      { id: 'marketing_segments', label: 'Segments', path: '/marketing/segments' },
      { id: 'marketing_campaigns', label: 'Campaigns', path: '/marketing/campaigns' },
      { id: 'marketing_templates', label: 'Templates', path: '/marketing/templates' },
      { id: 'marketing_automations', label: 'Automations', path: '/marketing/automations' },
    ]
  },
  { id: 'meetings', label: 'Meetings', path: '/meetings', level: 0, moduleId: 'meetings' },
  { id: 'awards', label: 'Awards', path: '/awards', level: 0, moduleId: 'awards' },
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
      pinned: obj.pinned as string[],
      subItems: (obj.subItems as Record<string, SubItemConfig[]>) || {}
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

  // Listen for nav preference updates from other components
  useEffect(() => {
    const handleNavUpdate = (event: CustomEvent<{ config: NavConfig; landingRoute: string }>) => {
      if (event.detail) {
        setNavConfig(event.detail.config);
        setDefaultLandingRoute(event.detail.landingRoute);
      }
    };
    window.addEventListener('navPreferencesUpdated', handleNavUpdate as EventListener);
    return () => window.removeEventListener('navPreferencesUpdated', handleNavUpdate as EventListener);
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
      
      // Dispatch event to notify sidebar to refresh immediately
      window.dispatchEvent(new CustomEvent('navPreferencesUpdated', { 
        detail: { config, landingRoute } 
      }));
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
