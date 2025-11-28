import { Link, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Shield,
  Contact,
  Puzzle,
  CalendarDays,
  ClipboardList,
  BarChart3,
  User as UserIcon,
  QrCode,
  Mic,
  Sparkles,
  CreditCard,
  TrendingUp,
  DollarSign,
  Building2,
  Clapperboard,
  Plus,
  FileAudio,
  Activity,
  Trophy,
  MessageSquare,
  ChevronDown,
  Mail,
  Send,
  Smartphone,
  CheckSquare,
  Box,
  Landmark,
  FileCheck,
  Megaphone,
  Target,
  ListChecks,
  FolderKanban,
  Network,
  Code,
  Grid3x3,
  Pin,
  BookOpen,
  UserCog,
  Coins,
  Briefcase,
  Video,
  LineChart,
  Receipt,
  Volume2,
  Camera,
  Award
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import seeksyLogo from "@/assets/seeksy-logo.png";
import { ModuleLauncher } from "@/components/ModuleLauncher";
import { useRole } from "@/contexts/RoleContext";
import { AdvertiserSidebarNav } from "@/components/advertiser/AdvertiserSidebarNav";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NavigationCustomizer, NavigationSection } from "@/components/navigation/NavigationCustomizer";
import { useToast } from "@/hooks/use-toast";


interface AppSidebarProps {
  user?: User | null;
  isAdmin?: boolean;
}

const DEFAULT_SECTIONS: NavigationSection[] = [
  { id: "main", label: "Main", order: 0 },
  { id: "seekies", label: "Seekies", order: 1 },
  { id: "engagement", label: "Engagement", order: 2 },
  { id: "settings", label: "Settings", order: 3 },
  { id: "admin", label: "Admin", order: 4 },
  { id: "media", label: "Media", order: 5 },
  { id: "monetization", label: "Monetization", order: 6 },
  { id: "project_management", label: "Project Management", order: 7 },
  { id: "advertising", label: "Advertising", order: 8 },
  { id: "civic", label: "Civic", order: 9 },
  { id: "influencer", label: "Influencer", order: 10 },
  { id: "agency", label: "Agency", order: 11 },
  { id: "blog", label: "Blog", order: 12 },
];

