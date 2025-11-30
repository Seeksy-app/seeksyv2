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
          "label": "Identity",
          "icon": "shield",
          "path": "/identity",
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
          "path": "/engagement/contacts",
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
