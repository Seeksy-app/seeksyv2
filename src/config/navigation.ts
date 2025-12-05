/**
 * Admin Navigation Configuration
 * 
 * This config is ONLY for admin/super_admin users.
 * Creator navigation is handled by useNavPreferences hook.
 */

export type UserRole = 'creator' | 'subscriber' | 'advertiser' | 'influencer' | 'agency' | 'admin' | 'super_admin' | 'board_member' | 'platform_owner' | 'support_admin' | 'support_agent' | 'team_manager' | 'read_only_analyst' | 'cfo' | 'cmo' | 'cco' | 'manager';

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
    "board_member",
    "cfo",
    "cmo",
    "cco",
    "manager"
  ],
  "navigation": [
    {
      "group": "Advertising and Sales",
      "description": "Advertising, campaigns, sales, and revenue management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_advertising",
          "label": "Advertising Management",
          "icon": "megaphone",
          "path": "/admin/advertising",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_rate_desk",
          "label": "Rate Desk",
          "icon": "dollar-sign",
          "path": "/admin/advertising/rate-desk",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_ad_campaigns",
          "label": "Ad Campaigns",
          "icon": "radio",
          "path": "/admin/ad-campaigns",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_ad_inventory",
          "label": "Ad Inventory",
          "icon": "package",
          "path": "/admin/ad-inventory",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_ad_analytics",
          "label": "Ad Analytics",
          "icon": "trending-up",
          "path": "/admin/ad-analytics",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_revenue_insights",
          "label": "Revenue Insights",
          "icon": "bar-chart-2",
          "path": "/admin/revenue-insights",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_lead_manager",
          "label": "Lead Manager",
          "icon": "user-plus",
          "path": "/admin/sales-leads",
          "roles": ["admin", "super_admin", "cmo"]
        }
      ]
    },

    {
      "group": "Business Operations",
      "description": "Support, sales, billing, and operations",
      "collapsible": true,
      "items": [
        {
          "id": "admin_help_desk",
          "label": "Help Desk",
          "icon": "headphones",
          "path": "/helpdesk",
          "roles": ["admin", "super_admin", "support_admin", "support_agent", "manager"],
          "description": "Customer support ticket management"
        },
        {
          "id": "admin_users",
          "label": "All Users",
          "icon": "users",
          "path": "/admin/creators",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_site_leads",
          "label": "Site Leads",
          "icon": "globe",
          "path": "/admin/site-leads",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Website visitors requesting demos or info"
        },
        {
          "id": "admin_billing_payments",
          "label": "Billing & Payments",
          "icon": "credit-card",
          "path": "/admin/billing",
          "roles": ["admin", "super_admin", "cfo", "manager"]
        },
        {
          "id": "admin_cco_dashboard",
          "label": "CCO Communications",
          "icon": "message-circle",
          "path": "/admin/cco",
          "roles": ["admin", "super_admin", "cco"]
        }
      ]
    },

    {
      "group": "Meetings",
      "description": "Meeting management and scheduling",
      "collapsible": true,
      "items": [
        {
          "id": "admin_meetings_dashboard",
          "label": "Dashboard",
          "icon": "layout-dashboard",
          "path": "/admin/meetings",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin", "cmo", "cco", "cfo"]
        },
        {
          "id": "admin_meeting_types",
          "label": "Meeting Types",
          "icon": "calendar-check",
          "path": "/admin/meetings/types",
          "roles": ["admin", "super_admin", "platform_owner"]
        },
        {
          "id": "admin_booking_links",
          "label": "Booking Links",
          "icon": "link",
          "path": "/admin/meetings/links",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin"]
        },
        {
          "id": "admin_scheduled_meetings",
          "label": "Scheduled Meetings",
          "icon": "calendar",
          "path": "/admin/meetings/scheduled",
          "roles": ["admin", "super_admin", "platform_owner", "support_admin", "cmo", "cco", "cfo"]
        },
        {
          "id": "admin_team_availability",
          "label": "Team Availability",
          "icon": "clock",
          "path": "/admin/meetings/availability",
          "roles": ["admin", "super_admin", "platform_owner"]
        },
        {
          "id": "admin_meeting_settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/admin/meetings/settings",
          "roles": ["admin", "super_admin", "platform_owner"]
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
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_roi_calculator",
          "label": "ROI Calculator",
          "icon": "calculator",
          "path": "/admin/financials/roi-calculator",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_revenue_insights_cfo",
          "label": "Revenue Insights",
          "icon": "dollar-sign",
          "path": "/admin/financials/revenue-insights",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_cfo_assumptions",
          "label": "CFO Assumptions",
          "icon": "sliders",
          "path": "/cfo-dashboard#assumptions",
          "roles": ["admin", "super_admin", "cfo"]
        },
        {
          "id": "admin_proforma_combined",
          "label": "3-Year Pro Forma (Combined)",
          "icon": "line-chart",
          "path": "/investor",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_proforma_events",
          "label": "Awards Pro Forma",
          "icon": "trophy",
          "path": "/cfo/proforma/events-awards",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_swot",
          "label": "SWOT Analysis",
          "icon": "target",
          "path": "/admin/financials/swot",
          "roles": ["admin", "super_admin", "cfo", "board_member"]
        },
        {
          "id": "admin_investor_spreadsheets",
          "label": "Investor Spreadsheets",
          "icon": "file-spreadsheet",
          "path": "/admin/investor-spreadsheets",
          "roles": ["admin", "super_admin", "cfo"]
        }
      ]
    },

    {
      "group": "Marketing (CMO)",
      "description": "Marketing campaigns and growth",
      "collapsible": true,
      "items": [
        {
          "id": "admin_cmo_dashboard",
          "label": "CMO Command Center",
          "icon": "target",
          "path": "/admin/cmo",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_lead_magnets",
          "label": "Lead Magnets",
          "icon": "file-text",
          "path": "/admin/lead-magnets",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_outbound_campaigns",
          "label": "Outbound Campaigns",
          "icon": "send",
          "path": "/admin/marketing/campaigns",
          "roles": ["admin", "super_admin", "cmo"],
          "description": "Email, social, influencer outreach"
        },
        {
          "id": "admin_funnels",
          "label": "Funnels & Attribution",
          "icon": "git-branch",
          "path": "/admin/marketing/funnels",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_seo_branding",
          "label": "SEO & Branding",
          "icon": "search",
          "path": "/admin/marketing/seo",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_logo_manager",
          "label": "Logo Manager",
          "icon": "image",
          "path": "/admin/logo-manager",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_hero_manager",
          "label": "Hero Manager",
          "icon": "layout",
          "path": "/admin/hero-manager",
          "roles": ["admin", "super_admin", "cmo"]
        },
        {
          "id": "admin_brand_settings",
          "label": "Brand Settings",
          "icon": "palette",
          "path": "/admin/brand-settings",
          "roles": ["admin", "super_admin", "cmo"]
        }
      ]
    },

    {
      "group": "Content Management (CCO)",
      "description": "Content and media administration",
      "collapsible": true,
      "items": [
        {
          "id": "admin_master_blog",
          "label": "Articles / Blog",
          "icon": "book-open",
          "path": "/admin/master-blog",
          "roles": ["admin", "super_admin", "cco"]
        },
        {
          "id": "admin_media_library",
          "label": "Media Library",
          "icon": "folder",
          "path": "/admin/content/media-library",
          "roles": ["admin", "super_admin", "cco"]
        }
      ]
    },

    {
      "group": "User Management",
      "description": "User, team, and access management",
      "collapsible": true,
      "items": [
        {
          "id": "admin_team_members",
          "label": "Team Members",
          "icon": "users",
          "path": "/admin/team-members",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_permissions",
          "label": "Roles & Permissions",
          "icon": "shield-check",
          "path": "/admin/permissions",
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
          "id": "admin_impersonate",
          "label": "Impersonate User",
          "icon": "user-cog",
          "path": "/admin/impersonate",
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
          "roles": ["admin", "super_admin", "cfo", "cmo"]
        },
        {
          "id": "admin_agent_training",
          "label": "Agent Training",
          "icon": "brain",
          "path": "/admin/agent-training",
          "roles": ["admin", "super_admin"],
          "description": "AI agent knowledge health and training"
        },
        {
          "id": "admin_market_intelligence",
          "label": "Market Intelligence",
          "icon": "globe",
          "path": "/admin/market-intelligence",
          "roles": ["admin", "super_admin", "cfo", "cmo"]
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
      "description": "Help and settings",
      "collapsible": true,
      "items": [
        {
          "id": "admin_ask_spark",
          "label": "Ask Seeksy",
          "icon": "sparkles",
          "path": "#ask-spark",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco", "manager"]
        },
        {
          "id": "admin_help_center",
          "label": "Help Center",
          "icon": "help-circle",
          "path": "/help",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco", "manager"]
        },
        {
          "id": "admin_contact",
          "label": "Contact Seeksy",
          "icon": "mail",
          "path": "/contact",
          "roles": ["admin", "super_admin", "cfo", "cmo", "cco", "manager"]
        },
        {
          "id": "admin_settings",
          "label": "Admin Settings",
          "icon": "settings",
          "path": "/admin/settings",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "admin_settings_team",
          "label": "Team & Roles",
          "icon": "users",
          "path": "/admin/settings/team",
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

  // Check if user has any admin-level role
  const hasAdminAccess = userRoles.some(role => 
    ['admin', 'super_admin', 'cfo', 'cmo', 'cco', 'manager', 'board_member'].includes(role)
  );
  
  if (!hasAdminAccess) {
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
