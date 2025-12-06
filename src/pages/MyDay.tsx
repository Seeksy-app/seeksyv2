import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  CheckSquare, 
  Mail, 
  Bell,
  Shield,
  ArrowRight, 
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Sparkles,
  BarChart3,
  Settings,
} from "lucide-react";

// Import the colorful dashboard widgets
import {
  ProfileViewsWidget,
  LinkClicksWidget,
  EngagementWidget,
  EventsWidget,
  MeetingsWidget,
  PollsWidget,
  PodcastsWidget,
  MediaWidget,
  SignupSheetsWidget,
  EmailsSentWidget,
  EmailsOpenedWidget,
  EmailClicksWidget,
  StreamAnalyticsWidget,
  QuickActionsWidget,
} from "@/components/dashboard/widgets";
import { IdentityStatusCard } from "@/components/dashboard/IdentityStatusCard";
import { CertifiedClipsCard } from "@/components/dashboard/CertifiedClipsCard";
import { MediaVaultCard } from "@/components/dashboard/MediaVaultCard";
import { AdvertiserAccessCard } from "@/components/dashboard/AdvertiserAccessCard";
import { QuickCreateCard } from "@/components/dashboard/QuickCreateCard";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";

/**
 * MY DAY - Daily Control Center + Dashboard Overview
 * 
 * Uses the original colorful Dashboard layout with brand-colored widgets
 */

interface DailyStats {
  unreadEmails: number;
  meetingsToday: number;
  tasksDue: number;
  alerts: number;
}

interface DashboardStats {
  profileViews: number;
  profileViewsThisWeek: number;
  linkClicks: number;
  linkClicksThisWeek: number;
  totalEvents: number;
  publishedEvents: number;
  upcomingMeetings: number;
  publishedPolls: number;
  totalPodcasts: number;
  totalEpisodes: number;
  totalSignupSheets: number;
  mediaFiles: number;
  engagementRate: number;
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: <Sunrise className="h-6 w-6 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: <Sun className="h-6 w-6 text-yellow-500" /> };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: <Sunset className="h-6 w-6 text-orange-500" /> };
  return { text: "Good night", icon: <Moon className="h-6 w-6 text-indigo-400" /> };
}

