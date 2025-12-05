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
  BarChart3
} from "lucide-react";

/**
 * MY DAY - Daily Control Center
 * 
 * Purpose: "What do I need to do today?"
 * Content: Today's meetings, tasks, content deadlines, reminders, notifications
 * 
 * This is distinct from:
 * - Dashboard (metrics & trends)
 * - Creator Hub (tools & opportunities)
 */

interface DailyStats {
  unreadEmails: number;
  meetingsToday: number;
  tasksDue: number;
  alerts: number;
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
  const [stats, setStats] = useState<DailyStats>({
    unreadEmails: 0,
    meetingsToday: 0,
    tasksDue: 0,
    alerts: 0,
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
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Break type chain for deep queries
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

      setStats({
        unreadEmails: 0,
        meetingsToday: meetingsCount,
        tasksDue: tasksCount,
        alerts: 0,
      });
    } catch (error) {
      console.error("Error loading daily stats:", error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header - matches Dashboard */}
        <div className="flex items-center justify-between" data-onboarding="my-day-header">
          <div className="flex items-center gap-3">
            {greeting.icon}
            <div>
              <h1 className="text-2xl font-bold">
                {greeting.text}, {firstName || "Creator"}
              </h1>
              <p className="text-muted-foreground">
                {today} — Your schedule and action items for today.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/meetings/create")} data-onboarding="quick-actions">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* Quick Stats Grid - matches Dashboard metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-onboarding="kpi-cards">
          <div 
            className="cursor-pointer"
            onClick={() => navigate("/inbox")}
          >
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.unreadEmails}</p>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="cursor-pointer"
            onClick={() => navigate("/meetings")}
          >
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.meetingsToday}</p>
                <p className="text-xs text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="cursor-pointer"
            onClick={() => navigate("/tasks")}
          >
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.tasksDue}</p>
                <p className="text-xs text-muted-foreground">Due today</p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="cursor-pointer"
            onClick={() => navigate("/notifications")}
          >
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.alerts}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Sections - matches Dashboard chart cards height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-onboarding="upcoming-meetings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              {stats.meetingsToday > 0 ? (
                <div className="text-center">
                  <p className="text-sm">You have {stats.meetingsToday} meeting(s) today</p>
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

          <Card data-onboarding="todays-tasks">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Today's Key Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              {stats.tasksDue > 0 ? (
                <div className="text-center">
                  <p className="text-sm">You have {stats.tasksDue} pending task(s)</p>
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

        {/* Cross-links - matches Dashboard */}
        <Card className="bg-muted/30" data-onboarding="cross-links">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Check your performance or explore tools</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Dashboard <ArrowRight className="h-3 w-3 ml-1" />
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
