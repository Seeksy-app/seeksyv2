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
}

const DEFAULT_NAV_CONFIG: NavConfig = {
  order: [
    'my_day',
    'dashboard',
    'creator_hub',
    'meetings',
    'studio',
    'social_analytics',
    'media_content',
    'monetization',
    'seekies',
    'email',
    'media_distribution',
    'marketing',
    'settings'
  ],
  hidden: [],
  pinned: ['my_day', 'dashboard', 'creator_hub'],
  subItems: {}
};

const DEFAULT_LANDING_ROUTE = '/my-day';

/**
 * Creator navigation items - clean, consistent structure
 * Top-level items in order:
 * 1. My Day
 * 2. Dashboard
 * 3. Creator Hub (with dynamic sub-items based on activated modules)
 * 4. Meetings
 * 5. Studio (production tools)
 * 6. Social Analytics
 * 7. Media & Content (content organization)
 * 8. Monetization
 * 9. Seekies & Apps
 * 10. Email
 * 11. Media (distribution channels)
 * 12. Marketing
 * 13. Settings
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'my_day', label: 'My Day', path: '/my-day', isHome: true },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', isHome: true },
  { 
    id: 'creator_hub', 
    label: 'Creator Hub', 
    path: '/creator-hub', 
    isHome: true,
    subItems: [
      { id: 'creator_social_analytics', label: 'Social Analytics', path: '/social-analytics' },
      { id: 'creator_monetization', label: 'Monetization', path: '/monetization' },
      { id: 'creator_awards', label: 'Awards', path: '/awards' },
      { id: 'creator_brand_campaigns', label: 'Brand Campaigns', path: '/creator-campaigns' },
      { id: 'creator_revenue', label: 'Revenue Tracking', path: '/monetization' },
      { id: 'creator_my_page', label: 'My Page', path: '/profile/edit' },
    ]
  },
  { 
    id: 'meetings', 
    label: 'Meetings', 
    path: '/creator/meetings',
    moduleId: 'meetings',
    subItems: [
      { id: 'meetings_dashboard', label: 'Dashboard', path: '/creator/meetings' },
      { id: 'meetings_types', label: 'Meeting Types', path: '/creator/meetings/types' },
      { id: 'meetings_booking_links', label: 'Booking Links', path: '/creator/meetings/booking-links' },
      { id: 'meetings_scheduled', label: 'Scheduled Meetings', path: '/creator/meetings/scheduled' },
      { id: 'meetings_availability', label: 'Availability', path: '/creator/meetings/availability' },
      { id: 'meetings_settings', label: 'Settings', path: '/creator/meetings/settings' },
    ]
  },
  { 
    id: 'studio', 
    label: 'Studio', 
    path: '/studio',
    moduleId: 'studio',
    subItems: [
      { id: 'video_studio', label: 'Video Studio', path: '/studio/video' },
      { id: 'audio_studio', label: 'Audio Studio', path: '/studio/audio' },
      { id: 'clips_editing', label: 'Clips & Editing', path: '/studio/clips' },
      { id: 'media_library_studio', label: 'Media Library', path: '/studio/media' },
      { id: 'studio_templates', label: 'Templates', path: '/studio/templates' },
    ]
  },
  { 
    id: 'social_analytics', 
    label: 'Social Analytics', 
    path: '/social-analytics',
    moduleId: 'social-analytics'
  },
  { 
    id: 'media_content', 
    label: 'Media & Content', 
    path: '/media',
    subItems: [
      { id: 'content_library', label: 'Content Library', path: '/media' },
      { id: 'content_transcripts', label: 'Transcripts', path: '/transcripts' },
      { id: 'content_blogs', label: 'Blog Posts', path: '/blog' },
    ]
  },
  { 
    id: 'monetization', 
    label: 'Monetization', 
    path: '/monetization',
    moduleId: 'revenue-tracking',
    subItems: [
      { id: 'monetization_hub', label: 'Monetization Hub', path: '/monetization' },
      { id: 'monetization_brand_campaigns', label: 'Brand Campaigns', path: '/creator-campaigns' },
      { id: 'monetization_revenue', label: 'Revenue Tracking', path: '/monetization' },
    ]
  },
  { id: 'seekies', label: 'Seekies & Apps', path: '/apps' },
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
    id: 'media_distribution', 
    label: 'Media', 
    path: '/studio',
    subItems: [
      { id: 'media_studio_hub', label: 'Studio Hub', path: '/studio' },
      { id: 'media_podcasts', label: 'Podcasts', path: '/podcasts' },
      { id: 'media_streaming_channel', label: 'My Streaming Channel', path: '/mypage' },
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
