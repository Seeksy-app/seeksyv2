import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Users, 
  Calendar, 
  CheckSquare, 
  Bell,
  Plus,
  Video,
  Mic,
  FileText,
  CalendarCheck
} from "lucide-react";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { Link } from "react-router-dom";

export default function MyDay() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    unreadEmails: 0,
    newContacts: 0,
    meetingsToday: 0,
    pendingTasks: 0,
    alerts: 0
  });

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

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
    // Load real stats from database
    // For now, showing structure with placeholder data
    setStats({
      unreadEmails: 0,
      newContacts: 0,
      meetingsToday: 0,
      pendingTasks: 0,
      alerts: 0
    });
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <SparkIcon size={48} />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Good morning, {firstName}! ✨</h1>
            <p className="text-muted-foreground">
              Here's what needs your attention today
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/inbox">
            <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-accent/5 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Inbox
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unreadEmails}</div>
                <p className="text-xs text-muted-foreground">unread messages</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/audience">
            <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-accent/5 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newContacts}</div>
                <p className="text-xs text-muted-foreground">new contacts</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/meetings">
            <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-accent/5 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.meetingsToday}</div>
                <p className="text-xs text-muted-foreground">meetings today</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/tasks">
            <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-accent/5 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">pending tasks</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/alerts">
            <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-accent/5 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.alerts}</div>
                <p className="text-xs text-muted-foreground">needs review</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
              <Link to="/inbox">
                <Mail className="h-6 w-6" />
                <span>Create Email</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
              <Link to="/content">
                <FileText className="h-6 w-6" />
                <span>Create Post</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
              <Link to="/content">
                <Video className="h-6 w-6" />
                <span>Create Clip</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
              <Link to="/meetings">
                <CalendarCheck className="h-6 w-6" />
                <span>Schedule Meeting</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
