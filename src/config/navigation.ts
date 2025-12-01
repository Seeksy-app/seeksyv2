/**
 * Master Navigation Configuration
 * 
 * This is the source of truth for all navigation items across Seeksy.
 * Each item has a roles array that controls which user types can see it.
 * 
 * To add new modules or update navigation, edit this file.
 */

export type UserRole = 'creator' | 'subscriber' | 'advertiser' | 'influencer' | 'agency' | 'admin' | 'super_admin';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
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
    "admin"
  ],
  "navigation": [
    {
      "group": "Main",
      "items": [
        {
          "id": "dashboard",
          "label": "Dashboard",
          "icon": "home",
          "path": "/dashboard",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"]
        },
        {
          "id": "identity",
          "label": "Identity & Rights",
          "icon": "shield",
          "path": "/identity",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "rights",
          "label": "Rights Management",
          "icon": "lock",
          "path": "/identity/rights",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "clips",
          "label": "Clips",
          "icon": "scissors",
          "path": "/clips",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "media_vault",
          "label": "Media Vault",
          "icon": "folder",
          "path": "/media/library",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Email",
      "items": [
        {
          "id": "email_home",
          "label": "Email Home",
          "icon": "mail",
          "path": "/email",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_campaigns",
          "label": "Campaigns",
          "icon": "mail",
          "path": "/email-campaigns",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_templates",
          "label": "Templates",
          "icon": "layout",
          "path": "/email-templates",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_segments",
          "label": "Segments",
          "icon": "filter",
          "path": "/email-segments",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_automations",
          "label": "Automations",
          "icon": "zap",
          "path": "/email-automations",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "email_settings",
          "label": "Settings",
          "icon": "settings",
          "path": "/email-settings",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Engagement",
      "items": [
        {
          "id": "meetings",
          "label": "Meetings (Mia)",
          "icon": "calendar",
          "path": "/meetings",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "contacts",
          "label": "Contacts",
          "icon": "contacts",
          "path": "/contacts",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "forms",
          "label": "Forms",
          "icon": "form",
          "path": "/forms",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "sms",
          "label": "SMS",
          "icon": "sms",
          "path": "/sms",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "lead_pixel",
          "label": "Lead Pixel",
          "icon": "target",
          "path": "/lead-pixel",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Monetize",
      "items": [
        {
          "id": "advertiser_access",
          "label": "Advertiser Access",
          "icon": "briefcase",
          "path": "/identity",
          "roles": ["creator", "influencer", "agency", "admin"]
        },
        {
          "id": "licenses",
          "label": "Licenses",
          "icon": "file",
          "path": "/identity",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Settings",
      "items": [
        {
          "id": "account",
          "label": "Account",
          "icon": "settings",
          "path": "/settings",
          "roles": ["creator", "subscriber", "influencer", "agency", "advertiser", "admin"]
        },
        {
          "id": "billing",
          "label": "Billing",
          "icon": "dollar",
          "path": "/settings/billing",
          "roles": ["creator", "influencer", "agency", "advertiser", "admin"]
        },
        {
          "id": "connected_apps",
          "label": "Connected Apps",
          "icon": "link",
          "path": "/settings/integrations",
          "roles": ["creator", "influencer", "agency", "admin"]
        }
      ]
    },

    {
      "group": "Admin",
      "items": [
        {
          "id": "admin_dashboard",
          "label": "Admin Dashboard",
          "icon": "dashboard",
          "path": "/admin",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "identity_console",
          "label": "Identity Console",
          "icon": "shield",
          "path": "/admin/identity",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "certification_console",
          "label": "Certification Console",
          "icon": "certificate",
          "path": "/admin/certifications",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "checklists",
          "label": "Checklists",
          "icon": "checklist",
          "path": "/admin/checklists",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Content Management",
      "items": [
        {
          "id": "logo_manager",
          "label": "Logo Manager",
          "icon": "image",
          "path": "/admin/logo-manager",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "hero_manager",
          "label": "Hero Manager",
          "icon": "layout",
          "path": "/admin/hero-manager",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "mascot_manager",
          "label": "Mascot Manager",
          "icon": "star",
          "path": "/admin/mascot-manager",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "global_branding",
          "label": "Global Branding",
          "icon": "palette",
          "path": "/admin/global-branding",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Voice Certification",
      "items": [
        {
          "id": "voice_tag",
          "label": "Voice Tag & Fingerprints",
          "icon": "fingerprint",
          "path": "/admin/voice-tag",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "voice_certification",
          "label": "Certification Records",
          "icon": "shield",
          "path": "/admin/voice-certification",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "voice_nft_certificates",
          "label": "NFT Certificates",
          "icon": "award",
          "path": "/admin/voice-nft-certificates",
          "roles": ["admin", "super_admin"]
        },
        {
          "id": "landing_pages",
          "label": "Landing Pages",
          "icon": "layout",
          "path": "/admin/landing-pages",
          "roles": ["admin", "super_admin"]
        }
      ]
    },

    {
      "group": "Footer",
      "items": [
        {
          "id": "ask_spark",
          "label": "Ask Spark",
          "icon": "sparkles",
          "path": "/ask-spark",
          "roles": ["creator", "subscriber", "influencer", "agency", "advertiser", "admin"]
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
