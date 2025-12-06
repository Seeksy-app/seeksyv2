import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Settings,
  Eye,
  BarChart3,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useMyPageEnabled } from "@/hooks/useMyPageEnabled";
import { DashboardCustomizer, WidgetConfig } from "@/components/dashboard/DashboardCustomizer";
import {
  ProfileViewsWidget,
  LinkClicksWidget,
  EngagementWidget,
  EventsWidget,
  MeetingsWidget,
  PollsWidget,
  PodcastsWidget,
  RevenueWidget,
  MediaWidget,
  EmailsSentWidget,
  EmailsOpenedWidget,
  EmailClicksWidget,
  SignupSheetsWidget,
  ClicksByTypeWidget,
  TopLinksWidget,
  QuickActionsWidget,
  StreamAnalyticsWidget,
} from "@/components/dashboard/widgets";
import { SocialAccountsBanner } from "@/components/creator/SocialAccountsBanner";
import { SocialMediaAnalytics } from "@/components/dashboard/widgets/SocialMediaAnalytics";
import { IdentityStatusCard } from "@/components/dashboard/IdentityStatusCard";
import { CertifiedClipsCard } from "@/components/dashboard/CertifiedClipsCard";
import { MediaVaultCard } from "@/components/dashboard/MediaVaultCard";
import { AdvertiserAccessCard } from "@/components/dashboard/AdvertiserAccessCard";
import { QuickCreateCard } from "@/components/dashboard/QuickCreateCard";
import { HolidayCreatorBanner } from "@/components/dashboard/HolidayCreatorBanner";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";
import { useRole } from "@/contexts/RoleContext";

interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalMeetings: number;
  upcomingMeetings: number;
  totalSignupSheets: number;
  totalPolls: number;
  publishedPolls: number;
  totalEmailsSent: number;
  profileViews: number;
  linkClicks: number;
  profileViewsThisWeek: number;
  linkClicksThisWeek: number;
  totalPodcasts: number;
  totalEpisodes: number;
  totalRevenue: number;
  totalImpressions: number;
  mediaFiles: number;
  engagementRate: number;
}

interface LinkClickBreakdown {
  link_type: string;
  count: number;
  title?: string;
}

interface TopLink {
  link_url: string;
  link_type: string;
  count: number;
}

interface TrackingStats {
  opens: number;
  clicks: number;
  total: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "profile-views", label: "Profile Visits", enabled: true, category: "mypage" },
  { id: "link-clicks", label: "Link Clicks", enabled: true, category: "mypage" },
  { id: "engagement", label: "Engagement Rate", enabled: true, category: "mypage" },
  { id: "stream-analytics", label: "My Page Streaming", enabled: true, category: "mypage" },
  { id: "clicks-by-type", label: "Clicks by Type", enabled: true, category: "mypage" },
  { id: "top-links", label: "Top Performing Links", enabled: true, category: "mypage" },
  { id: "social-media", label: "Social Media Analytics", enabled: true, category: "engagement" },
  { id: "emails-sent", label: "Emails Sent", enabled: true, category: "email" },
  { id: "emails-opened", label: "Emails Opened", enabled: true, category: "email" },
  { id: "email-clicks", label: "Email Link Clicks", enabled: true, category: "email" },
  { id: "events", label: "Events Created", enabled: true, category: "seekies" },
  { id: "meetings", label: "Meetings Scheduled", enabled: true, category: "seekies" },
  { id: "polls", label: "Polls & Voting", enabled: true, category: "seekies" },
  { id: "signup-sheets", label: "Sign-Up Sheets", enabled: true, category: "seekies" },
  { id: "quick-actions", label: "Quick Actions", enabled: true, category: "seekies" },
  { id: "podcasts", label: "Total Podcasts", enabled: true, category: "media" },
  { id: "media", label: "Media Library Files", enabled: true, category: "media" },
  { id: "revenue", label: "Ad Revenue Earnings", enabled: true, category: "revenue" },
  { id: "impressions", label: "Total Ad Impressions", enabled: true, category: "revenue" },
];

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: <Sunrise className="h-6 w-6 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: <Sun className="h-6 w-6 text-yellow-500" /> };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: <Sunset className="h-6 w-6 text-orange-500" /> };
  return { text: "Good night", icon: <Moon className="h-6 w-6 text-indigo-400" /> };
}

