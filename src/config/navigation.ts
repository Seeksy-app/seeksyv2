/**
 * Admin Navigation Configuration
 * 
 * This config is ONLY for admin/super_admin users.
 * Creator navigation is handled by useNavPreferences hook.
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
    "admin",
    "super_admin",
    "board_member"
  ],
  "navigation": [
    {
      "group": "Advertising & Revenue",
      "description": "Advertising, campaigns, and revenue management",
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
          "id": "admin_revenue_insights",
          "label": "Revenue Insights",
          "icon": "bar-chart-2",
          "path": "/admin/revenue-insights",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Business Operations",
      "description": "Support, sales, billing, and operations",
      "collapsible": true,
      "items": [
        {
          "id": "admin_support_desk",
          "label": "Support Desk",
          "icon": "headphones",
          "path": "/admin/support",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_lead_manager",
          "label": "Lead Manager",
          "icon": "user-plus",
          "path": "/admin/sales-leads",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_billing_payments",
          "label": "Billing & Payments",
          "icon": "credit-card",
          "path": "/admin/billing",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_cmo_dashboard",
          "label": "CMO Command Center",
          "icon": "target",
          "path": "/admin/cmo",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_cco_dashboard",
          "label": "CCO Communications",
          "icon": "message-circle",
          "path": "/admin/cco",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_lead_magnets",
          "label": "Lead Magnets",
          "icon": "file-text",
          "path": "/admin/lead-magnets",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Financials (CFO)",
      "description": "Financial planning and analysis",
      "collapsible": true,
      "items": [
        {
          "id": "admin_key_metrics",
          "label": "Key Metrics",
          "icon": "bar-chart-2",
          "path": "/admin/financials/key-metrics",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_roi_calculator",
          "label": "ROI Calculator",
          "icon": "calculator",
          "path": "/admin/financials/roi-calculator",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_revenue_insights_cfo",
          "label": "Revenue Insights",
          "icon": "dollar-sign",
          "path": "/admin/financials/revenue-insights",
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
          "id": "admin_cfo_models",
          "label": "CFO Models",
          "icon": "calculator",
          "path": "/admin/financial-models/combined",
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
      "group": "User Management",
      "description": "User and identity management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_users",
          "label": "Users",
          "icon": "users",
          "path": "/admin/creators",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_identity",
          "label": "Identity & Certification",
          "icon": "fingerprint",
          "path": "/admin/identity",
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
        },
        {
          "id": "admin_permissions",
          "label": "Permissions",
          "icon": "shield-check",
          "path": "/admin/permissions",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "R&D & Intelligence",
      "description": "Research and market intelligence",
      "collapsible": true,
      "items": [
        {
          "id": "admin_rd_feeds",
          "label": "R&D Intelligence Feeds",
          "icon": "rss",
          "path": "/admin/rd-feeds",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_market_intelligence",
          "label": "Market Intelligence",
          "icon": "globe",
          "path": "/admin/market-intelligence",
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
      "group": "Developer Tools",
      "description": "API, webhooks, and system tools",
      "collapsible": true,
      "items": [
        {
          "id": "admin_keys_vault",
          "label": "API Keys",
          "icon": "key",
          "path": "/admin/keys-vault",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_webhooks",
          "label": "Webhooks",
          "icon": "webhook",
          "path": "/admin/webhooks",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_logs",
          "label": "Logs",
          "icon": "scroll-text",
          "path": "/admin/logs",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_architecture",
          "label": "Architecture",
          "icon": "network",
          "path": "/admin/architecture",
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
        }
      ]
    },

    {
      "group": "Support",
      "description": "Help and contact",
      "collapsible": true,
      "items": [
        {
          "id": "admin_help_center",
          "label": "Help Center",
          "icon": "help-circle",
          "path": "/help",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_contact",
          "label": "Contact Seeksy",
          "icon": "mail",
          "path": "/contact",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_settings",
          "label": "Admin Settings",
          "icon": "settings",
          "path": "/admin/settings",
          "roles": ["admin", "super_admin"]
        }
      ]
    }
  ]
};

/**
 * Filter navigation items by user roles (admin only)
 */
export function filterNavigationByRoles(
  navigation: NavigationGroup[],
  userRoles: UserRole[]
): NavigationGroup[] {
  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  // Only show admin navigation to admin/super_admin users
  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
  if (!isAdmin) {
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
