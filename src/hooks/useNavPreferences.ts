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
}

const DEFAULT_NAV_CONFIG: NavConfig = {
  order: [
    'creator_hub',
    'my_day',
    'dashboard',
    'meetings',
    'social_analytics',
    'studio',
    'settings',
    'media',
    'monetization',
    'seekies',
    'email',
    'media_streaming',
    'marketing'
  ],
  hidden: [],
  pinned: ['my_day', 'dashboard', 'creator_hub'],
  subItems: {}
};

const DEFAULT_LANDING_ROUTE = '/my-day';

export const NAV_ITEMS: NavItem[] = [
  { id: 'creator_hub', label: 'Creator Hub', path: '/creator-hub', isHome: true },
  { id: 'my_day', label: 'My Day', path: '/my-day', isHome: true },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', isHome: true },
  { 
    id: 'meetings', 
    label: 'Meetings', 
    path: '/meetings',
    subItems: [
      { id: 'meetings_upcoming', label: 'Upcoming Meetings', path: '/meetings' },
      { id: 'meetings_types', label: 'Meeting Types', path: '/meetings/types' },
      { id: 'meetings_history', label: 'Past Meetings', path: '/meetings/history' },
    ]
  },
  { id: 'social_analytics', label: 'Social Analytics', path: '/social-analytics' },
  { 
    id: 'studio', 
    label: 'Studio', 
    path: '/studio',
    subItems: [
      { id: 'video_studio', label: 'Video Studio', path: '/studio/video' },
      { id: 'audio_studio', label: 'Audio Studio', path: '/studio/audio' },
      { id: 'clips_editing', label: 'Clips & Editing', path: '/studio/clips' },
      { id: 'media_library_studio', label: 'Media Library', path: '/studio/media' },
      { id: 'studio_templates', label: 'Templates', path: '/studio/templates' },
    ]
  },
  { id: 'settings', label: 'Settings', path: '/settings' },
  { 
    id: 'media', 
    label: 'Media & Content', 
    path: '/media',
    subItems: [
      { id: 'media_library', label: 'Media Library', path: '/media' },
      { id: 'media_transcripts', label: 'Transcripts', path: '/transcripts' },
      { id: 'media_blogs', label: 'Blog Posts', path: '/blog' },
    ]
  },
  { 
    id: 'monetization', 
    label: 'Monetization', 
    path: '/monetization',
    subItems: [
      { id: 'brand_campaigns', label: 'Brand Campaigns', path: '/creator-campaigns' },
      { id: 'revenue_tracking', label: 'Revenue Tracking', path: '/monetization' },
    ]
  },
  { id: 'seekies', label: 'Seeksies & Apps', path: '/apps' },
  { 
    id: 'email', 
    label: 'Email', 
    path: '/email/inbox',
    subItems: [
      { id: 'email_inbox', label: 'Inbox', path: '/email/inbox' },
      { id: 'email_scheduled', label: 'Scheduled', path: '/email/scheduled' },
      { id: 'email_drafts', label: 'Drafts', path: '/email/drafts' },
      { id: 'email_sent', label: 'Sent', path: '/email/sent' },
    ]
  },
  { 
    id: 'media_streaming', 
    label: 'Media', 
    path: '/mypage',
    subItems: [
      { id: 'mypage_streaming', label: 'My Page Streaming', path: '/mypage' },
    ]
  },
  { 
    id: 'marketing', 
    label: 'Marketing', 
    path: '/contacts',
    subItems: [
      { id: 'marketing_audience', label: 'Contacts & Audience', path: '/contacts' },
      { id: 'marketing_segments', label: 'Segments', path: '/marketing/segments' },
      { id: 'marketing_campaigns', label: 'Campaigns', path: '/marketing/campaigns' },
      { id: 'marketing_templates', label: 'Templates', path: '/marketing/templates' },
      { id: 'marketing_automations', label: 'Automations', path: '/marketing/automations' },
    ]
  },
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
