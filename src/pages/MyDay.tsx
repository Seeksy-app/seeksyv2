import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Calendar, 
  CheckSquare, 
  Bell,
  ArrowRight,
  Clock,
  AlertCircle
} from "lucide-react";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { Link } from "react-router-dom";
import { FloatingEmailComposer } from "@/components/email/client/FloatingEmailComposer";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFaviconManager } from "@/hooks/useFaviconManager";
import { TodaysKeyTasks } from "@/components/my-day/TodaysKeyTasks";
import { UpcomingMeetings } from "@/components/my-day/UpcomingMeetings";
import { format } from "date-fns";

/**
 * MY DAY - Daily Control Center
 * 
 * Purpose: "What do I need to do today?"
 * Content: Today's meetings, tasks, deadlines, reminders, notifications
 * 
 * This is distinct from:
 * - Dashboard (metrics/performance snapshot)
 * - Creator Hub (tools & opportunities)
 */
export default function MyDay() {
  const [user, setUser] = useState<any>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [stats, setStats] = useState({
    unreadEmails: 0,
    meetingsToday: 0,
    pendingTasks: 0,
    alerts: 0
  });
  const [greeting, setGreeting] = useState("Hello");

  usePageTitle("My Day");
  useFaviconManager();

  useEffect(() => {
    loadUser();
    loadStats();
    setTimeBasedGreeting();
  }, []);

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else if (hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();
      setUser({ ...user, ...profile });
    }
  };

  const loadStats = async () => {
    // Stats loaded via individual components
    setStats({
      unreadEmails: 0,
      meetingsToday: 0,
      pendingTasks: 0,
      alerts: 0
    });
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        {/* Header - Time-focused */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex items-start gap-4">
            <SparkIcon size={48} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{today}</p>
              <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName}!</h1>
              <p className="text-muted-foreground mt-1">
                Your schedule and action items for today.
              </p>
            </div>
          </div>
        </div>

        {/* Today's Quick Stats - Action-oriented */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/email">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.unreadEmails}</p>
                    <p className="text-xs text-muted-foreground">Unread</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/meetings">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.meetingsToday}</p>
                    <p className="text-xs text-muted-foreground">Meetings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/tasks">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.alerts}</p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Today's Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Meetings */}
          <UpcomingMeetings />

          {/* Today's Tasks */}
          <TodaysKeyTasks />
        </div>

        {/* Cross-links to other views */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Need a bigger picture?</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
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

      <FloatingEmailComposer 
        open={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />
    </div>
  );
}
