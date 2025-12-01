import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, TrendingUp, MousePointerClick, Users, AlertCircle, Clock, Award } from "lucide-react";
import { EmailActivityFeed } from "@/components/email/dashboard/EmailActivityFeed";
import { EmailChartsSection } from "@/components/email/dashboard/EmailChartsSection";
import { EmailSmartInsights } from "@/components/email/dashboard/EmailSmartInsights";

export default function EmailHome() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch email stats for last 30 days
  const { data: stats } = useQuery({
    queryKey: ["email-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get campaign totals
      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("total_sent, total_opened, total_clicked, total_bounced")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (!campaigns) return null;

      const totalSent = campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
      const totalClicked = campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
      const totalBounced = campaigns.reduce((sum, c) => sum + (c.total_bounced || 0), 0);

      // Get unsubscribe count from events
      const { count: totalUnsubscribed } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_type", "unsubscribed")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
      const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0";
      const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : "0.0";
      const unsubscribeRate = totalSent > 0 ? ((totalUnsubscribed / totalSent) * 100).toFixed(1) : "0.0";

      return {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        totalUnsubscribed: totalUnsubscribed || 0,
        openRate,
        clickRate,
        bounceRate,
        unsubscribeRate,
      };
    },
    enabled: !!user,
  });

  const kpis = [
    {
      title: "Emails Sent",
      value: stats?.totalSent?.toLocaleString() || "0",
      icon: Mail,
      description: "Last 30 days",
    },
    {
      title: "Open Rate",
      value: `${stats?.openRate || "0.0"}%`,
      icon: TrendingUp,
      description: "Average opens",
    },
    {
      title: "Click Rate",
      value: `${stats?.clickRate || "0.0"}%`,
      icon: MousePointerClick,
      description: "Average clicks",
    },
    {
      title: "Bounce Rate",
      value: `${stats?.bounceRate || "0.0"}%`,
      icon: AlertCircle,
      description: "Hard + soft bounces",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Email Marketing</h1>
              <p className="text-sm text-muted-foreground">Command center for your campaigns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <EmailChartsSection userId={user?.id} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Activity Feed */}
          <EmailActivityFeed userId={user?.id} />

          {/* Smart Insights */}
          <EmailSmartInsights userId={user?.id} />
        </div>
      </div>
    </div>
  );
}
