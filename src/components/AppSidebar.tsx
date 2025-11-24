import { Link } from "react-router-dom";
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
  Grid3x3
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import seeksyLogo from "@/assets/seeksy-logo.png";
import { ModuleLauncher } from "@/components/ModuleLauncher";
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
  { id: "rss_podcast", label: "RSS Podcast Hosting", order: 12 },
  { id: "blog", label: "Blog", order: 13 },
];

export function AppSidebar({ user, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const [advertiserStatus, setAdvertiserStatus] = useState<string | null>(null);
  const [moduleLauncherOpen, setModuleLauncherOpen] = useState(false);
  const [modulePrefs, setModulePrefs] = useState({
    awards: false,
    media: false,
    civic: false,
    influencer: false,
    agency: false,
    team_chat: false,
    monetization: false,
    project_management: false,
    rss_podcast: false,
    blog: false,
    events: false,
    signup_sheets: false,
    polls: false,
    qr_codes: false,
    marketing: false,
    sms: false,
  });
  const [pinnedModules, setPinnedModules] = useState<string[]>(["meetings"]);
  
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
    
    // Ensure RSS Podcast exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "rss_podcast")) {
      sections.push({ id: "rss_podcast", label: "RSS Podcast Hosting", order: 12 });
    }
    
    // Ensure Blog exists (migration for users with old nav data)
    if (!sections.some((s: NavigationSection) => s.id === "blog")) {
      sections.push({ id: "blog", label: "Blog", order: 13 });
    }
    
    return sections;
  });
  
  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    main: true,
    settings: true,
    seekies: true,
    media: true,
    monetization: true,
    project_management: true,
    engagement: true,
    admin: false,
    advertising: true,
    civic: true,
    influencer: true,
    agency: true,
    rss_podcast: true,
    blog: true,
  });

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
        loadModulePreferences();
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
      .select("module_awards_enabled, module_media_enabled, module_civic_enabled, module_influencer_enabled, module_agency_enabled, module_team_chat_enabled, module_monetization_enabled, module_project_management_enabled, module_rss_podcast_posting_enabled, module_blog_enabled, module_events_enabled, module_signup_sheets_enabled, module_polls_enabled, module_qr_codes_enabled, module_marketing_enabled, module_sms_enabled, pinned_modules")
      .eq("user_id", user.id)
      .maybeSingle();
    
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
        rss_podcast: (data as any).module_rss_podcast_posting_enabled || false,
        blog: (data as any).module_blog_enabled || false,
        events: (data as any).module_events_enabled || false,
        signup_sheets: (data as any).module_signup_sheets_enabled || false,
        polls: (data as any).module_polls_enabled || false,
        qr_codes: (data as any).module_qr_codes_enabled || false,
        marketing: (data as any).module_marketing_enabled || false,
        sms: (data as any).module_sms_enabled || false,
      });
      
      // Parse pinned_modules safely
      const pinned = Array.isArray(data.pinned_modules) 
        ? data.pinned_modules 
        : ["meetings"];
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
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setIsAdvertiser(true);
      setAdvertiserStatus(data.status);
    }
  };

  if (!user) return null;

  // Dashboard items (always visible at top)
  const dashboardUrl = isAdvertiser ? "/advertiser/dashboard" : "/dashboard";
  
  // Main items (without Dashboard)
  const mainItems = isAdvertiser 
    ? []
    : [
        ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
        { title: "My Page", url: `/${username || 'profile'}`, icon: UserIcon },
        { title: "AI Assistant", url: "/ai-assistant", icon: Sparkles },
      ];

  const seeksiesItems = [
    ...(pinnedModules.includes("meetings") ? [{ title: "Meetings", url: "/meetings", icon: Calendar }] : []),
    ...(pinnedModules.includes("events") && modulePrefs.events ? [{ title: "Events", url: "/events", icon: CalendarDays }] : []),
    ...(pinnedModules.includes("signup_sheets") && modulePrefs.signup_sheets ? [{ title: "Sign-up Sheets", url: "/signup-sheets", icon: ClipboardList }] : []),
    ...(pinnedModules.includes("polls") && modulePrefs.polls ? [{ title: "Polls", url: "/polls", icon: BarChart3 }] : []),
    ...(pinnedModules.includes("awards") && modulePrefs.awards ? [{ title: "Awards", url: "/awards", icon: Trophy }] : []),
    ...(pinnedModules.includes("qr_codes") && modulePrefs.qr_codes ? [{ title: "QR Codes", url: "/qr-codes", icon: QrCode }] : []),
    ...(pinnedModules.includes("contacts") ? [{ title: "Contacts", url: "/contacts", icon: Users }] : []),
    ...(pinnedModules.includes("podcasts") ? [{ title: "Podcasts", url: "/podcasts", icon: Mic }] : []),
    ...(pinnedModules.includes("media") && modulePrefs.media ? [{ title: "Media Library", url: "/media-library", icon: Clapperboard }] : []),
    ...(pinnedModules.includes("civic") && modulePrefs.civic ? [{ title: "Civic Tools", url: "/civic-blog", icon: Building2 }] : []),
    ...(pinnedModules.includes("team_chat") && modulePrefs.team_chat ? [{ title: "Team Chat", url: "/team-chat", icon: MessageSquare }] : []),
    ...(pinnedModules.includes("marketing") && modulePrefs.marketing ? [{ title: "Marketing", url: "/crm", icon: Mail }] : []),
    ...(pinnedModules.includes("sms") && modulePrefs.sms ? [{ title: "SMS", url: "/sms", icon: Smartphone }] : []),
  ];

  const rssPodcastItems = [
    { title: "Manage RSS Feeds", url: "/podcasts", icon: Mic },
  ];

  const blogItems = [
    { title: "Manage Blog", url: "/my-blog", icon: FileText },
    { title: "Add Post", url: "/blog/create", icon: Plus },
  ];

  const mediaItems = [
    { title: "Studio", url: "/studio", icon: Clapperboard },
    { title: "Media Library", url: "/media-library", icon: FileAudio },
    { title: "Create Clips", url: "/create-clips", icon: TrendingUp },
  ];

  const salesItems = [
    { title: "Sales Dashboard", url: "/sales-dashboard", icon: BarChart3 },
    { title: "Ad Video Library", url: "/sales/ad-library", icon: Clapperboard },
    { title: "Create Campaign", url: "/sales/create-campaign", icon: Plus },
  ];

  const creatorMonetizationItems = [
    { title: "Ad Library", url: "/creator/campaign-browser", icon: Target },
    { title: "Create Ad", url: "/podcast-ads", icon: Plus },
    { title: "Revenue", url: "/podcast-revenue", icon: TrendingUp },
  ];

  const projectManagementItems = [
    { title: "Task Manager", url: "/tasks", icon: ListChecks },
    { title: "Tickets", url: "/tickets", icon: CheckSquare },
    { title: "Proposals", url: "/proposals", icon: FileCheck },
    { title: "Invoices", url: "/invoices", icon: FileText },
  ];

  const engagementItems = [
    { title: "Contacts", url: "/crm", icon: Users },
    { title: "Email", url: "/email-history", icon: Mail },
    ...(modulePrefs.marketing ? [{ title: "Marketing", url: "/crm", icon: Send }] : []),
    ...(modulePrefs.sms ? [{ title: "SMS", url: "/sms", icon: Smartphone }] : []),
    ...(modulePrefs.team_chat ? [{ title: "Team Chat", url: "/team-chat", icon: MessageSquare }] : []),
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
    { title: "Profile Settings", url: "/settings", icon: Settings },
    { title: "Team", url: "/team", icon: Contact },
    { title: "Integrations", url: "/integrations", icon: Puzzle },
    { title: "System Status", url: "/system-status", icon: Activity },
    { title: "Architecture", url: "/seeksy-architecture", icon: Network },
    { title: "Tech Stack", url: "/tech-stack", icon: Code },
  ];

  // Advertisers see the same settings items
  const settingsItems = allSettingsItems;

  const advertiserItems = [
    { title: "Create Ad", url: "/advertiser/campaigns/create-type", icon: Plus },
    { title: "Ad Library", url: "/advertiser/ads", icon: Clapperboard },
    { title: "My Campaigns", url: "/advertiser/campaigns", icon: Building2 },
    { title: "Pricing", url: "/advertiser/pricing", icon: DollarSign },
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

  // Filter sections based on user role
  const getVisibleSections = () => {
    let sections = [...navigationSections];
    
    if (isAdmin) {
      // Admins see all sections - Settings guaranteed to be in navigationSections
      return sections;
    }
    
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
      if (section.id === "rss_podcast") return modulePrefs.rss_podcast;
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
                              className={`hover:bg-accent hover:text-accent-foreground text-sm py-0.5 h-8 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                {seeksiesItems.map((item) => (
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

  const renderMediaSection = () => {
    if (isAdvertiser || !modulePrefs.media) return null;
    return (
      <Collapsible
        key="media"
        open={openSections.media}
        onOpenChange={(open) => setOpenSections({ ...openSections, media: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Media</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.media ? '' : '-rotate-90'}`} />}
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

  const renderMonetizationSection = () => {
    if (isAdvertiser || !modulePrefs.monetization) return null;
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

  const renderProjectManagementSection = () => {
    if (isAdvertiser || !modulePrefs.project_management) return null;
    return (
      <Collapsible
        key="project_management"
        open={openSections.project_management}
        onOpenChange={(open) => setOpenSections({ ...openSections, project_management: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Project Management</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.project_management ? '' : '-rotate-90'}`} />}
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

  const renderEngagementSection = () => {
    if (isAdvertiser) return null;
    return (
      <Collapsible
        key="engagement"
        open={openSections.engagement}
        onOpenChange={(open) => setOpenSections({ ...openSections, engagement: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>Engagement</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.engagement ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {engagementItems.map((item) => (
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

  const renderRssPodcastSection = () => {
    // Hide for advertisers or if module is deactivated
    if (isAdvertiser || !modulePrefs.rss_podcast) return null;
    return (
      <Collapsible
        key="rss_podcast"
        open={openSections.rss_podcast}
        onOpenChange={(open) => setOpenSections({ ...openSections, rss_podcast: open })}
      >
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-base font-semibold cursor-pointer flex items-center justify-between mb-0 py-1.5">
              <span>RSS Podcast Hosting</span>
              {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections.rss_podcast ? '' : '-rotate-90'}`} />}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                {rssPodcastItems.map((item) => (
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

  const renderBlogSection = () => {
    // Hide for advertisers or if module is deactivated
    if (isAdvertiser || !modulePrefs.blog) return null;
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
    rss_podcast: renderRssPodcastSection,
    blog: renderBlogSection,
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/tasks">
              <img src={seeksyLogo} alt="Seeksy" className="h-10 w-10" />
            </Link>
            {!collapsed && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        </SidebarHeader>

      <SidebarContent className="pb-6 overflow-hidden">
        {/* Dashboard - Always visible and sticky at top */}
        <div className="sticky top-0 bg-sidebar z-50 border-b border-border/50 shadow-sm">
          <SidebarMenu className="px-2 py-2">
            <SidebarMenuItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={dashboardUrl} 
                        end
                        className="hover:bg-accent hover:text-accent-foreground text-sm py-0.5"
                        activeClassName="bg-accent text-accent-foreground font-semibold"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {!collapsed && <span className="text-foreground">Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>Dashboard</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Scrollable navigation sections */}
        <div className="overflow-y-auto">
          {/* Other navigation sections (excluding settings) */}
          {getVisibleSections()
            .filter(section => section.id !== 'settings')
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              const renderer = sectionRenderers[section.id];
              return renderer ? renderer() : null;
            })}

          {/* Settings section - Always rendered at bottom */}
          {renderSettingsSection()}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {/* Footer can remain for any future global actions */}
      </SidebarFooter>
    </Sidebar>
    
    <ModuleLauncher open={moduleLauncherOpen} onOpenChange={setModuleLauncherOpen} />
    </>
  );
}
