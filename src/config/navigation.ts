/**
 * My Day OS - Navigation Configuration
 * 
 * User-centered navigation aligned with daily workflows
 * instead of technical modules.
 */

export type UserRole = 'creator' | 'subscriber' | 'advertiser' | 'influencer' | 'agency' | 'admin' | 'super_admin';

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
    "super_admin"
  ],
  "navigation": [
    {
      "group": "My Day OS",
      "description": "Your personalized daily workflow",
      "items": [
        {
          "id": "dashboard",
          "label": "Dashboard",
          "icon": "layout-dashboard",
          "path": "/dashboard",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"],
          "description": "Your main dashboard"
        },
        {
          "id": "my_day",
          "label": "My Day",
          "icon": "sparkles",
          "path": "/my-day",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"],
          "description": "Your personalized daily view"
        },
        {
          "id": "inbox",
          "label": "Inbox",
          "icon": "inbox",
          "path": "/inbox",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"],
          "description": "Unified communications"
        },
        {
          "id": "audience",
          "label": "Contacts & Audience",
          "icon": "users",
          "path": "/audience",
          "roles": ["creator", "influencer", "agency", "admin"],
          "description": "Manage your audience"
        },
        {
          "id": "content",
          "label": "Content & Media",
          "icon": "video",
          "path": "/content",
          "roles": ["creator", "influencer", "agency", "admin"],
          "description": "All creation tools"
        },
        {
          "id": "monetization",
          "label": "Monetization Hub",
          "icon": "dollar-sign",
          "path": "/monetization",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"],
          "description": "Revenue & deals"
        },
        {
          "id": "settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/settings",
          "roles": ["creator", "subscriber", "influencer", "agency", "advertiser", "admin"],
          "description": "Account settings"
        }
      ]
    },

    {
      "group": "Admin",
      "description": "System administration",
      "items": [
        {
          "id": "admin_dashboard",
          "label": "Admin Dashboard",
          "icon": "shield",
          "path": "/admin",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_settings",
          "label": "Global Settings",
          "icon": "settings",
          "path": "/admin/settings",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_system_status",
          "label": "System Status",
          "icon": "activity",
          "path": "/admin/system-status",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Content Management",
      "description": "Website and content administration",
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
          "id": "admin_background_remover",
          "label": "Background Remover",
          "icon": "scissors",
          "path": "/background-remover",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "User Management",
      "description": "Manage users and creators",
      "items": [
        {
          "id": "admin_creators",
          "label": "Creators",
          "icon": "users",
          "path": "/admin/creators",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_advertisers",
          "label": "Advertisers",
          "icon": "megaphone",
          "path": "/admin/advertisers",
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
      "group": "Identity & Certification",
      "description": "Voice and identity verification",
      "items": [
        {
          "id": "admin_identity",
          "label": "Identity Dashboard",
          "icon": "fingerprint",
          "path": "/admin/identity",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_certification",
          "label": "Certification Console",
          "icon": "shield-check",
          "path": "/admin/certification",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_voice_credentials",
          "label": "Voice Credentials",
          "icon": "mic",
          "path": "/admin/voice-credentials",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_voice_tag",
          "label": "Voice Tag",
          "icon": "tag",
          "path": "/admin/voice-tag",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_voice_certification",
          "label": "Voice Certification",
          "icon": "award",
          "path": "/admin/voice-certification",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_voice_nft",
          "label": "Voice NFT Certificates",
          "icon": "hexagon",
          "path": "/admin/voice-nft-certificates",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Advertising & Revenue",
      "description": "Manage advertising and monetization",
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
        }
      ]
    },

    {
      "group": "Business Operations",
      "description": "Sales, support, and business tools",
      "items": [
        {
          "id": "admin_support",
          "label": "Support Desk",
          "icon": "headphones",
          "path": "/admin/support",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_sales",
          "label": "Sales Leads",
          "icon": "target",
          "path": "/admin/sales",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_billing",
          "label": "Billing",
          "icon": "credit-card",
          "path": "/admin/billing",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_payments",
          "label": "Payments",
          "icon": "banknote",
          "path": "/admin/payments",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_investor_spreadsheets",
          "label": "Investor Spreadsheets",
          "icon": "file-spreadsheet",
          "path": "/admin/investor-spreadsheets",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Developer Tools",
      "description": "Technical administration and AI tools",
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
