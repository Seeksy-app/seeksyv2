/**
 * My Day OS - Navigation Configuration
 * 
 * User-centered navigation aligned with daily workflows
 * instead of technical modules.
 */

export type UserRole = 'creator' | 'subscriber' | 'advertiser' | 'influencer' | 'agency' | 'admin' | 'super_admin' | 'board_member';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  description?: string;
}

export interface NavigationGroup {
  group: string;
  description?: string;
  collapsible?: boolean;
  items: NavigationItem[];
}

export const NAVIGATION_CONFIG: {
  roles: UserRole[];
  navigation: NavigationGroup[];
} = {
  "roles": [
    "creator",
    "subscriber",
    "advertiser",
    "influencer",
    "agency",
    "admin",
    "super_admin",
    "board_member"
  ],
  "navigation": [
    {
      "group": "Seeksy OS",
      "description": "Core system navigation",
      "items": [
        {
          "id": "my_day",
          "label": "My Day",
          "icon": "sparkles",
          "path": "/my-day",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"]
        },
        {
          "id": "dashboard",
          "label": "Dashboard",
          "icon": "layout-dashboard",
          "path": "/dashboard",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"]
        },
        {
          "id": "creator_hub",
          "label": "Creator Hub",
          "icon": "sparkles",
          "path": "/creator-hub",
          "roles": ["creator", "influencer"]
        },
        {
          "id": "agency_hub",
          "label": "Agency Hub",
          "icon": "briefcase",
          "path": "/agency",
          "roles": ["agency", "admin"]
        },
        {
          "id": "seekies",
          "label": "Seekies & Tools",
          "icon": "grid-3x3",
          "path": "/seekies",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/settings",
          "roles": ["creator", "subscriber", "influencer", "agency", "advertiser", "admin"]
        }
      ]
    },

    {
      "group": "Email",
      "description": "Email management",
      "collapsible": true,
      "items": [
        {
          "id": "email_inbox",
          "label": "Inbox",
          "icon": "inbox",
          "path": "/email/inbox",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_scheduled",
          "label": "Scheduled",
          "icon": "calendar",
          "path": "/email/scheduled",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_drafts",
          "label": "Drafts",
          "icon": "file-text",
          "path": "/email/drafts",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_sent",
          "label": "Sent",
          "icon": "send",
          "path": "/email/sent",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Media",
      "description": "Content creation and media tools",
      "collapsible": true,
      "items": [
        {
          "id": "studio_hub",
          "label": "Studio Hub",
          "icon": "layout-dashboard",
          "path": "/studio",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "audio_studio",
          "label": "Audio Studio",
          "icon": "mic",
          "path": "/studio/audio",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "video_studio",
          "label": "Video Studio",
          "icon": "video",
          "path": "/studio/video",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "studio_clips",
          "label": "Clips & Highlights",
          "icon": "scissors",
          "path": "/studio/ai-clips",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "media_library",
          "label": "Media Library",
          "icon": "folder-open",
          "path": "/studio/media",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "studio_templates",
          "label": "Templates",
          "icon": "file-text",
          "path": "/studio/templates",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "media_podcasts",
          "label": "Podcasts",
          "icon": "podcast",
          "path": "/podcasts",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "mypage_streaming",
          "label": "My Page Streaming",
          "icon": "radio",
          "path": "/mypage",
          "roles": ["creator", "influencer"]
        }
      ]
    },

    {
      "group": "Marketing",
      "description": "Marketing and monetization tools",
      "collapsible": true,
      "items": [
        {
          "id": "marketing_audience",
          "label": "Contacts & Audience",
          "icon": "users",
          "path": "/contacts",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "social_analytics",
          "label": "Social Analytics",
          "icon": "instagram",
          "path": "/social-analytics",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "marketing_segments",
          "label": "Segments",
          "icon": "users",
          "path": "/marketing/segments",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "marketing_campaigns",
          "label": "Campaigns",
          "icon": "megaphone",
          "path": "/marketing/campaigns",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "marketing_templates",
          "label": "Templates",
          "icon": "file-text",
          "path": "/marketing/templates",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "marketing_automations",
          "label": "Automations",
          "icon": "zap",
          "path": "/marketing/automations",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "marketing_monetization",
          "label": "Monetization Hub",
          "icon": "dollar-sign",
          "path": "/monetization",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"]
        }
      ]
    },

    {
      "group": "Identity & Certification",
      "description": "Voice, identity verification, and media tools",
      "collapsible": true,
      "items": [
        {
          "id": "admin_identity",
          "label": "Identity & Rights",
          "icon": "fingerprint",
          "path": "/admin/identity",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_background_remover",
          "label": "Background Remover",
          "icon": "scissors",
          "path": "/background-remover",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Users & Access",
      "description": "User and team management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_creators",
          "label": "User Management",
          "icon": "users",
          "path": "/admin/creators",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_board_members",
          "label": "Board Members",
          "icon": "briefcase",
          "path": "/admin/board-members",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_impersonate",
          "label": "Impersonate User",
          "icon": "user-cog",
          "path": "/admin/impersonate",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_credits",
          "label": "Credit Management",
          "icon": "coins",
          "path": "/admin/credits",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Advertising & Sales",
      "description": "Advertising, campaigns, and sales management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_advertising",
          "label": "Advertising Management",
          "icon": "megaphone",
          "path": "/admin/advertising",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_rate_desk",
          "label": "Rate Desk",
          "icon": "dollar-sign",
          "path": "/admin/advertising/rate-desk",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_ad_campaigns",
          "label": "Ad Campaigns",
          "icon": "radio",
          "path": "/admin/ad-campaigns",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_ad_analytics",
          "label": "Ad Analytics",
          "icon": "trending-up",
          "path": "/admin/ad-analytics",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_sponsorships",
          "label": "Sponsorships & Proposals",
          "icon": "handshake",
          "path": "/admin/sponsorships",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_sales_desk",
          "label": "Sales Desk",
          "icon": "headphones",
          "path": "/admin/sales-desk",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Finance & Insights",
      "description": "Financial reports and intelligence",
      "collapsible": true,
      "items": [
        {
          "id": "admin_revenue_reports",
          "label": "Revenue Reports",
          "icon": "file-bar-chart",
          "path": "/admin/revenue-reports",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_financial_models",
          "label": "Financial Models",
          "icon": "calculator",
          "path": "/admin/financial-models/combined",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_cfo_assumptions",
          "label": "CFO Assumptions",
          "icon": "sliders",
          "path": "/cfo-dashboard#assumptions",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_rd_feeds",
          "label": "R&D Intelligence Feeds",
          "icon": "rss",
          "path": "/admin/rd-feeds",
          "roles": ["admin", "super_admin"],
          "description": "Internal research feeds for AI insights and CFO forecasts"
        }
      ]
    },

    {
      "group": "Business Tools",
      "description": "Strategic planning and business intelligence",
      "collapsible": true,
      "items": [
        {
          "id": "business_tools_landing",
          "label": "Business Tools",
          "icon": "briefcase",
          "path": "/business-tools",
          "roles": ["admin", "super_admin", "creator", "agency"]
        },
        {
          "id": "gtm_engine_admin",
          "label": "GTM Engine (Admin)",
          "icon": "target",
          "path": "/business-tools/gtm",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "GTM & Strategy",
      "description": "Go-to-market planning and strategy",
      "collapsible": true,
      "items": [
        {
          "id": "creator_gtm_builder",
          "label": "Creator GTM Builder",
          "icon": "rocket",
          "path": "/business-tools/gtm/new",
          "roles": ["admin", "super_admin", "creator", "agency"]
        },
        {
          "id": "internal_gtm",
          "label": "Internal GTM (CFO/CEO)",
          "icon": "building",
          "path": "/board/gtm",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Content Management",
      "description": "Website and content administration",
      "collapsible": true,
      "items": [
        {
          "id": "admin_logo_manager",
          "label": "Logo Manager",
          "icon": "image",
          "path": "/admin/logo-manager",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_hero_manager",
          "label": "Hero Manager",
          "icon": "layout",
          "path": "/admin/hero-manager",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_hero_generator",
          "label": "Hero Generator",
          "icon": "wand-2",
          "path": "/admin/hero-generator",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_mascot_generator",
          "label": "Mascot Generator",
          "icon": "sparkles",
          "path": "/admin/mascot-generator",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_brand_settings",
          "label": "Brand Settings",
          "icon": "palette",
          "path": "/admin/brand-settings",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_master_blog",
          "label": "Master Blog",
          "icon": "book-open",
          "path": "/admin/master-blog",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_landing_pages",
          "label": "Landing Pages",
          "icon": "file-text",
          "path": "/admin/landing-pages",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_email_templates",
          "label": "Email Templates",
          "icon": "mail",
          "path": "/admin/email-templates",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_legal",
          "label": "Legal Pages",
          "icon": "scale",
          "path": "/admin/legal",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_screenshot_generator",
          "label": "Screenshot Generator",
          "icon": "camera",
          "path": "/admin/screenshot-generator",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_demo_recorder",
          "label": "Demo Video Recorder",
          "icon": "video",
          "path": "/admin/screen-capture",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "System",
      "description": "Developer tools and system settings",
      "collapsible": true,
      "items": [
        {
          "id": "admin_architecture",
          "label": "Architecture",
          "icon": "network",
          "path": "/admin/architecture",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_keys_vault",
          "label": "Keys Vault",
          "icon": "key",
          "path": "/admin/keys-vault",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_personas",
          "label": "AI Personas",
          "icon": "bot",
          "path": "/admin/personas",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_conversational_demo",
          "label": "Conversational Demo",
          "icon": "message-circle",
          "path": "/admin/conversational-demo",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_system_tools",
          "label": "System Tools",
          "icon": "wrench",
          "path": "/admin/system-tools",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_system_status",
          "label": "System Status",
          "icon": "activity",
          "path": "/admin/system-status",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_security",
          "label": "Security",
          "icon": "shield-check",
          "path": "/admin/security",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/admin/settings",
          "roles": ["admin", "super_admin"]
        }
      ]
    }
  ]
};

/**
 * Filter navigation items by user roles
 */
export function filterNavigationByRoles(
  navigation: NavigationGroup[],
  userRoles: UserRole[]
): NavigationGroup[] {
  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  return navigation
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.roles.some(role => userRoles.includes(role))
      )
    }))
    .filter(group => group.items.length > 0);
}
