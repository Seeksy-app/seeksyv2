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
import { FloatingEmailComposer } from "@/components/email/client/FloatingEmailComposer";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFaviconManager } from "@/hooks/useFaviconManager";
import { GlobalSearch } from "@/components/GlobalSearch";
import { TodaysKeyTasks } from "@/components/my-day/TodaysKeyTasks";
import { EngagementOpportunities } from "@/components/my-day/EngagementOpportunities";
import { DraftReview } from "@/components/my-day/DraftReview";
import { UpcomingMeetings } from "@/components/my-day/UpcomingMeetings";

export default function MyDay() {
  const [user, setUser] = useState<any>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [stats, setStats] = useState({
    unreadEmails: 0,
    newContacts: 0,
    meetingsToday: 0,
    pendingTasks: 0,
    alerts: 0
  });

  // Page title and favicon management
  usePageTitle("My Day");
  useFaviconManager();

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
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Header with Gradient */}
        <div className="rounded-2xl bg-gradient-to-r from-[hsl(220,80%,96%)] to-[hsl(270,60%,97%)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <SparkIcon size={48} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">Good morning, {firstName}! ✨</h1>
                <p className="text-muted-foreground">
                  Here's what needs your attention today
                </p>
              </div>
            </div>
            <div className="w-96">
              <GlobalSearch />
            </div>
          </div>
        </div>

        {/* Stats Grid - Metric Cards with Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Inbox - Blue */}
          <Link to="/email">
            <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md bg-[hsl(217,100%,97%)] hover:bg-[hsl(217,100%,95%)] border-[hsl(217,90%,90%)] rounded-xl group">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-full bg-[hsl(217,90%,60%)] shadow-sm">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  Inbox
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[1.5rem] font-bold text-foreground">{stats.unreadEmails}</div>
                <p className="text-xs text-muted-foreground">unread messages</p>
              </CardContent>
            </Card>
          </Link>

          {/* Audience - Green */}
          <Link to="/contacts">
            <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md bg-[hsl(142,70%,96%)] hover:bg-[hsl(142,70%,93%)] border-[hsl(142,60%,85%)] rounded-xl group">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-full bg-[hsl(142,70%,45%)] shadow-sm">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[1.5rem] font-bold text-foreground">{stats.newContacts}</div>
                <p className="text-xs text-muted-foreground">new contacts</p>
              </CardContent>
            </Card>
          </Link>

          {/* Meetings - Teal */}
          <Link to="/meetings">
            <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md bg-[hsl(199,90%,96%)] hover:bg-[hsl(199,90%,93%)] border-[hsl(199,80%,85%)] rounded-xl group">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-full bg-[hsl(199,90%,48%)] shadow-sm">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[1.5rem] font-bold text-foreground">{stats.meetingsToday}</div>
                <p className="text-xs text-muted-foreground">meetings today</p>
              </CardContent>
            </Card>
          </Link>

          {/* Tasks - Orange */}
          <Link to="/tasks">
            <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md bg-[hsl(25,100%,96%)] hover:bg-[hsl(25,100%,93%)] border-[hsl(25,90%,85%)] rounded-xl group">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-full bg-[hsl(25,95%,53%)] shadow-sm">
                    <CheckSquare className="h-4 w-4 text-white" />
                  </div>
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[1.5rem] font-bold text-foreground">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">pending tasks</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions - Quick Create Cards with Colors */}
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Quick Create
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Create Email - Blue */}
            <Button 
              variant="outline" 
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-[hsl(217,100%,97%)] hover:border-[hsl(217,90%,80%)] transition-all"
              onClick={() => setIsComposerOpen(true)}
            >
              <div className="p-2 rounded-full bg-[hsl(217,90%,95%)]">
                <Mail className="h-6 w-6 text-[hsl(217,90%,50%)]" />
              </div>
              <span className="font-medium">Create Email</span>
            </Button>
            
            {/* Create Post - Purple */}
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-[hsl(270,80%,97%)] hover:border-[hsl(270,70%,80%)] transition-all" asChild>
              <Link to="/content">
                <div className="p-2 rounded-full bg-[hsl(270,80%,95%)]">
                  <FileText className="h-6 w-6 text-[hsl(270,70%,50%)]" />
                </div>
                <span className="font-medium">Create Post</span>
              </Link>
            </Button>
            
            {/* Create Clip - Pink */}
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-[hsl(330,80%,97%)] hover:border-[hsl(330,70%,80%)] transition-all" asChild>
              <Link to="/studio/clips">
                <div className="p-2 rounded-full bg-[hsl(330,80%,95%)]">
                  <Video className="h-6 w-6 text-[hsl(330,70%,50%)]" />
                </div>
                <span className="font-medium">Create Clip</span>
              </Link>
            </Button>
            
            {/* Schedule Meeting - Teal */}
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-[hsl(199,90%,97%)] hover:border-[hsl(199,80%,80%)] transition-all" asChild>
              <Link to="/meetings">
                <div className="p-2 rounded-full bg-[hsl(199,90%,95%)]">
                  <CalendarCheck className="h-6 w-6 text-[hsl(199,80%,45%)]" />
                </div>
                <span className="font-medium">Schedule Meeting</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Smart Blocks - Spark-Powered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TodaysKeyTasks />
          <EngagementOpportunities />
          <DraftReview />
          <UpcomingMeetings />
        </div>
      </div>

      <FloatingEmailComposer 
        open={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />
    </div>
  );
}