export function AppSidebar({ user, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const location = useLocation();
  const { currentRole } = useRole();
  const [username, setUsername] = useState<string>("");
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const [advertiserStatus, setAdvertiserStatus] = useState<string | null>(null);
  const [moduleLauncherOpen, setModuleLauncherOpen] = useState(false);
  
  // Auto-expand admin sections for admins
  useEffect(() => {
    if (isAdmin) {
      setOpenSections(prev => ({
        ...prev,
        admin: true,
        adminCustomerSupport: true
      }));
    }
  }, [isAdmin]);
  const [modulePrefs, setModulePrefs] = useState({
    awards: false,
    media: false,
    civic: false,
    influencer: false,
    agency: false,
    team_chat: false,
    monetization: false,
    project_management: false,
    lead_pixel: false,
    podcasts: false,
    blog: false,
    events: false,
    signup_sheets: false,
    polls: false,
    qr_codes: false,
    marketing: false,
    sms: false,
  });
  const [pinnedModules, setPinnedModules] = useState<string[]>([]);
  
  // State for navigation section ordering
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>(() => {
    const saved = localStorage.getItem("navigation-sections");
    let sections: NavigationSection[] = saved ? JSON.parse(saved) : [...DEFAULT_SECTIONS];
    
    // CRITICAL: Always ensure Settings exists (for users with old localStorage)
    if (!sections.some((s: NavigationSection) => s.id === "settings")) {
      sections.push({ id: "settings", label: "Settings", order: 3 });
    }
    
    // Migrate "finance" to "monetization" (for users with old nav data)
    const financeIndex = sections.findIndex((s: NavigationSection) => s.id === "finance");
    if (financeIndex !== -1) {
      sections[financeIndex] = { id: "monetization", label: "Monetization", order: sections[financeIndex].order };
    }
    
    // Ensure Monetization exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "monetization")) {
      sections.push({ id: "monetization", label: "Monetization", order: 6 });
    }
    
    // Ensure Engagement exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "engagement")) {
      sections.push({ id: "engagement", label: "Engagement", order: 2 });
    }
    
    // Ensure Project Management exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "project_management")) {
      sections.push({ id: "project_management", label: "Project Management", order: 7 });
    }
    
    // Ensure Civic exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "civic")) {
      sections.push({ id: "civic", label: "Civic", order: 9 });
    }
    
    // Ensure Influencer exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "influencer")) {
      sections.push({ id: "influencer", label: "Influencer", order: 10 });
    }
    
    // Ensure Agency exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "agency")) {
      sections.push({ id: "agency", label: "Agency", order: 11 });
    }
    
    // Ensure Blog exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "blog")) {
      sections.push({ id: "blog", label: "Blog", order: 12 });
    }
    
    return sections;
  });
  
  // Helper function to determine which section should be open based on current route
  const getActiveSectionFromPath = (pathname: string) => {
    if (pathname.startsWith('/studio') || pathname.startsWith('/media-library') || pathname.startsWith('/create-clips') || pathname.startsWith('/voice-protection') || pathname.startsWith('/voice-credentials')) return 'media';
    if (pathname.startsWith('/creator/campaign-browser') || pathname.startsWith('/podcast-ads') || pathname.startsWith('/podcast-revenue')) return 'monetization';
    if (pathname.startsWith('/pm-') || pathname.startsWith('/client-tickets')) return 'project_management';
    if (pathname.startsWith('/events') || pathname.startsWith('/meetings') || pathname.startsWith('/polls') || pathname.startsWith('/signup-sheets') || pathname.startsWith('/qr-codes') || pathname.startsWith('/forms')) return 'engagement';
    if (pathname.startsWith('/marketing') || pathname.startsWith('/newsletter') || pathname.startsWith('/sms') || pathname.startsWith('/leads-dashboard')) return 'advertising';
    if (pathname.startsWith('/podcast') || pathname.startsWith('/blog')) return 'blog';
    if (pathname.startsWith('/civic')) return 'civic';
    if (pathname.startsWith('/influencer') || pathname.startsWith('/my-page')) return 'influencer';
    if (pathname.startsWith('/agency')) return 'agency';
    if (pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/contacts') || pathname.startsWith('/media-suite')) return 'main';
    if (pathname.startsWith('/profile') || pathname.startsWith('/my-settings')) return 'settings';
    if (pathname.startsWith('/admin')) {
      // Determine which admin subsection
      if (pathname.includes('/personas') || pathname.includes('/voice-protection')) return 'adminContentManagement';
      if (pathname.includes('/sales')) return 'adminCRM';
      if (pathname.includes('/marketing') || pathname.includes('/newsletter')) return 'adminMarketingSales';
      if (pathname.includes('/tickets') || pathname.includes('/communication-history')) return 'adminCustomerSupport';
      if (pathname.includes('/team') || pathname.includes('/projects')) return 'adminManagement';
      if (pathname.includes('/clients') || pathname.includes('/creators') || pathname.includes('/agencies')) return 'adminClientManagement';
      if (pathname.includes('/analytics') || pathname.includes('/impressions')) return 'adminAnalytics';
      if (pathname.includes('/storage') || pathname.includes('/upload-logs')) return 'adminOperations';
      if (pathname.includes('/cfo') || pathname.includes('/investor') || pathname.includes('/reports')) return 'adminFinancials';
      if (pathname.includes('/advertiser') || pathname.includes('/campaigns')) return 'adminAdvertising';
      return 'adminCustomerSupport'; // default admin section
    }
    if (pathname.startsWith('/crm')) return 'adminCRM';
    return 'main'; // default fallback
  };

  const activeSection = getActiveSectionFromPath(location.pathname);

  // State for collapsible sections - all start collapsed except the active one
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    main: activeSection === 'main',
    settings: activeSection === 'settings',
    seekies: false,
    media: activeSection === 'media',
    monetization: activeSection === 'monetization',
    project_management: activeSection === 'project_management',
    engagement: activeSection === 'engagement',
    admin: false,
    adminCustomerSupport: activeSection === 'adminCustomerSupport',
    adminCRM: activeSection === 'adminCRM',
    adminManagement: activeSection === 'adminManagement',
    adminClientManagement: activeSection === 'adminClientManagement',
    adminAnalytics: activeSection === 'adminAnalytics',
    adminOperations: activeSection === 'adminOperations',
    adminFinancials: activeSection === 'adminFinancials',
    adminAdvertising: activeSection === 'adminAdvertising',
    adminMarketingSales: activeSection === 'adminMarketingSales',
    adminContentManagement: activeSection === 'adminContentManagement',
    advertising: activeSection === 'advertising',
    civic: activeSection === 'civic',
    influencer: activeSection === 'influencer',
    agency: activeSection === 'agency',
    blog: activeSection === 'blog',
  }));

  useEffect(() => {
    if (user) {
      loadUsername();
      checkAdvertiserStatus();
      loadModulePreferences();
      
      // Set up realtime listener for module preferences changes
      const channel = supabase
        .channel('user-preferences-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_preferences',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Reload module preferences when they change
            loadModulePreferences();
          }
        )
        .subscribe();
      
      // Listen for pinned modules changes from ModuleLauncher
      const handlePinnedModulesChange = () => {
        // Add delay to ensure DB update completes
        setTimeout(() => {
          console.log("Sidebar reloading after pinnedModulesChanged event");
          loadModulePreferences();
        }, 500);
      };
      window.addEventListener('pinnedModulesChanged', handlePinnedModulesChange);
      
      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('pinnedModulesChanged', handlePinnedModulesChange);
      };
    }
  }, [user]);

  const loadUsername = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data?.username) {
      setUsername(data.username);
    }
  };

  const loadModulePreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_preferences")
      .select("module_awards_enabled, module_media_enabled, module_civic_enabled, module_influencer_enabled, module_agency_enabled, module_team_chat_enabled, module_monetization_enabled, module_project_management_enabled, module_lead_pixel_enabled, podcasts_enabled, module_blog_enabled, module_events_enabled, module_signup_sheets_enabled, module_polls_enabled, module_qr_codes_enabled, module_marketing_enabled, module_sms_enabled, meetings_enabled, pinned_modules")
      .eq("user_id", user.id)
      .maybeSingle();
    
    console.log("Sidebar loaded preferences:", data);
    
    if (data) {
      setModulePrefs({
        awards: data.module_awards_enabled || false,
        media: data.module_media_enabled || false,
        civic: data.module_civic_enabled || false,
        influencer: data.module_influencer_enabled || false,
        agency: data.module_agency_enabled || false,
        team_chat: (data as any).module_team_chat_enabled || false,
        monetization: (data as any).module_monetization_enabled || false,
        project_management: (data as any).module_project_management_enabled || false,
        lead_pixel: (data as any).module_lead_pixel_enabled || false,
        podcasts: (data as any).podcasts_enabled || false,
        blog: (data as any).module_blog_enabled || false,
        events: (data as any).module_events_enabled || false,
        signup_sheets: (data as any).module_signup_sheets_enabled || false,
        polls: (data as any).module_polls_enabled || false,
        qr_codes: (data as any).module_qr_codes_enabled || false,
        marketing: (data as any).module_marketing_enabled || false,
        sms: (data as any).module_sms_enabled || false,
      });
      
      // Parse pinned_modules safely - default to empty array if nothing is set
      let pinned = Array.isArray(data.pinned_modules) 
        ? data.pinned_modules 
        : [];
      
      console.log("Pinned modules:", pinned);
      setPinnedModules(pinned as string[]);
    }
  };

  // Sync navigationSections when modulePrefs change (module activation/deactivation)
  useEffect(() => {
    setNavigationSections(prevSections => {
      // Get the highest order number from existing sections
      const maxOrder = prevSections.reduce((max, s) => Math.max(max, s.order), 0);
      
      // Add any missing sections from DEFAULT_SECTIONS
      const updatedSections = [...prevSections];
      let nextOrder = maxOrder + 1;
      
      DEFAULT_SECTIONS.forEach(defaultSection => {
        if (!updatedSections.some(s => s.id === defaultSection.id)) {
          updatedSections.push({
            ...defaultSection,
            order: nextOrder++
          });
        }
      });
      
      return updatedSections;
    });
  }, [modulePrefs]);

  const checkAdvertiserStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("advertisers")
      .select("id, status")
      .eq("owner_profile_id", user.id)
      .maybeSingle();
    
    if (data) {
      setIsAdvertiser(true);
      setAdvertiserStatus(data.status);
    }
  };

  if (!user) return null;

  // Dashboard items (always visible at top)
  const dashboardUrl = isAdvertiser ? "/advertiser/dashboard" : "/dashboard";
  
  // Main items (including Dashboard)
  const mainItems = isAdvertiser 
    ? []
    : [
        { title: "Dashboard", url: dashboardUrl, icon: LayoutDashboard },
        ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
        ...(pinnedModules.includes("my_page") ? [{ title: "My Page", url: "/profile/edit", icon: UserIcon }] : []),
        { title: "Profile Settings", url: "/settings", icon: Settings },
      ];

  const seeksiesItems = [
    ...(pinnedModules.includes("meetings") ? [{ title: "Meetings", url: "/meetings", icon: Calendar }] : []),
    ...(pinnedModules.includes("events") && modulePrefs.events ? [{ title: "Events", url: "/events", icon: CalendarDays }] : []),
    ...(pinnedModules.includes("signup_sheets") && modulePrefs.signup_sheets ? [{ title: "Sign-up Sheets", url: "/signup-sheets", icon: ClipboardList }] : []),
    ...(pinnedModules.includes("polls") && modulePrefs.polls ? [{ title: "Polls", url: "/polls", icon: BarChart3 }] : []),
    ...(pinnedModules.includes("awards") && modulePrefs.awards ? [{ title: "Awards", url: "/awards", icon: Trophy }] : []),
    ...(pinnedModules.includes("qr_codes") && modulePrefs.qr_codes ? [{ title: "QR Codes", url: "/qr-codes", icon: QrCode }] : []),
    ...(pinnedModules.includes("civic") && modulePrefs.civic ? [{ title: "Civic Tools", url: "/civic-blog", icon: Building2 }] : []),
    ...(pinnedModules.includes("team_chat") && modulePrefs.team_chat ? [{ title: "Team Chat", url: "/team-chat", icon: MessageSquare }] : []),
  ];

  const blogItems = [
    ...(pinnedModules.includes("blog") && modulePrefs.blog ? [
      { title: "Manage Blog", url: "/my-blog", icon: FileText },
      { title: "Add Post", url: "/blog/create", icon: Plus },
    ] : []),
  ];

  const salesItems = [
    { title: "Sales Dashboard", url: "/sales-dashboard", icon: BarChart3 },
    { title: "Ad Video Library", url: "/sales/ad-library", icon: Clapperboard },
    { title: "Create Campaign", url: "/sales/create-campaign", icon: Plus },
  ];

  const engagementItems = [
    ...(pinnedModules.includes("contacts") ? [
      { title: "Contacts", url: "/crm", icon: Users },
      { title: "Communication History", url: "/communication-history", icon: Mail }
    ] : []),
    ...(pinnedModules.includes("forms") ? [{ title: "Forms", url: "/forms", icon: FileText }] : []),
    ...(modulePrefs.marketing ? [{ title: "Marketing", url: "/marketing", icon: Target }] : []),
    ...(modulePrefs.sms ? [{ title: "SMS", url: "/sms", icon: Smartphone }] : []),
    ...(modulePrefs.team_chat ? [{ title: "Team Chat", url: "/team-chat", icon: MessageSquare }] : []),
    ...(pinnedModules.includes("lead_pixel") && modulePrefs.lead_pixel ? [{ title: "Lead Pixel", url: "/leads-dashboard", icon: Target }] : []),
  ];

  const mediaItems = [
    ...(pinnedModules.includes("media") && modulePrefs.media ? [
      { title: "Master Studio", url: "/studio", icon: Clapperboard },
      { title: "Media Library", url: "/media-library", icon: FileAudio },
      { title: "Create Clips", url: "/create-clips", icon: TrendingUp },
      { title: "Voice Certification", url: "/voice-certification-flow", icon: Shield },
      { title: "Voice Credentials", url: "/voice-credentials", icon: Award },
    ] : []),
    ...(pinnedModules.includes("podcasts") ? [{ title: "Podcasts", url: "/podcasts", icon: Mic }] : []),
  ];

  const creatorMonetizationItems = [
    ...(pinnedModules.includes("monetization") && modulePrefs.monetization ? [
      { title: "Ad Library", url: "/creator/campaign-browser", icon: Target },
      { title: "Create Ad", url: "/podcast-ads", icon: Plus },
      { title: "Revenue", url: "/podcast-revenue", icon: TrendingUp },
    ] : []),
  ];

  const projectManagementItems = [
    ...(pinnedModules.includes("project_management") && modulePrefs.project_management ? [
      { title: "Task Manager", url: "/tasks", icon: ListChecks },
      { title: "Tickets", url: "/tickets", icon: CheckSquare },
      { title: "Proposals", url: "/proposals", icon: FileCheck },
      { title: "Invoices", url: "/invoices", icon: FileText },
    ] : []),
  ];

  const civicItems = [
    { title: "Civic Events", url: "/civic/events", icon: Landmark },
    { title: "Constituent Requests", url: "/civic/requests", icon: FileCheck },
    { title: "Civic Blog", url: "/civic/blog", icon: FileText },
  ];

  const influencerItems = [
    { title: "Campaign Responses", url: "/creator/campaign-responses", icon: Megaphone },
    { title: "Profile Settings", url: "/influencer/profile-settings", icon: UserIcon },
  ];

  const agencyItems = [
    { title: "Influencer Search", url: "/agency/influencer-search", icon: Users },
    { title: "My Campaigns", url: "/agency/campaigns", icon: Building2 },
  ];

  const allSettingsItems = [
    { title: "Team", url: "/team", icon: Contact },
    { title: "Seekies", url: "/integrations", icon: Puzzle },
    { title: "Help Center", url: "/help-center", icon: BookOpen },
    { title: "System Status", url: "/system-status", icon: Activity },
    { title: "Architecture", url: "/seeksy-architecture", icon: Network },
    { title: "Tech Stack", url: "/tech-stack", icon: Code },
  ];

  const adminAccountSettings = [
    { title: "Team", url: "/team", icon: Contact },
    { title: "Seekies", url: "/integrations", icon: Puzzle },
    { title: "System Status", url: "/admin/system-status", icon: Activity },
    { title: "Help Center", url: "/help-center", icon: BookOpen },
    { title: "Architecture", url: "/seeksy-architecture", icon: Network },
    { title: "Tech Stack", url: "/tech-stack", icon: Code },
  ];

  // Advertisers see the same settings items
  const settingsItems = isAdmin ? adminAccountSettings : allSettingsItems;

  const advertiserItems = [
    { title: "Create Ad", url: "/advertiser/campaigns/create-type", icon: Plus },
    { title: "Ad Library", url: "/advertiser/ads", icon: Clapperboard },
    { title: "My Campaigns", url: "/advertiser/campaigns", icon: Building2 },
    { title: "Pricing", url: "/advertiser/pricing", icon: DollarSign },
  ];

  // Admin-only menu items - organized by category
  const adminCustomerSupport = [
    { title: "Tickets & Projects", url: "/tickets", icon: Briefcase },
    { title: "Communication History", url: "/communication-history", icon: Mail },
  ];

  const adminCRM = [
    { title: "Contacts", url: "/crm", icon: Users },
    { title: "Sales Pipeline", url: "/admin/sales", icon: TrendingUp },
  ];

  const adminManagement = [
    { title: "Impersonate User", url: "/admin/impersonate", icon: UserCog },
    { title: "Manage Credits", url: "/admin/credits", icon: Coins },
  ];

  const adminClientManagement = [
    { title: "Creators", url: "/admin/creators", icon: Users },
    { title: "Agency", url: "/admin/agency", icon: Building2 },
  ];

  const adminAnalytics = [
    { title: "Overview", url: "/admin/analytics", icon: BarChart3 },
    { title: "Podcast Analytics", url: "/admin/analytics/podcasts", icon: Mic },
    { title: "Impressions & Listens", url: "/admin/analytics/impressions", icon: Activity },
  ];

  const adminOperations = [
    { title: "Meetings", url: "/meetings", icon: Calendar },
    { title: "Sign-ups", url: "/signup-sheets", icon: ClipboardList },
    { title: "Events", url: "/events", icon: CalendarDays },
  ];

  const adminFinancials = [
    { title: "Financial Overview", url: "/cfo-dashboard", icon: DollarSign },
    { title: "Investor Spreadsheets", url: "/admin/investor-spreadsheets", icon: FileText },
    { title: "Revenue Reports", url: "/admin/revenue-reports", icon: BarChart3 },
    { title: "Billing", url: "/admin/billing", icon: Receipt },
    { title: "Payments", url: "/admin/payments", icon: CreditCard },
  ];

  const adminAdvertising = [
    { title: "Ad Management", url: "/admin/advertising", icon: Megaphone },
    { title: "Campaigns", url: "/admin/ad-campaigns", icon: Target },
    { title: "Advertisers", url: "/admin/advertisers", icon: Building2 },
    { title: "Analytics", url: "/admin/ad-analytics", icon: LineChart },
  ];

  const adminMarketingSales = [
    { title: "Marketing", url: "/marketing", icon: Mail },
    { title: "Newsletter", url: "/newsletter", icon: Mail },
    { title: "App Audio", url: "/marketing/app-audio", icon: Volume2 },
    { title: "Lead Pixel", url: "/leads-dashboard", icon: Code },
  ];

  const adminContentManagement = [
    { title: "Persona Management", url: "/admin/personas", icon: Sparkles },
    { title: "Voice Tag & Certification", url: "/admin/voice-tag-certification", icon: Shield },
    { title: "Voice Certification", url: "/voice-certification-flow", icon: Award },
    { title: "Voice Credentials", url: "/admin/voice-credentials", icon: Shield },
    { title: "Screenshot Generator", url: "/admin/screenshot-generator", icon: Camera },
  ];

  // Grey out items for pending advertisers
  const isPending = advertiserStatus === "pending";

  const handleSectionsSave = (sections: NavigationSection[]) => {
    setNavigationSections(sections);
    localStorage.setItem("navigation-sections", JSON.stringify(sections));
    toast({
      title: "Navigation Updated",
      description: "Your section order has been saved.",
      duration: 2000,
    });
  };

  const togglePin = async (moduleKey: string) => {
    if (!user) return;

    const newPinned = pinnedModules.includes(moduleKey)
      ? pinnedModules.filter(k => k !== moduleKey)
      : [...pinnedModules, moduleKey];

    const { error } = await supabase
      .from("user_preferences")
      .update({ pinned_modules: newPinned })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update pinned Seeky",
        variant: "destructive",
      });
      return;
    }

    setPinnedModules(newPinned);
    toast({
      title: pinnedModules.includes(moduleKey) ? "Unpinned" : "Pinned",
      description: `Seeky ${pinnedModules.includes(moduleKey) ? "removed from" : "added to"} sidebar`,
    });

    // Trigger ModuleLauncher refresh
    window.dispatchEvent(new Event("pinnedModulesChanged"));
  };

  // Filter sections based on user role
  const getVisibleSections = () => {
    let sections = [...navigationSections];
    
    // Admin accounts see only admin section
    if (isAdmin) {
      return [{ id: "admin", label: "Admin", order: 0 }];
    }
    
    // Non-admins never see admin section
    sections = sections.filter(s => s.id !== 'admin');
    
    if (isAdvertiser) {
      // Advertisers MUST see: settings, advertising
      const settingsSection = sections.find(s => s.id === "settings") || { id: "settings", label: "Settings", order: 3 };
      const adSection = sections.find(s => s.id === "advertising");
      const mainSection = sections.find(s => s.id === "main");
      
      const visible = [settingsSection];
      if (mainSection) visible.push(mainSection);
      if (adSection) visible.push(adSection);
      
      return visible;
    }
    
    // Regular creators - filter based on activated modules
    // Always show: main, seekies, engagement, settings
    const alwaysVisible = ["main", "seekies", "engagement", "settings"];
    
    // Filter sections based on module preferences
    const visible = sections.filter(section => {
      // Always show base sections
      if (alwaysVisible.includes(section.id)) return true;
      
      // Show optional modules only if enabled
      if (section.id === "media") return modulePrefs.media;
      if (section.id === "monetization") return modulePrefs.monetization;
      if (section.id === "project_management") return modulePrefs.project_management;
      if (section.id === "civic") return modulePrefs.civic;
      if (section.id === "influencer") return modulePrefs.influencer;
      if (section.id === "agency") return modulePrefs.agency;
      if (section.id === "blog") return modulePrefs.blog;
      
      return false;
    });
    
    // Absolutely ensure Settings is present as first priority
    if (!visible.some(s => s.id === "settings")) {
      visible.unshift({ id: "settings", label: "Settings", order: 3 });
    }
    
    return visible;
  };

  // Section rendering functions
  const renderMainSection = () => {
    if (isAdvertiser || mainItems.length === 0) return null;
    
    return (
      <Collapsible
        key="main"
        open={openSections.main}
        onOpenChange={(open) => setOpenSections({ ...openSections, main: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Main</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.main ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <SidebarMenuButton asChild>
                             <NavLink 
                              to={item.url} 
                              end 
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };


  const renderAdvertisingSection = () => {
    if (!isAdvertiser || advertiserStatus !== "approved") return null;
    return (
      <Collapsible
        key="advertising"
        open={openSections.advertising}
        onOpenChange={(open) => setOpenSections({ ...openSections, advertising: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Advertising</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.advertising ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {advertiserItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild disabled={isPending}>
                            <NavLink 
                              to={isPending ? "#" : item.url} 
                              end
                              className={`hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderSeeksiesSection = () => {
    if (isAdvertiser) return null;
    
    // Don't render if no items to show
    if (seeksiesItems.length === 0) return null;
    
    // Map item titles to module keys
    const getModuleKey = (title: string): string => {
      const keyMap: Record<string, string> = {
        "Meetings": "meetings",
        "Events": "events",
        "Sign-up Sheets": "signup_sheets",
        "Polls": "polls",
        "Awards": "awards",
        "QR Codes": "qr_codes",
        "Contacts": "contacts",
        "Podcasts": "podcasts",
        "Media Library": "media",
        "Civic Tools": "civic",
        "Team Chat": "team_chat",
        "Marketing": "marketing",
        "SMS": "sms",
      };
      return keyMap[title] || title.toLowerCase();
    };
    
    return (
      <Collapsible
        key="seekies"
        open={openSections.seekies}
        onOpenChange={(open) => setOpenSections({ ...openSections, seekies: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Seekies</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.seekies ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {seeksiesItems.map((item) => {
                  const moduleKey = getModuleKey(item.title);
                  const isPinned = pinnedModules.includes(moduleKey);
                  const isActive = location.pathname === item.url;
                  
                  return (
                    <SidebarMenuItem key={item.title} className="group/item relative">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center w-full">
                              <SidebarMenuButton asChild className="flex-1 pr-8">
                                <NavLink
                                  to={item.url}
                                  end
                                  className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                                  activeClassName="bg-accent text-accent-foreground font-medium"
                                >
                                  <item.icon className="h-4 w-4" />
                                  {!collapsed && <span>{item.title}</span>}
                                </NavLink>
                              </SidebarMenuButton>
                              {!collapsed && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    togglePin(moduleKey);
                                  }}
                                  className={`absolute right-2 p-1 hover:bg-background/80 rounded transition-opacity ${
                                    isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                                  }`}
                                  aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                                >
                                  <Pin
                                    className={`h-3.5 w-3.5 ${
                                      isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderEngagementSection = () => {
    if (isAdvertiser || engagementItems.length === 0) return null;
    
    // Check if Engagement section is pinned (based on whether any child is pinned)
    const isPinned = pinnedModules.includes("contacts") || 
                     pinnedModules.includes("marketing") || 
                     pinnedModules.includes("sms") || 
                     pinnedModules.includes("team_chat");
    
    // Map engagement items to their module keys for pin functionality
    const engagementModuleMap: Record<string, string> = {
      "Contacts": "contacts",
      "Email": "marketing",
      "SMS": "sms",
      "Team Chat": "team_chat"
    };
    
    return (
      <Collapsible
        key="engagement"
        open={openSections.engagement}
        onOpenChange={(open) => setOpenSections({ ...openSections, engagement: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5 relative group">
              <span>Engagement</span>
              <div className="flex items-center gap-1">
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin("engagement");
                    }}
                    className="p-1 opacity-100 hover:bg-accent rounded transition-colors"
                    aria-label={isPinned ? "Unpin Engagement" : "Pin Engagement"}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${
                        isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                )}
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.engagement ? '' : '-rotate-90'}`} />}
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {engagementItems.map((item) => {
                  const isActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                  
                  return (
                    <SidebarMenuItem key={item.title} className="group/item relative">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className="flex-1">
                              <NavLink
                                to={item.url}
                                end
                                className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                                activeClassName="bg-accent text-accent-foreground font-medium"
                              >
                                <item.icon className="h-4 w-4" />
                                {!collapsed && <span>{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderMediaSection = () => {
    if (isAdvertiser || !modulePrefs.media || mediaItems.length === 0 || isAdmin) return null;
    const isPinned = pinnedModules.includes("media");
    
    return (
      <Collapsible
        key="media"
        open={openSections.media}
        onOpenChange={(open) => setOpenSections({ ...openSections, media: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5 relative group">
              <span>Media</span>
              <div className="flex items-center gap-1">
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin("media");
                    }}
                    className="p-1 opacity-100 hover:bg-accent rounded transition-colors"
                    aria-label={isPinned ? "Unpin Media" : "Pin Media"}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${
                        isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                )}
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.media ? '' : '-rotate-90'}`} />}
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {mediaItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderMonetizationSection = () => {
    if (isAdvertiser || !modulePrefs.monetization || creatorMonetizationItems.length === 0) return null;
    return (
      <Collapsible
        key="monetization"
        open={openSections.monetization}
        onOpenChange={(open) => setOpenSections({ ...openSections, monetization: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Monetization</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.monetization ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {creatorMonetizationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderProjectManagementSection = () => {
    if (isAdvertiser || !modulePrefs.project_management || projectManagementItems.length === 0) return null;
    const isPinned = pinnedModules.includes("project_management");
    
    return (
      <Collapsible
        key="project_management"
        open={openSections.project_management}
        onOpenChange={(open) => setOpenSections({ ...openSections, project_management: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5 relative group">
              <span>Project Management</span>
              <div className="flex items-center gap-1">
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin("project_management");
                    }}
                    className="p-1 opacity-100 hover:bg-accent rounded transition-colors"
                    aria-label={isPinned ? "Unpin Project Management" : "Pin Project Management"}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${
                        isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                )}
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.project_management ? '' : '-rotate-90'}`} />}
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {projectManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderCivicSection = () => {
    // Hide for advertisers, demo influencer, or if module is deactivated
    if (isAdvertiser || username === 'DemoInfluencer' || !modulePrefs.civic) return null;
    return (
      <Collapsible
        key="civic"
        open={openSections.civic}
        onOpenChange={(open) => setOpenSections({ ...openSections, civic: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Civic</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.civic ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {civicItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderInfluencerSection = () => {
    // Hide for advertisers or if module is deactivated
    if (isAdvertiser || !modulePrefs.influencer) return null;
    return (
      <Collapsible
        key="influencer"
        open={openSections.influencer}
        onOpenChange={(open) => setOpenSections({ ...openSections, influencer: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Influencer</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.influencer ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {influencerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderAgencySection = () => {
    // Hide for advertisers, demo influencer, or if module is deactivated
    if (isAdvertiser || username === 'DemoInfluencer' || !modulePrefs.agency) return null;
    return (
      <Collapsible
        key="agency"
        open={openSections.agency}
        onOpenChange={(open) => setOpenSections({ ...openSections, agency: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Agency</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.agency ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {agencyItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderBlogSection = () => {
    // Hide for advertisers or if module is deactivated
    if (isAdvertiser || !modulePrefs.blog || blogItems.length === 0) return null;
    return (
      <Collapsible
        key="blog"
        open={openSections.blog}
        onOpenChange={(open) => setOpenSections({ ...openSections, blog: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Blog</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.blog ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {blogItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const renderSettingsSection = () => (
    <Collapsible
      key="settings"
      open={openSections.settings}
      onOpenChange={(open) => setOpenSections({ ...openSections, settings: open })}
    >
      <SidebarGroup className="py-0 mt-3 pt-3 border-t-2 border-primary/30">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="text-base font-bold cursor-pointer flex items-center justify-between mb-0 py-1.5">
            <span>Account Settings</span>
            {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.settings ? '' : '-rotate-90'}`} />}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-4"
                            activeClassName="bg-accent text-accent-foreground font-medium"
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );

  const renderAdminSection = () => {
    if (!isAdmin) return null;

    const renderAdminCategory = (title: string, items: typeof adminCustomerSupport, sectionKey: string) => {
      const isOpen = openSections[sectionKey as keyof typeof openSections] !== false;
      
      return (
        <Collapsible
          key={sectionKey}
          open={isOpen}
          onOpenChange={(open) => setOpenSections({ ...openSections, [sectionKey]: open })}
        >
          <SidebarGroup className="py-0">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-sm font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5 text-muted-foreground">
                <span>{title}</span>
                {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0">
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton asChild>
                              <NavLink 
                                to={item.url} 
                                end 
                                className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 pl-6"
                                activeClassName="bg-accent text-accent-foreground font-medium"
                              >
                                <item.icon className="h-4 w-4" />
                                {!collapsed && <span>{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      );
    };
    
    return (
      <>
        {/* Admin Dashboard Link */}
        <SidebarGroup className="py-0 pb-2">
          <SidebarMenu className="space-y-0">
            <SidebarMenuItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin" 
                        end 
                        className="hover:bg-accent hover:text-accent-foreground text-base font-bold py-2 h-10"
                        activeClassName="bg-accent text-accent-foreground"
                      >
                        <Shield className="h-5 w-5" />
                        {!collapsed && <span>Admin Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>Admin Dashboard</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin Categories */}
        {renderAdminCategory("Customer Support", adminCustomerSupport, "adminCustomerSupport")}
        {renderAdminCategory("CRM", adminCRM, "adminCRM")}
        {renderAdminCategory("Management", adminManagement, "adminManagement")}
        {renderAdminCategory("Client Management", adminClientManagement, "adminClientManagement")}
        {renderAdminCategory("Analytics", adminAnalytics, "adminAnalytics")}
        {renderAdminCategory("Operations", adminOperations, "adminOperations")}
        {renderAdminCategory("Financials", adminFinancials, "adminFinancials")}
        {renderAdminCategory("Advertising", adminAdvertising, "adminAdvertising")}
        {renderAdminCategory("Marketing & Sales", adminMarketingSales, "adminMarketingSales")}
        {renderAdminCategory("Content Management", adminContentManagement, "adminContentManagement")}
      </>
    );
  };

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    main: renderMainSection,
    settings: renderSettingsSection,
    advertising: renderAdvertisingSection,
    seekies: renderSeeksiesSection,
    media: renderMediaSection,
    monetization: renderMonetizationSection,
    project_management: renderProjectManagementSection,
    engagement: renderEngagementSection,
    civic: renderCivicSection,
    influencer: renderInfluencerSection,
    agency: renderAgencySection,
    blog: renderBlogSection,
    admin: renderAdminSection,
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/tasks" className="relative">
              <img src={seeksyLogo} alt="Seeksy" className="h-10 w-10" />
              {/* Thanksgiving decoration */}
              {new Date().getMonth() === 10 && (
                <span className="absolute -top-1 -right-1 text-xl drop-shadow-md">🦃</span>
              )}
              {/* Christmas decoration */}
              {new Date().getMonth() === 11 && (
                <span className="absolute -top-2 -right-2 text-xl drop-shadow-md">🎄</span>
              )}
            </Link>
            {!collapsed && (
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <NavigationCustomizer 
                          sections={getVisibleSections()}
                          onSave={handleSectionsSave}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Customize Sidebar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setModuleLauncherOpen(true)}
                        className="relative group cursor-pointer hover:opacity-80 transition-opacity"
                        aria-label="Open Active Apps"
                      >
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="5" fill="hsl(207, 90%, 65%)" />
                          <circle cx="24" cy="10" r="5" fill="hsl(280, 65%, 70%)" />
                          <circle cx="38" cy="10" r="5" fill="hsl(25, 90%, 65%)" />
                          <circle cx="10" cy="24" r="5" fill="hsl(150, 65%, 60%)" />
                          <circle cx="24" cy="24" r="5" fill="hsl(45, 90%, 65%)" />
                          <circle cx="38" cy="24" r="5" fill="hsl(240, 65%, 70%)" />
                          <circle cx="10" cy="38" r="5" fill="hsl(330, 75%, 70%)" />
                          <circle cx="24" cy="38" r="5" fill="hsl(180, 65%, 60%)" />
                          <circle cx="38" cy="38" r="5" fill="hsl(0, 75%, 65%)" />
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apps</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </SidebarHeader>

      <SidebarContent className="pb-6 overflow-hidden">
        {isAdmin ? (
          // Admin View: Show admin sidebar only
          <div className="overflow-y-auto">
            {getVisibleSections()
              .filter(section => section.id !== 'settings')
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                const renderer = sectionRenderers[section.id];
                return renderer ? renderer() : null;
              })}
            {renderSettingsSection()}
          </div>
        ) : currentRole === 'advertiser' ? (
          // Advertiser View: Show advertiser-specific sidebar
          <AdvertiserSidebarNav />
        ) : (
          // Creator View: Show creator sidebar
          <div className="overflow-y-auto">
            {getVisibleSections()
              .filter(section => section.id !== 'settings')
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                const renderer = sectionRenderers[section.id];
                return renderer ? renderer() : null;
              })}
            {renderSettingsSection()}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {/* Footer can remain for any future global actions */}
      </SidebarFooter>
    </Sidebar>
    
    <ModuleLauncher open={moduleLauncherOpen} onOpenChange={setModuleLauncherOpen} />
    </>
  );
}
