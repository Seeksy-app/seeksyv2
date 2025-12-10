export type PortalType = 'admin' | 'creator' | 'board';

export interface KnowledgeArticle {
  id: string;
  portal: PortalType;
  section: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  purpose: string | null;
  expected_outcomes: string | null;
  key_takeaways: string[] | null;
  execution_steps: string[] | null;
  questions: string[] | null;
  screenshot_urls: string[] | null;
  author_id: string | null;
  is_published: boolean;
  view_count: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export const PORTAL_SECTIONS: Record<PortalType, string[]> = {
  admin: [
    'Overview',
    'Monetization',
    'AI Systems',
    'Finance Ops',
    'Meetings & Events',
    'Identity & Verification',
    'Creator Tools'
  ],
  creator: [
    'Getting Started',
    'Monetization',
    'Branding & Identity',
    'Analytics',
    'Studio Tools',
    'Meetings',
    'Growth'
  ],
  board: [
    'Company Health',
    'Capital Strategy',
    '3-Year Pro Forma',
    'Financial Statements',
    'Milestones',
    'Team & Org',
    'Competitive Landscape'
  ]
};

export const PORTAL_LABELS: Record<PortalType, string> = {
  admin: 'Admin Knowledge Blog',
  creator: 'Creator Knowledge Blog',
  board: 'Board Knowledge Blog'
};
