import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CheckSquare, 
  Mail, 
  Bell, 
  ArrowRight, 
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  Podcast,
  Image,
  MousePointerClick
} from "lucide-react";

/**
 * MY DAY - Daily Control Center + Dashboard Overview
 * 
 * SECTION A: Dashboard Overview (metrics, performance)
 * SECTION B: My Day Content (today's schedule, action items)
 */

interface DailyStats {
  unreadEmails: number;
  meetingsToday: number;
  tasksDue: number;
  alerts: number;
}

interface DashboardStats {
  profileViews: number;
  linkClicks: number;
  totalPodcasts: number;
  totalEpisodes: number;
  mediaFiles: number;
  engagementRate: number;
  totalContacts: number;
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: <Sunrise className="h-5 w-5 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: <Sun className="h-5 w-5 text-yellow-500" /> };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: <Sunset className="h-5 w-5 text-orange-500" /> };
  return { text: "Good night", icon: <Moon className="h-5 w-5 text-indigo-400" /> };
}

export default function MyDay() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    unreadEmails: 0,
    meetingsToday: 0,
    tasksDue: 0,
    alerts: 0,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    profileViews: 0,
    linkClicks: 0,
    totalPodcasts: 0,
    totalEpisodes: 0,
    mediaFiles: 0,
    engagementRate: 0,
    totalContacts: 0,
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
      .select("account_full_name")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      setFirstName(profile.account_full_name.split(" ")[0]);
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
      const [
        { count: profileViews },
        { count: linkClicks },
        { count: totalPodcasts },
        { count: mediaFiles },
        { count: totalContacts },
      ] = await Promise.all([
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("media_files").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const engagementRate = profileViews && profileViews > 0 
        ? ((linkClicks || 0) / profileViews) * 100 
        : 0;

      setDashboardStats({
        profileViews: profileViews || 0,
        linkClicks: linkClicks || 0,
        totalPodcasts: totalPodcasts || 0,
        totalEpisodes: 0,
        mediaFiles: mediaFiles || 0,
        engagementRate,
        totalContacts: totalContacts || 0,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {greeting.icon}
            <div>
              <h1 className="text-2xl font-bold">
                {greeting.text}, {firstName || "Creator"}
              </h1>
              <p className="text-muted-foreground">
                {today}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/meetings/create")}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* SECTION A: Dashboard Overview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Dashboard Overview</h2>
          </div>

          {/* Dashboard Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Profile Views</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.profileViews.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MousePointerClick className="h-4 w-4" />
                  <span className="text-xs font-medium">Link Clicks</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.linkClicks.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/podcasts")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Podcast className="h-4 w-4" />
                  <span className="text-xs font-medium">Podcasts</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.totalPodcasts}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/studio/media")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Image className="h-4 w-4" />
                  <span className="text-xs font-medium">Media Files</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.mediaFiles}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/audience")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Contacts</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.totalContacts}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Engagement</span>
                </div>
                <p className="text-2xl font-bold">{dashboardStats.engagementRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION B: My Day Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Today's Focus</h2>
          </div>

          {/* Daily Action Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/inbox")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dailyStats.unreadEmails}</p>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/meetings")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dailyStats.meetingsToday}</p>
                <p className="text-xs text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/tasks")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dailyStats.tasksDue}</p>
                <p className="text-xs text-muted-foreground">Due today</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/notifications")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dailyStats.alerts}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </CardContent>
            </Card>
          </div>

          {/* Schedule & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
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

        {/* Quick Links */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Explore your tools and grow your audience</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Full Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/creator-hub">
                    Open Creator Hub <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
