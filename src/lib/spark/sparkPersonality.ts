/**
 * Seeksy Spark Personality Layer
 * Defines Spark's tone, voice, and context-aware messaging
 */

export type UserRole = "creator" | "advertiser" | "admin" | "guest";
export type PageContext = 
  | "dashboard"
  | "podcast"
  | "studio"
  | "my-page"
  | "campaign"
  | "rate-desk"
  | "cfo-dashboard"
  | "financial-models"
  | "voice-certification"
  | "media-library"
  | "meetings"
  | "blog"
  | "settings"
  | "general";

export interface SparkMessage {
  text: string;
  emoji?: string;
}

/**
 * Spark's core personality traits
 */
export const SPARK_PERSONALITY = {
  traits: [
    "Friendly and approachable",
    "Enthusiastic but not overwhelming",
    "Creative and solution-oriented",
    "Data-aware and insightful",
    "Encouraging and supportive"
  ],
  tone: "Short, energetic phrases with light emoji use",
  emojis: ["✨", "🎙️", "📈", "🌟", "💡", "🚀", "📊", "🎯"],
};

/**
 * Role-specific greeting messages
 */
export const getSparkGreeting = (role: UserRole): SparkMessage => {
  switch (role) {
    case "creator":
      return {
        text: "Hi! I'm Seeksy Spark. Ready to create something amazing?",
        emoji: "✨"
      };
    case "advertiser":
      return {
        text: "Hey! Spark here. Let's build a campaign that converts!",
        emoji: "🎯"
      };
    case "admin":
      return {
        text: "Spark reporting! Need help with analytics or reports?",
        emoji: "📊"
      };
    default:
      return {
        text: "Hi! I'm Seeksy Spark. What can I help you with?",
        emoji: "🌟"
      };
  }
};

/**
 * Context-aware hints based on current page
 */
export const getSparkContextHint = (
  context: PageContext,
  role: UserRole
): SparkMessage | null => {
  const hints: Record<PageContext, Record<UserRole, SparkMessage | null>> = {
    dashboard: {
      creator: {
        text: "Your dashboard is looking good! Want to explore My Page or start a podcast?",
        emoji: "🚀"
      },
      advertiser: {
        text: "Ready to launch your first campaign? I can help you get started!",
        emoji: "🎯"
      },
      admin: {
        text: "Dashboard metrics are up! Need a financial forecast or rate analysis?",
        emoji: "📈"
      },
      guest: null
    },
    podcast: {
      creator: {
        text: "Try marking ad-break markers — Spark can auto-detect good clip moments! 🎙️✨",
        emoji: "🎙️"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    studio: {
      creator: {
        text: "Recording ready! Mark clips as you go — I'll help with post-production later!",
        emoji: "🎙️"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    "my-page": {
      creator: {
        text: "Your My Page is taking shape! Want help adding sections or customizing your theme?",
        emoji: "✨"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    campaign: {
      creator: null,
      advertiser: {
        text: "Your CPM looks strong — Spark can model impressions based on your budget.",
        emoji: "📊"
      },
      admin: null,
      guest: null
    },
    "rate-desk": {
      creator: null,
      advertiser: null,
      admin: {
        text: "Spark analyzed current CPMs — some inventory might be underpriced.",
        emoji: "💡"
      },
      guest: null
    },
    "cfo-dashboard": {
      creator: null,
      advertiser: null,
      admin: {
        text: "Financial data looks solid! Want me to generate a custom scenario?",
        emoji: "📈"
      },
      guest: null
    },
    "financial-models": {
      creator: null,
      advertiser: null,
      admin: {
        text: "I can help you adjust assumptions or export investor-ready reports!",
        emoji: "📊"
      },
      guest: null
    },
    "voice-certification": {
      creator: {
        text: "Voice certification protects your identity! Let's get you certified!",
        emoji: "🌟"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    "media-library": {
      creator: {
        text: "Your media library is your creative hub! Need help organizing or editing clips?",
        emoji: "🎬"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    meetings: {
      creator: {
        text: "Meetings are easy with Seeksy! Want me to schedule one or send invites?",
        emoji: "📅"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    blog: {
      creator: {
        text: "Blogging is powerful! Want AI help writing your next post?",
        emoji: "📝"
      },
      advertiser: null,
      admin: null,
      guest: null
    },
    settings: {
      creator: {
        text: "Customizing your settings? Let me know if you need help with anything!",
        emoji: "⚙️"
      },
      advertiser: {
        text: "Need help with billing or campaign settings? I'm here!",
        emoji: "⚙️"
      },
      admin: {
        text: "Admin settings loaded. Need help with user roles or configurations?",
        emoji: "🔧"
      },
      guest: null
    },
    general: {
      creator: {
        text: "Need help with anything? Ask away!",
        emoji: "✨"
      },
      advertiser: {
        text: "Got questions? I'm here to help!",
        emoji: "🎯"
      },
      admin: {
        text: "Looking for something? Just ask!",
        emoji: "📊"
      },
      guest: null
    }
  };

  return hints[context]?.[role] || hints.general[role];
};

/**
 * Empty state messages with Spark encouragement
 */
export const getSparkEmptyStateMessage = (
  entityType: "episodes" | "campaigns" | "events" | "meetings" | "posts" | "contacts",
  role: UserRole
): SparkMessage => {
  const messages: Record<string, SparkMessage> = {
    episodes: {
      text: "No episodes yet — Spark can help you create your first podcast script in minutes!",
      emoji: "🎙️"
    },
    campaigns: {
      text: "Ready to launch your first campaign? I'll walk you through it step-by-step!",
      emoji: "🚀"
    },
    events: {
      text: "Let's create your first event! I can help you set up everything.",
      emoji: "🎉"
    },
    meetings: {
      text: "No meetings scheduled yet! Want me to help you set one up?",
      emoji: "📅"
    },
    posts: {
      text: "Your blog is empty! Let's write your first post together!",
      emoji: "✍️"
    },
    contacts: {
      text: "Start building your network! I can help you organize your contacts.",
      emoji: "👥"
    }
  };

  return messages[entityType] || {
    text: "Nothing here yet! Let's get started!",
    emoji: "🌟"
  };
};

/**
 * Onboarding welcome messages by role
 */
export const getSparkOnboardingMessage = (role: UserRole): SparkMessage => {
  switch (role) {
    case "creator":
      return {
        text: "You're about to build your presence. Spark can help you set up your My Page, link your podcast, and launch your newsletter!",
        emoji: "🚀"
      };
    case "advertiser":
      return {
        text: "Ready to launch your first campaign? Spark can walk you through creative options and match you to creators.",
        emoji: "🎯"
      };
    case "admin":
      return {
        text: "Spark can help you forecast revenue, build pricing models, or prep investor docs.",
        emoji: "📊"
      };
    default:
      return {
        text: "Welcome to Seeksy! Let me show you around!",
        emoji: "✨"
      };
  }
};
