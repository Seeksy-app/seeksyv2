import { ComponentType } from "react";
import { 
  Shield, 
  Scissors, 
  Image, 
  Users, 
  Mail, 
  Calendar, 
  CheckSquare, 
  Bell, 
  Sparkles,
  Video,
  Mic,
  BarChart3,
  Zap,
} from "lucide-react";

export interface MyDayWidget {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  section: string;
  defaultOrder: number;
  isHideable: boolean;
  minHeight?: string;
}

export interface MyDaySection {
  id: string;
  title: string;
  defaultOrder: number;
  icon: ComponentType<{ className?: string }>;
}

// Section definitions
export const MY_DAY_SECTIONS: MyDaySection[] = [
  { id: "identity-rights", title: "Identity & Rights", defaultOrder: 0, icon: Shield },
  { id: "media-content", title: "Media & Content", defaultOrder: 1, icon: Video },
  { id: "email-engagement", title: "Email & Engagement", defaultOrder: 2, icon: Mail },
  { id: "todays-focus", title: "Today's Focus", defaultOrder: 3, icon: Zap },
  { id: "schedule-tasks", title: "Schedule & Tasks", defaultOrder: 4, icon: Calendar },
  { id: "quick-create", title: "Quick Create", defaultOrder: 5, icon: Sparkles },
];

// Widget registry
export const MY_DAY_WIDGETS: MyDayWidget[] = [
  // Identity & Rights
  { id: "identity-status", title: "Identity Status", icon: Shield, section: "identity-rights", defaultOrder: 0, isHideable: true },
  { id: "certified-clips", title: "Certified Clips", icon: Scissors, section: "identity-rights", defaultOrder: 1, isHideable: true },
  { id: "advertiser-access", title: "Advertiser Access", icon: Users, section: "identity-rights", defaultOrder: 2, isHideable: true },

  // Media & Content
  { id: "media-vault", title: "Media Vault", icon: Image, section: "media-content", defaultOrder: 0, isHideable: true },
  { id: "podcasts", title: "Podcasts", icon: Mic, section: "media-content", defaultOrder: 1, isHideable: true },
  { id: "media-files", title: "Media Files", icon: Video, section: "media-content", defaultOrder: 2, isHideable: true },
  { id: "page-analytics", title: "Page Analytics", icon: BarChart3, section: "media-content", defaultOrder: 3, isHideable: true },

  // Email & Engagement
  { id: "emails-sent", title: "Emails Sent", icon: Mail, section: "email-engagement", defaultOrder: 0, isHideable: true },
  { id: "emails-opened", title: "Emails Opened", icon: Mail, section: "email-engagement", defaultOrder: 1, isHideable: true },
  { id: "email-clicks", title: "Email Clicks", icon: Mail, section: "email-engagement", defaultOrder: 2, isHideable: true },

  // Today's Focus
  { id: "unread-emails", title: "Emails", icon: Mail, section: "todays-focus", defaultOrder: 0, isHideable: false },
  { id: "meetings-today", title: "Meetings", icon: Calendar, section: "todays-focus", defaultOrder: 1, isHideable: false },
  { id: "tasks-due", title: "Tasks", icon: CheckSquare, section: "todays-focus", defaultOrder: 2, isHideable: false },
  { id: "alerts", title: "Alerts", icon: Bell, section: "todays-focus", defaultOrder: 3, isHideable: false },

  // Schedule & Tasks
  { id: "upcoming-meetings", title: "Upcoming Meetings", icon: Calendar, section: "schedule-tasks", defaultOrder: 0, isHideable: true, minHeight: "200px" },
  { id: "todays-tasks", title: "Today's Key Tasks", icon: CheckSquare, section: "schedule-tasks", defaultOrder: 1, isHideable: true, minHeight: "200px" },

  // Quick Create
  { id: "create-clip", title: "Create Clip", icon: Scissors, section: "quick-create", defaultOrder: 0, isHideable: true },
  { id: "upload-media", title: "Upload Media", icon: Image, section: "quick-create", defaultOrder: 1, isHideable: true },
  { id: "verify-face", title: "Verify Face", icon: Shield, section: "quick-create", defaultOrder: 2, isHideable: true },
  { id: "verify-voice", title: "Verify Voice", icon: Mic, section: "quick-create", defaultOrder: 3, isHideable: true },
  { id: "book-mia", title: "Book with Mia", icon: Calendar, section: "quick-create", defaultOrder: 4, isHideable: true },
];

export interface LayoutConfig {
  sectionOrder: string[];
  widgetOrder: Record<string, string[]>;
  hiddenWidgets: string[];
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  sectionOrder: MY_DAY_SECTIONS.map(s => s.id),
  widgetOrder: MY_DAY_SECTIONS.reduce((acc, section) => {
    acc[section.id] = MY_DAY_WIDGETS
      .filter(w => w.section === section.id)
      .sort((a, b) => a.defaultOrder - b.defaultOrder)
      .map(w => w.id);
    return acc;
  }, {} as Record<string, string[]>),
  hiddenWidgets: [],
};