export default function MyDay() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clickBreakdown, setClickBreakdown] = useState<LinkClickBreakdown[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({ opens: 0, clicks: 0, total: 0 });
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("myday-widgets");
    if (saved) {
      const savedWidgets = JSON.parse(saved);
      return DEFAULT_WIDGETS.map(defaultWidget => {
        const savedWidget = savedWidgets.find((w: WidgetConfig) => w.id === defaultWidget.id);
        return savedWidget || defaultWidget;
      });
    }
    return DEFAULT_WIDGETS;
  });
  
  const { data: myPageEnabled } = useMyPageEnabled();
  const { currentRole } = useRole();
  const { data: holidaySettings } = useHolidaySettings();
  const greeting = getGreeting();

  const showHolidayBanner = (currentRole === 'creator' || currentRole === 'influencer' || currentRole === 'agency') && 
                             (holidaySettings?.holidayMode || (new Date().getMonth() === 11));

  const handleWidgetsSave = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("myday-widgets", JSON.stringify(newWidgets));
    toast({
      title: "Dashboard customized!",
      description: "Your preferences have been saved.",
      duration: 2000,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadStats();
      loadTrackingStats();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_full_name, account_avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      setFirstName(profile.account_full_name.split(" ")[0]);
    }
    if (profile?.account_avatar_url) {
      setAvatarUrl(profile.account_avatar_url);
    }
  };

  const loadTrackingStats = async () => {
    if (!user) return;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from("signature_tracking_events")
        .select("event_type")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      if (data) {
        const opens = data.filter(e => e.event_type === "open").length;
        const clicks = data.filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type)).length;
        setTrackingStats({ opens, clicks, total: opens + clicks });
      }
    } catch (error) {
      console.error("Error loading tracking stats:", error);
    }
  };

  const loadStats = async () => {
    try {
      if (!user) return;
      setLoading(true);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const profileId = profileData?.id || user.id;

      const [
        { count: totalEvents },
        { count: publishedEvents },
        { count: totalMeetings },
        { count: upcomingMeetings },
        { count: totalSignupSheets },
        { count: totalPolls },
        { count: publishedPolls },
        { count: totalEmailsSent },
        { count: profileViews },
        { count: linkClicks },
        { count: profileViewsThisWeek },
        { count: linkClicksThisWeek },
        { count: totalPodcasts },
        { count: totalEpisodes },
        { count: mediaFiles },
      ] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("meetings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("meetings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("start_time", now.toISOString()),
        supabase.from("signup_sheets").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", profileId).gte("viewed_at", weekAgo.toISOString()),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", profileId).gte("clicked_at", weekAgo.toISOString()),
        supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("episodes").select("podcast_id", { count: "exact", head: true }).in("podcast_id", 
          (await supabase.from("podcasts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || []
        ),
        supabase.from("media_files").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("creator_share, total_impressions")
        .eq("user_id", user.id);
      
      const totalRevenue = earnings?.reduce((sum, e) => sum + (e.creator_share || 0), 0) || 0;
      const totalImpressions = earnings?.reduce((sum, e) => sum + (e.total_impressions || 0), 0) || 0;

      const engagementRate = profileViews && profileViews > 0 
        ? ((linkClicks || 0) / profileViews) * 100 
        : 0;

      setStats({
        totalEvents: totalEvents || 0,
        publishedEvents: publishedEvents || 0,
        totalMeetings: totalMeetings || 0,
        upcomingMeetings: upcomingMeetings || 0,
        totalSignupSheets: totalSignupSheets || 0,
        totalPolls: totalPolls || 0,
        publishedPolls: publishedPolls || 0,
        totalEmailsSent: totalEmailsSent || 0,
        profileViews: profileViews || 0,
        linkClicks: linkClicks || 0,
        profileViewsThisWeek: profileViewsThisWeek || 0,
        linkClicksThisWeek: linkClicksThisWeek || 0,
        totalPodcasts: totalPodcasts || 0,
        totalEpisodes: totalEpisodes || 0,
        totalRevenue,
        totalImpressions,
        mediaFiles: mediaFiles || 0,
        engagementRate,
      });

      // Load click breakdown
      const { data: breakdown } = await supabase
        .from("link_clicks")
        .select("link_type, link_url")
        .eq("profile_id", profileId);

      if (breakdown) {
        const typeCounts = breakdown.reduce((acc: Record<string, number>, click) => {
          if (click.link_type !== 'custom_link') {
            acc[click.link_type] = (acc[click.link_type] || 0) + 1;
          }
          return acc;
        }, {});

        const customClicks = breakdown.filter(c => c.link_type === 'custom_link');
        const customUrlCounts = customClicks.reduce((acc: Record<string, number>, click) => {
          acc[click.link_url] = (acc[click.link_url] || 0) + 1;
          return acc;
        }, {});

        const { data: customLinks } = await supabase
          .from('custom_links')
          .select('url, title')
          .eq('profile_id', profileId);

        const regularBreakdown = Object.entries(typeCounts)
          .map(([link_type, count]) => ({ link_type, count: count as number }));

        const customBreakdown = Object.entries(customUrlCounts).map(([url, count]) => {
          const link = customLinks?.find(l => l.url === url);
          return {
            link_type: 'custom_link',
            title: link?.title || url,
            count: count as number,
          };
        });

        setClickBreakdown(
          [...regularBreakdown, ...customBreakdown].sort((a, b) => b.count - a.count)
        );
      }

      // Load top links
      const { data: links } = await supabase
        .from("link_clicks")
        .select("link_url, link_type")
        .eq("profile_id", profileId);

      if (links) {
        const linkCounts = links.reduce((acc: Record<string, { type: string; count: number }>, click) => {
          const key = click.link_url;
          if (!acc[key]) {
            acc[key] = { type: click.link_type, count: 0 };
          }
          acc[key].count++;
          return acc;
        }, {});

        setTopLinks(
          Object.entries(linkCounts)
            .map(([link_url, data]) => ({ link_url, link_type: data.type, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 lg:px-10 pt-8 pb-16 flex flex-col items-start w-full">
        {/* My Day Header with Avatar, Greeting, and Action Buttons */}
        <div className="w-full mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl && (
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={avatarUrl} alt={firstName} />
                <AvatarFallback className="text-2xl">
                  {firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-3">
                {greeting.icon}
                <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                  {greeting.text}{firstName ? `, ${firstName}` : ""}!
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Here's what's happening across your shows, campaigns, and events today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardCustomizer widgets={widgets} onSave={handleWidgetsSave} />
            <Button variant="outline" size="sm" onClick={() => navigate("/meetings/create")}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            {trackingStats.total > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/signatures")}
                className="relative"
              >
                <Eye className="h-4 w-4 mr-2" />
                Tracking
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 min-w-[20px] px-1.5 text-xs bg-primary"
                >
                  {trackingStats.total}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Social Accounts Banner */}
        <SocialAccountsBanner />

        {/* Holiday Banner */}
        {showHolidayBanner && (
          <HolidayCreatorBanner firstName={firstName} />
        )}

        {/* Identity & Content Dashboard Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8 w-full">
          <IdentityStatusCard />
          <CertifiedClipsCard />
          <MediaVaultCard />
          <AdvertiserAccessCard />
          <QuickCreateCard />
        </div>

        {/* Customizable Widgets */}
        {stats && (
          <div className="space-y-6 mb-8 w-full">
            {/* MY PAGE SECTION */}
            {myPageEnabled && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {widgets.filter(w => w.enabled && ['profile-views', 'link-clicks', 'engagement', 'stream-analytics'].includes(w.id)).map(widget => {
                    switch (widget.id) {
                      case "profile-views":
                        return <ProfileViewsWidget key={widget.id} data={stats} />;
                      case "link-clicks":
                        return <LinkClicksWidget key={widget.id} data={stats} />;
                      case "engagement":
                        return <EngagementWidget key={widget.id} data={stats} />;
                      case "stream-analytics":
                        return <StreamAnalyticsWidget key={widget.id} />;
                      default:
                        return null;
                    }
                  })}
                </div>

                {stats.linkClicks > 0 && (widgets.find(w => w.id === 'clicks-by-type' && w.enabled) || widgets.find(w => w.id === 'top-links' && w.enabled)) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {widgets.find(w => w.id === 'clicks-by-type' && w.enabled) && (
                      <ClicksByTypeWidget clickBreakdown={clickBreakdown} totalClicks={stats.linkClicks} />
                    )}
                    {widgets.find(w => w.id === 'top-links' && w.enabled) && (
                      <TopLinksWidget topLinks={topLinks} />
                    )}
                  </div>
                )}

                {widgets.find(w => w.id === 'social-media' && w.enabled) && (
                  <div>
                    <SocialMediaAnalytics />
                  </div>
                )}
              </div>
            )}

            {/* EMAIL ANALYTICS SECTION */}
            {widgets.some(w => w.enabled && ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {widgets.filter(w => w.enabled && ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "emails-sent":
                      return <EmailsSentWidget key={widget.id} />;
                    case "emails-opened":
                      return <EmailsOpenedWidget key={widget.id} />;
                    case "email-clicks":
                      return <EmailClicksWidget key={widget.id} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* SEEKIES & CONTENT SECTION */}
            {widgets.some(w => w.enabled && ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {widgets.filter(w => w.enabled && ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "events":
                      return <EventsWidget key={widget.id} data={stats} />;
                    case "meetings":
                      return <MeetingsWidget key={widget.id} data={stats} />;
                    case "polls":
                      return <PollsWidget key={widget.id} data={stats} />;
                    case "signup-sheets":
                      return <SignupSheetsWidget key={widget.id} data={stats} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* MEDIA & PODCASTS SECTION */}
            {widgets.some(w => w.enabled && ['podcasts', 'media'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {widgets.filter(w => w.enabled && ['podcasts', 'media'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "podcasts":
                      return <PodcastsWidget key={widget.id} data={stats} />;
                    case "media":
                      return <MediaWidget key={widget.id} data={stats} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* REVENUE SECTION */}
            {widgets.some(w => w.enabled && ['revenue', 'impressions'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {widgets.filter(w => w.enabled && ['revenue', 'impressions'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "revenue":
                      return <RevenueWidget key={widget.id} data={stats} />;
                    case "impressions":
                      return (
                        <div key={widget.id} className="cursor-pointer" onClick={() => navigate("/podcast-revenue")}>
                          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Total Ad Impressions</h3>
                              <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <div className="text-3xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Across all campaigns</p>
                            </div>
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* Quick Actions */}
            {widgets.find(w => w.id === 'quick-actions' && w.enabled) && (
              <QuickActionsWidget />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