export default function MyDay() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    unreadEmails: 0,
    meetingsToday: 0,
    tasksDue: 0,
    alerts: 0,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    profileViews: 0,
    profileViewsThisWeek: 0,
    linkClicks: 0,
    linkClicksThisWeek: 0,
    totalEvents: 0,
    publishedEvents: 0,
    upcomingMeetings: 0,
    publishedPolls: 0,
    totalPodcasts: 0,
    totalEpisodes: 0,
    totalSignupSheets: 0,
    mediaFiles: 0,
    engagementRate: 0,
  });
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadDailyStats();
      loadDashboardStats();
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

  const loadDailyStats = async () => {
    if (!user) return;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      let meetingsCount = 0;
      let tasksCount = 0;

      try {
        const { count } = await (supabase.from("meetings") as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("start_time", todayStart.toISOString())
          .lte("start_time", todayEnd.toISOString());
        meetingsCount = count || 0;
      } catch {}

      try {
        const { count } = await (supabase.from("tasks") as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending");
        tasksCount = count || 0;
      } catch {}

      setDailyStats({
        unreadEmails: 0,
        meetingsToday: meetingsCount,
        tasksDue: tasksCount,
        alerts: 0,
      });
    } catch (error) {
      console.error("Error loading daily stats:", error);
    }
  };

  const loadDashboardStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        { count: profileViews },
        { count: profileViewsThisWeek },
        { count: linkClicks },
        { count: linkClicksThisWeek },
        { count: totalEvents },
        { count: publishedEvents },
        { count: upcomingMeetings },
        { count: publishedPolls },
        { count: totalPodcasts },
        { count: totalSignupSheets },
        { count: mediaFiles },
      ] = await Promise.all([
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", user.id).gte("viewed_at", weekAgo.toISOString()),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", user.id).gte("clicked_at", weekAgo.toISOString()),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("meetings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("start_time", now.toISOString()),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("signup_sheets").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("media_files").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const engagementRate = profileViews && profileViews > 0 
        ? ((linkClicks || 0) / profileViews) * 100 
        : 0;

      setDashboardStats({
        profileViews: profileViews || 0,
        profileViewsThisWeek: profileViewsThisWeek || 0,
        linkClicks: linkClicks || 0,
        linkClicksThisWeek: linkClicksThisWeek || 0,
        totalEvents: totalEvents || 0,
        publishedEvents: publishedEvents || 0,
        upcomingMeetings: upcomingMeetings || 0,
        publishedPolls: publishedPolls || 0,
        totalPodcasts: totalPodcasts || 0,
        totalEpisodes: 0,
        totalSignupSheets: totalSignupSheets || 0,
        mediaFiles: mediaFiles || 0,
        engagementRate,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
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

  const [isCustomizing, setIsCustomizing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 lg:px-10 pt-8 pb-16 flex flex-col items-start w-full">
        {/* Header with Avatar - friendlier greeting */}
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
            <Button 
              variant={isCustomizing ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setIsCustomizing(!isCustomizing)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isCustomizing ? "Done" : "Customize"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/meetings/create")}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Identity & Rights Section */}
        <div className="space-y-4 w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Identity & Rights</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <IdentityStatusCard />
            <CertifiedClipsCard />
            <MediaVaultCard />
            <AdvertiserAccessCard />
          </div>
        </div>

        {/* My Page Analytics - Colorful widgets */}
        <div className="space-y-6 w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">My Page Analytics</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ProfileViewsWidget data={dashboardStats} />
            <LinkClicksWidget data={dashboardStats} />
            <EngagementWidget data={dashboardStats} />
            <StreamAnalyticsWidget />
          </div>
        </div>

        {/* Email Analytics Section */}
        <div className="space-y-4 w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Email Analytics</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <EmailsSentWidget />
            <EmailsOpenedWidget />
            <EmailClicksWidget />
          </div>
        </div>

        {/* Seekies & Content Section */}
        <div className="space-y-4 w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Seekies & Content</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <EventsWidget data={dashboardStats} />
            <MeetingsWidget data={dashboardStats} />
            <PollsWidget data={dashboardStats} />
            <SignupSheetsWidget data={dashboardStats} />
          </div>
        </div>

        {/* Media & Podcasts Section */}
        <div className="space-y-4 w-full mb-8">
          <div className="grid gap-4 md:grid-cols-2">
            <PodcastsWidget data={dashboardStats} />
            <MediaWidget data={dashboardStats} />
          </div>
        </div>

        {/* Today's Focus Section */}
        <div className="space-y-4 w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Today's Focus</h2>
          </div>

          {/* Daily Action Cards with brand colors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => navigate("/inbox")} className="cursor-pointer">
              <DashboardWidget title="Emails" icon={<Mail className="h-5 w-5" />} brandColor="red">
                <div className="text-4xl font-bold tracking-tight mb-2">
                  {dailyStats.unreadEmails}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Unread messages</p>
              </DashboardWidget>
            </div>

            <div onClick={() => navigate("/meetings")} className="cursor-pointer">
              <DashboardWidget title="Meetings" icon={<Calendar className="h-5 w-5" />} brandColor="blue">
                <div className="text-4xl font-bold tracking-tight mb-2">
                  {dailyStats.meetingsToday}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Scheduled today</p>
              </DashboardWidget>
            </div>

            <div onClick={() => navigate("/tasks")} className="cursor-pointer">
              <DashboardWidget title="Tasks" icon={<CheckSquare className="h-5 w-5" />} brandColor="gold">
                <div className="text-4xl font-bold tracking-tight mb-2">
                  {dailyStats.tasksDue}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Due today</p>
              </DashboardWidget>
            </div>

            <div onClick={() => navigate("/notifications")} className="cursor-pointer">
              <DashboardWidget title="Alerts" icon={<Bell className="h-5 w-5" />} brandColor="navy">
                <div className="text-4xl font-bold tracking-tight mb-2">
                  {dailyStats.alerts}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Notifications</p>
              </DashboardWidget>
            </div>
          </div>

          {/* Schedule & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-brand-blue/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Upcoming Meetings
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                {dailyStats.meetingsToday > 0 ? (
                  <div className="text-center">
                    <p className="text-sm">You have {dailyStats.meetingsToday} meeting(s) today</p>
                    <Button variant="link" onClick={() => navigate("/meetings")}>
                      View all meetings <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No meetings scheduled today</p>
                    <Button variant="link" onClick={() => navigate("/meetings/create")}>
                      Schedule a meeting <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-brand-gold/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-brand-gold" />
                  Today's Key Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                {dailyStats.tasksDue > 0 ? (
                  <div className="text-center">
                    <p className="text-sm">You have {dailyStats.tasksDue} pending task(s)</p>
                    <Button variant="link" onClick={() => navigate("/tasks")}>
                      View all tasks <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No pending tasks</p>
                    <Button variant="link" onClick={() => navigate("/tasks")}>
                      Create a task <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="w-full">
          <QuickActionsWidget />
        </div>
      </main>
    </div>
  );
}
