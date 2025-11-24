import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Trophy, Clapperboard, Landmark, User as UserIcon, Building2, Instagram, Facebook, Linkedin, Twitter, Youtube, Music, CheckSquare, DollarSign, TrendingUp, CreditCard, Wallet, Info, Edit2, MessageSquare, FileText, Rss, CalendarDays, ClipboardList, BarChart3, QrCode, Mail, Smartphone, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IntegrationCard } from "@/components/IntegrationCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

type ModuleStatus = {
  [key: string]: boolean;
};

const Integrations = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modules, setModules] = useState<ModuleStatus>({
    awards: false,
    media: false,
    civic: false,
    influencer: false,
    agency: false,
    project_management: false,
    monetization: false,
    team_chat: false,
    blog: false,
    rss_podcast_posting: false,
    my_page: false,
    advertiser: false,
    events: false,
    signup_sheets: false,
    polls: false,
    qr_codes: false,
    marketing: false,
    sms: false,
  });
  const [socialConnections, setSocialConnections] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string; tooltip: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrationMetadata } = useQuery({
    queryKey: ["integration-metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_metadata")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadModulesAndConnections(session.user.id);
      await checkAdminStatus(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin"]);
    
    setIsAdmin((data?.length || 0) > 0);
  };

  const loadModulesAndConnections = async (userId: string) => {
    try {
      // Load module preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (prefs) {
        setModules({
          awards: prefs.module_awards_enabled || false,
          media: prefs.module_media_enabled || false,
          civic: prefs.module_civic_enabled || false,
          influencer: prefs.module_influencer_enabled || false,
          agency: prefs.module_agency_enabled || false,
          project_management: prefs.module_project_management_enabled || false,
          monetization: prefs.module_monetization_enabled || false,
          team_chat: (prefs as any).module_team_chat_enabled || false,
          blog: (prefs as any).module_blog_enabled || false,
          rss_podcast_posting: (prefs as any).module_rss_podcast_posting_enabled || false,
          my_page: (prefs as any).my_page_enabled !== false,
          advertiser: (prefs as any).module_advertiser_enabled || false,
          events: (prefs as any).module_events_enabled || false,
          signup_sheets: (prefs as any).module_signup_sheets_enabled || false,
          polls: (prefs as any).module_polls_enabled || false,
          qr_codes: (prefs as any).module_qr_codes_enabled || false,
          marketing: (prefs as any).module_marketing_enabled || false,
          sms: (prefs as any).module_sms_enabled || false,
        });
      }

      // Load social media connections
      const { data: connections } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setSocialConnections(connections || []);
    } catch (error: any) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleName: keyof ModuleStatus) => {
    if (!user) return;

    const newValue = !modules[moduleName];
    setModules({ ...modules, [moduleName]: newValue });

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          [`module_${moduleName}_enabled`]: newValue,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: newValue ? "Module Activated" : "Module Deactivated",
        description: `${String(moduleName).charAt(0).toUpperCase() + String(moduleName).slice(1)} module has been ${newValue ? 'activated' : 'deactivated'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating module",
        description: error.message,
        variant: "destructive",
      });
      // Revert on error
      setModules({ ...modules, [moduleName]: !newValue });
    }
  };

  const handleDisconnectSocial = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_media_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      setSocialConnections(socialConnections.filter(c => c.id !== accountId));
      
      toast({
        title: "Account disconnected",
        description: "Social media account has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Error disconnecting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditMetadata = (moduleId: string) => {
    const metadata = integrationMetadata?.find(m => m.id === moduleId);
    if (metadata) {
      setEditingModule({
        id: metadata.id,
        title: metadata.title,
        description: metadata.description,
        tooltip: metadata.tooltip_text || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveMetadata = async () => {
    if (!editingModule) return;

    try {
      const { error } = await supabase
        .from("integration_metadata")
        .update({
          title: editingModule.title,
          description: editingModule.description,
          tooltip_text: editingModule.tooltip,
        })
        .eq("id", editingModule.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["integration-metadata"] });
      
      toast({
        title: "Metadata updated",
        description: "Integration information has been updated.",
      });
      
      setEditDialogOpen(false);
      setEditingModule(null);
    } catch (error: any) {
      toast({
        title: "Error updating metadata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMetadata = (moduleId: string) => {
    return integrationMetadata?.find(m => m.id === moduleId);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: any } = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
      twitter: Twitter,
      youtube: Youtube,
      tiktok: TrendingUp,
    };
    return icons[platform.toLowerCase()] || UserIcon;
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      instagram: "from-pink-500 to-purple-600",
      facebook: "from-blue-600 to-blue-700",
      linkedin: "from-blue-500 to-blue-600",
      twitter: "from-blue-400 to-blue-500",
      youtube: "from-red-500 to-red-600",
      tiktok: "from-black to-gray-800",
    };
    return colors[platform.toLowerCase()] || "from-gray-500 to-gray-600";
  };

  const matchesSearch = (title: string, description: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedConnections = socialConnections.reduce((acc: any, conn: any) => {
    if (!acc[conn.platform]) {
      acc[conn.platform] = [];
    }
    acc[conn.platform].push(conn);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Apps</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Apps</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Connect your tools and activate apps
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-12">
          {/* Free by Seeksy Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              FREE BY SEEKSY
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchesSearch('Awards', 'Create and manage award programs with voting, sponsorships, and live ceremony streaming.') && (
                <IntegrationCard
                  id="awards"
                  icon={Trophy}
                  iconGradient="from-yellow-500 to-orange-600"
                  title={getMetadata('awards')?.title || 'Awards'}
                  description={getMetadata('awards')?.description || 'Create and manage award programs with voting, sponsorships, and live ceremony streaming.'}
                  tooltip={getMetadata('awards')?.tooltip_text}
                  isActive={modules.awards}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('awards')}
                  onEdit={() => handleEditMetadata('awards')}
                />
              )}
              
              {matchesSearch('Media', 'Complete content creation suite with podcasts, blogs, live studio, and media library with AI-powered editing.') && (
                <IntegrationCard
                  id="media"
                  icon={Clapperboard}
                  iconGradient="from-purple-500 to-pink-600"
                  title={getMetadata('media')?.title || 'Media'}
                  description={getMetadata('media')?.description || 'Complete content creation suite with podcasts, blogs, live studio, and media library with AI-powered editing.'}
                  tooltip={getMetadata('media')?.tooltip_text}
                  isActive={modules.media}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('media')}
                  onEdit={() => handleEditMetadata('media')}
                />
              )}

              {matchesSearch('Civic', 'Platform for elected officials and public offices. Manage civic events, constituent requests, and transparency reports.') && (
                <IntegrationCard
                  id="civic"
                  icon={Landmark}
                  iconGradient="from-blue-500 to-cyan-600"
                  title={getMetadata('civic')?.title || 'Civic'}
                  description={getMetadata('civic')?.description || 'Platform for elected officials and public offices. Manage civic events, constituent requests, and transparency reports.'}
                  tooltip={getMetadata('civic')?.tooltip_text}
                  isActive={modules.civic}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('civic')}
                  onEdit={() => handleEditMetadata('civic')}
                />
              )}

              {matchesSearch('Influencer', 'Build your influencer profile, showcase your portfolio, connect with brands, and manage campaign responses.') && (
                <IntegrationCard
                  id="influencer"
                  icon={UserIcon}
                  iconGradient="from-green-500 to-emerald-600"
                  title={getMetadata('influencer')?.title || 'Influencer'}
                  description={getMetadata('influencer')?.description || 'Build your influencer profile, showcase your portfolio, connect with brands, and manage campaign responses.'}
                  tooltip={getMetadata('influencer')?.tooltip_text}
                  isActive={modules.influencer}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('influencer')}
                  onEdit={() => handleEditMetadata('influencer')}
                />
              )}

              {matchesSearch('Agency', 'Search and discover influencers, manage multi-channel campaigns, track performance metrics, and build creator partnerships.') && (
                <IntegrationCard
                  id="agency"
                  icon={Building2}
                  iconGradient="from-indigo-500 to-purple-600"
                  title={getMetadata('agency')?.title || 'Agency'}
                  description={getMetadata('agency')?.description || 'Search and discover influencers, manage multi-channel campaigns, track performance metrics, and build creator partnerships.'}
                  tooltip={getMetadata('agency')?.tooltip_text}
                  isActive={modules.agency}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('agency')}
                  onEdit={() => handleEditMetadata('agency')}
                />
              )}

              {matchesSearch('Project Management', 'Manage tasks, tickets, proposals, and invoices all in one place.') && (
                <IntegrationCard
                  id="project_management"
                  icon={CheckSquare}
                  iconGradient="from-slate-500 to-slate-600"
                  title={getMetadata('project_management')?.title || 'Project Management'}
                  description={getMetadata('project_management')?.description || 'Manage tasks, tickets, proposals, and invoices all in one place.'}
                  tooltip={getMetadata('project_management')?.tooltip_text}
                  isActive={modules.project_management}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('project_management')}
                  onEdit={() => handleEditMetadata('project_management')}
                />
              )}

              {matchesSearch('Monetization', 'Enable tipping, donations, subscriptions, and revenue tracking.') && (
                <IntegrationCard
                  id="monetization"
                  icon={DollarSign}
                  iconGradient="from-green-500 to-green-600"
                  title={getMetadata('monetization')?.title || 'Monetization'}
                  description={getMetadata('monetization')?.description || 'Enable tipping, donations, subscriptions, and revenue tracking.'}
                  tooltip={getMetadata('monetization')?.tooltip_text}
                  isActive={modules.monetization}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('monetization')}
                  onEdit={() => handleEditMetadata('monetization')}
                />
              )}

              {matchesSearch('Team Chat', 'Real-time team messaging and collaboration. Connect with your team members instantly.') && (
                <IntegrationCard
                  id="team_chat"
                  icon={MessageSquare}
                  iconGradient="from-cyan-500 to-blue-600"
                  title={getMetadata('team_chat')?.title || 'Team Chat'}
                  description={getMetadata('team_chat')?.description || 'Real-time team messaging and collaboration. Connect with your team members instantly.'}
                  tooltip={getMetadata('team_chat')?.tooltip_text}
                  isActive={modules.team_chat}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('team_chat')}
                  onEdit={() => handleEditMetadata('team_chat')}
                />
              )}

              {matchesSearch('Blog', 'Create and publish blog posts with AI assistance, RSS import, and SEO optimization.') && (
                <IntegrationCard
                  id="blog"
                  icon={FileText}
                  iconGradient="from-orange-500 to-red-600"
                  title={getMetadata('blog')?.title || 'Blog'}
                  description={getMetadata('blog')?.description || 'Create and publish blog posts with AI assistance, RSS import, and SEO optimization.'}
                  tooltip={getMetadata('blog')?.tooltip_text}
                  isActive={modules.blog}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('blog')}
                  onEdit={() => handleEditMetadata('blog')}
                />
              )}

              {matchesSearch('RSS Podcast Posting', 'Automatically sync and publish podcast episodes from RSS feeds to your podcast library.') && (
                <IntegrationCard
                  id="rss_podcast_posting"
                  icon={Rss}
                  iconGradient="from-amber-500 to-orange-600"
                  title={getMetadata('rss_podcast_posting')?.title || 'RSS Podcast Posting'}
                  description={getMetadata('rss_podcast_posting')?.description || 'Automatically sync and publish podcast episodes from RSS feeds to your podcast library.'}
                  tooltip={getMetadata('rss_podcast_posting')?.tooltip_text}
                  isActive={modules.rss_podcast_posting}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('rss_podcast_posting')}
                  onEdit={() => handleEditMetadata('rss_podcast_posting')}
                />
              )}

              {matchesSearch('My Page', 'Create your shareable digital identity page with social links, videos, bookings, and more. Perfect for creators and influencers.') && (
                <IntegrationCard
                  id="my_page"
                  icon={UserIcon}
                  iconGradient="from-teal-500 to-cyan-600"
                  title="My Page"
                  description="Create your shareable digital identity page with social links, videos, bookings, and more. Perfect for creators and influencers."
                  tooltip="Enable to create your customizable public profile page"
                  isActive={modules.my_page}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('my_page')}
                  onEdit={() => handleEditMetadata('my_page')}
                />
              )}

              {matchesSearch('Events', 'Create and manage events with ticketing, registrations, RSVPs, and automated reminders.') && (
                <IntegrationCard
                  id="events"
                  icon={CalendarDays}
                  iconGradient="from-violet-500 to-purple-600"
                  title="Events"
                  description="Create and manage events with ticketing, registrations, RSVPs, and automated reminders."
                  tooltip="Enable to create events and manage attendees"
                  isActive={modules.events}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('events')}
                  onEdit={() => handleEditMetadata('events')}
                />
              )}

              {matchesSearch('Sign-up Sheets', 'Create volunteer sign-up sheets with time slots, capacity limits, and automated confirmations.') && (
                <IntegrationCard
                  id="signup_sheets"
                  icon={ClipboardList}
                  iconGradient="from-sky-500 to-blue-600"
                  title="Sign-up Sheets"
                  description="Create volunteer sign-up sheets with time slots, capacity limits, and automated confirmations."
                  tooltip="Enable to create and manage volunteer sign-up sheets"
                  isActive={modules.signup_sheets}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('signup_sheets')}
                  onEdit={() => handleEditMetadata('signup_sheets')}
                />
              )}

              {matchesSearch('Polls', 'Create interactive polls and surveys with real-time results, voting analytics, and shareable links.') && (
                <IntegrationCard
                  id="polls"
                  icon={BarChart3}
                  iconGradient="from-emerald-500 to-green-600"
                  title="Polls"
                  description="Create interactive polls and surveys with real-time results, voting analytics, and shareable links."
                  tooltip="Enable to create polls and collect feedback"
                  isActive={modules.polls}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('polls')}
                  onEdit={() => handleEditMetadata('polls')}
                />
              )}

              {matchesSearch('QR Codes', 'Generate QR codes for events, links, contact info, and more. Track scans and engagement.') && (
                <IntegrationCard
                  id="qr_codes"
                  icon={QrCode}
                  iconGradient="from-rose-500 to-pink-600"
                  title="QR Codes"
                  description="Generate QR codes for events, links, contact info, and more. Track scans and engagement."
                  tooltip="Enable to create and manage QR codes"
                  isActive={modules.qr_codes}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('qr_codes')}
                  onEdit={() => handleEditMetadata('qr_codes')}
                />
              )}

              {matchesSearch('Advertiser Account', 'Create an advertiser account to run campaigns, manage ad budgets, and reach engaged podcast audiences.') && (
                <IntegrationCard
                  id="advertiser"
                  icon={TrendingUp}
                  iconGradient="from-orange-500 to-red-600"
                  title="Advertiser Account"
                  description="Create an advertiser account to run campaigns, manage ad budgets, and reach engaged podcast audiences."
                  tooltip="Enable to access advertiser features and campaign management"
                  isActive={modules.advertiser}
                  isAdmin={isAdmin}
                  onToggle={() => {
                    if (!modules.advertiser) {
                      navigate('/advertiser/signup');
                    } else {
                      toggleModule('advertiser');
                    }
                  }}
                  onEdit={() => handleEditMetadata('advertiser')}
                />
              )}

              {matchesSearch('Marketing', 'Email campaigns, contact management, and marketing automation. Build and nurture your audience with powerful marketing tools.') && (
                <IntegrationCard
                  id="marketing"
                  icon={Mail}
                  iconGradient="from-blue-500 to-indigo-600"
                  title="Marketing"
                  description="Email campaigns, contact management, and marketing automation. Build and nurture your audience with powerful marketing tools."
                  tooltip="Enable to access email marketing and CRM features"
                  isActive={modules.marketing}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('marketing')}
                  onEdit={() => handleEditMetadata('marketing')}
                />
              )}

              {matchesSearch('SMS', 'Send SMS campaigns, automate text message reminders, and engage your audience directly on their mobile devices.') && (
                <IntegrationCard
                  id="sms"
                  icon={Smartphone}
                  iconGradient="from-green-500 to-teal-600"
                  title="SMS"
                  description="Send SMS campaigns, automate text message reminders, and engage your audience directly on their mobile devices."
                  tooltip="Enable to send SMS messages and notifications"
                  isActive={modules.sms}
                  isAdmin={isAdmin}
                  onToggle={() => toggleModule('sms')}
                  onEdit={() => handleEditMetadata('sms')}
                />
              )}
            </div>
          </section>

          {/* Social Media Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              SOCIAL MEDIA
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Instagram */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['instagram'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['instagram'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Instagram</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your Instagram account to share content and grow your audience.
                    </p>
                  </div>
                  
                  {groupedConnections['instagram'] && groupedConnections['instagram'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['instagram'].length} account{groupedConnections['instagram'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* Facebook */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['facebook'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['facebook'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Facebook</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your Facebook page to expand your reach and engagement.
                    </p>
                  </div>
                  
                  {groupedConnections['facebook'] && groupedConnections['facebook'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['facebook'].length} account{groupedConnections['facebook'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* LinkedIn */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['linkedin'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['linkedin'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">LinkedIn</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect LinkedIn to build your professional network and brand.
                    </p>
                  </div>
                  
                  {groupedConnections['linkedin'] && groupedConnections['linkedin'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['linkedin'].length} account{groupedConnections['linkedin'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* Twitter/X */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                      <Twitter className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['twitter'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['twitter'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">X (Twitter)</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect your X account to share updates and engage with followers.
                    </p>
                  </div>
                  
                  {groupedConnections['twitter'] && groupedConnections['twitter'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['twitter'].length} account{groupedConnections['twitter'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* YouTube */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['youtube'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['youtube'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">YouTube</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect YouTube to showcase your video content and grow subscribers.
                    </p>
                  </div>
                  
                  {groupedConnections['youtube'] && groupedConnections['youtube'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['youtube'].length} account{groupedConnections['youtube'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>

              {/* TikTok */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={groupedConnections['tiktok'] ? "default" : "secondary"} className="text-xs">
                      {groupedConnections['tiktok'] ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">TikTok</h3>
                    <p className="text-xs text-muted-foreground">Social Media</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Connect TikTok to share short-form videos and reach new audiences.
                    </p>
                  </div>
                  
                  {groupedConnections['tiktok'] && groupedConnections['tiktok'].length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {groupedConnections['tiktok'].length} account{groupedConnections['tiktok'].length > 1 ? 's' : ''} connected
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/influencer/profile-settings')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Manage
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* Payments Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
              PAYMENTS
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Stripe */}
              <Card className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="default" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Stripe</h3>
                    <p className="text-xs text-muted-foreground">Payment Processing</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Accept payments, manage subscriptions, and handle transactions securely.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Configure
                  </Button>
                </div>
              </Card>

              {/* PayPal */}
              <Card className="p-6 hover:border-primary/50 transition-all opacity-60">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">PayPal</h3>
                    <p className="text-xs text-muted-foreground">Payment Processing</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Alternative payment processing with PayPal integration.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] bg-background border shadow-lg z-50">
          <DialogHeader>
            <DialogTitle>Edit Integration Info</DialogTitle>
            <DialogDescription>
              Update the title, description, and tooltip for this integration.
            </DialogDescription>
          </DialogHeader>
          
          {editingModule && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <input
                  id="title"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className="min-h-[80px] bg-background"
                  value={editingModule.description}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tooltip">Tooltip (More Info)</Label>
                <Textarea
                  id="tooltip"
                  className="min-h-[100px] bg-background"
                  placeholder="Detailed information shown when hovering over the info icon..."
                  value={editingModule.tooltip}
                  onChange={(e) => setEditingModule({ ...editingModule, tooltip: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMetadata}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Integrations;
