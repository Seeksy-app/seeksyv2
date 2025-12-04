// Lead Magnet Engine Configuration
// Maps persona types to their available downloadable offers

export interface LeadMagnetOffer {
  id: string;
  title: string;
  description: string;
  pdfPath: string;
  bullets: string[];
}

export interface PersonaConfig {
  label: string;
  icon: string;
  offers: LeadMagnetOffer[];
}

export const leadMagnetOffers: Record<string, PersonaConfig> = {
  podcaster: {
    label: "Podcaster",
    icon: "🎙️",
    offers: [
      {
        id: "ai_podcast_2025",
        title: "5 Ways AI Will Transform Podcast Growth in 2025",
        description: "Discover the AI tools and strategies that top podcasters are using to grow their audience.",
        pdfPath: "podcasters/ai-growth.pdf",
        bullets: [
          "AI-powered episode optimization techniques",
          "Automated guest outreach strategies",
          "Smart analytics for audience growth",
          "AI transcription and repurposing workflows",
          "Predictive content planning"
        ]
      },
      {
        id: "editing_automation",
        title: "How Seeksy Cuts Editing Time by 80%",
        description: "Learn how AI-powered editing can save you hours every week.",
        pdfPath: "podcasters/editing-automation.pdf",
        bullets: [
          "One-click noise reduction",
          "Automated filler word removal",
          "Smart chapter markers",
          "AI-generated show notes",
          "Instant clip creation"
        ]
      }
    ]
  },
  influencer: {
    label: "Creator / Influencer",
    icon: "⭐",
    offers: [
      {
        id: "social_revenue_2025",
        title: "The 2025 Social Revenue Playbook",
        description: "Maximize your earning potential across all social platforms.",
        pdfPath: "influencers/social-playbook.pdf",
        bullets: [
          "Platform-specific monetization strategies",
          "Brand deal negotiation templates",
          "Content calendar optimization",
          "Audience engagement tactics",
          "Revenue diversification methods"
        ]
      },
      {
        id: "creator_identity",
        title: "Protect Your Voice: Creator Identity Guide",
        description: "Learn how blockchain-verified identity protects your content and brand.",
        pdfPath: "influencers/identity-guide.pdf",
        bullets: [
          "Voice certification explained",
          "Content authentication benefits",
          "Brand protection strategies",
          "Legal considerations",
          "Implementation checklist"
        ]
      }
    ]
  },
  event_creator: {
    label: "Event Host / Speaker",
    icon: "🎤",
    offers: [
      {
        id: "event_automation",
        title: "Top 10 Event Automations for 2025",
        description: "Automate your events from registration to follow-up.",
        pdfPath: "events/automation.pdf",
        bullets: [
          "Automated registration workflows",
          "Smart reminder sequences",
          "Post-event engagement funnels",
          "Attendee segmentation",
          "Feedback collection automation"
        ]
      },
      {
        id: "speaker_toolkit",
        title: "The Professional Speaker's Digital Toolkit",
        description: "Everything you need to book more speaking gigs.",
        pdfPath: "events/speaker-toolkit.pdf",
        bullets: [
          "Speaker page optimization",
          "Media kit essentials",
          "Booking funnel setup",
          "Client follow-up sequences",
          "Testimonial collection"
        ]
      }
    ]
  },
  business: {
    label: "Business Professional",
    icon: "💼",
    offers: [
      {
        id: "ai_workflows",
        title: "AI Workflows That Replace 5 Tools",
        description: "Consolidate your tech stack with intelligent automation.",
        pdfPath: "business/ai-workflows.pdf",
        bullets: [
          "CRM + email automation in one",
          "Meeting scheduling optimization",
          "Lead scoring with AI",
          "Automated proposal generation",
          "Unified analytics dashboard"
        ]
      },
      {
        id: "crm_playbook",
        title: "The Modern CRM Playbook",
        description: "Build relationships that convert with smart CRM strategies.",
        pdfPath: "business/crm-playbook.pdf",
        bullets: [
          "Contact segmentation strategies",
          "Automated nurture sequences",
          "Pipeline optimization",
          "Deal tracking best practices",
          "Integration recommendations"
        ]
      }
    ]
  },
  advertiser: {
    label: "Brand / Advertiser",
    icon: "📢",
    offers: [
      {
        id: "creator_ads_2025",
        title: "The Future of Creator Advertising",
        description: "How brands are winning with authentic creator partnerships.",
        pdfPath: "advertisers/ads-report.pdf",
        bullets: [
          "Creator economy market trends",
          "ROI measurement frameworks",
          "Partnership structure templates",
          "Compliance and disclosure guides",
          "Case studies from top brands"
        ]
      },
      {
        id: "voice_advertising",
        title: "Voice-First Advertising Guide",
        description: "Tap into the growing podcast and audio advertising market.",
        pdfPath: "advertisers/voice-advertising.pdf",
        bullets: [
          "Audio ad best practices",
          "Host-read vs programmatic comparison",
          "Targeting and measurement",
          "Budget optimization strategies",
          "Creative guidelines"
        ]
      }
    ]
  },
  investor: {
    label: "Investor / Analyst",
    icon: "📊",
    offers: [
      {
        id: "market_snapshot",
        title: "AI + Creator Economy Snapshot 2025",
        description: "Comprehensive market analysis for informed investment decisions.",
        pdfPath: "investors/market-snapshot.pdf",
        bullets: [
          "Market size and growth projections",
          "Key player analysis",
          "Technology trend overview",
          "Investment opportunity matrix",
          "Risk assessment framework"
        ]
      },
      {
        id: "seeksy_overview",
        title: "Seeksy Platform Overview",
        description: "Deep dive into Seeksy's technology and business model.",
        pdfPath: "investors/seeksy-overview.pdf",
        bullets: [
          "Platform architecture",
          "Revenue model breakdown",
          "Competitive positioning",
          "Growth strategy",
          "Team and milestones"
        ]
      }
    ]
  },
  agency: {
    label: "Agency / Consultant",
    icon: "🏢",
    offers: [
      {
        id: "agency_scaling",
        title: "Scaling Your Creator Agency in 2025",
        description: "Systems and strategies for managing multiple creator clients.",
        pdfPath: "agency/scaling-guide.pdf",
        bullets: [
          "Multi-client management systems",
          "Automated reporting workflows",
          "Client onboarding templates",
          "Revenue tracking dashboards",
          "Team collaboration tools"
        ]
      }
    ]
  }
};

// Helper function to get offers by persona
export function getLeadMagnetOffersByPersona(persona: string): LeadMagnetOffer[] {
  return leadMagnetOffers[persona]?.offers || [];
}

// Get all persona options for selector
export function getPersonaOptions(): Array<{ id: string; label: string; icon: string }> {
  return Object.entries(leadMagnetOffers).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon
  }));
}

// Get a specific offer by ID across all personas
export function getOfferById(offerId: string): LeadMagnetOffer | null {
  for (const config of Object.values(leadMagnetOffers)) {
    const offer = config.offers.find(o => o.id === offerId);
    if (offer) return offer;
  }
  return null;
}

// Get persona by offer ID
export function getPersonaByOfferId(offerId: string): string | null {
  for (const [persona, config] of Object.entries(leadMagnetOffers)) {
    if (config.offers.some(o => o.id === offerId)) {
      return persona;
    }
  }
  return null;
}
