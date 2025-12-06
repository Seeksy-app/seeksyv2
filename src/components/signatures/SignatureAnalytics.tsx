import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, MousePointer, Users, Globe, Smartphone, Monitor, Link2 } from "lucide-react";
import { format } from "date-fns";

interface SignatureAnalyticsProps {
  signatures: any[];
}

interface TrackingEvent {
  id: string;
  signature_id: string;
  event_type: string;
  link_id: string | null;
  target_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  email_client: string | null;
  created_at: string;
}

export function SignatureAnalytics({ signatures }: SignatureAnalyticsProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30d");

  useEffect(() => {
    fetchEvents();
  }, [selectedSignature, dateRange]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date filter
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "7d") startDate.setDate(now.getDate() - 7);
      else if (dateRange === "30d") startDate.setDate(now.getDate() - 30);
      else if (dateRange === "90d") startDate.setDate(now.getDate() - 90);

      let query = supabase
        .from("signature_tracking_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (selectedSignature !== "all") {
        query = query.eq("signature_id", selectedSignature);
      }

      const { data } = await query;
      setEvents((data as TrackingEvent[]) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const opens = events.filter(e => e.event_type === "open");
    const bannerClicks = events.filter(e => e.event_type === "banner_click");
    const socialClicks = events.filter(e => e.event_type === "social_click");
    const linkClicks = events.filter(e => e.event_type === "link_click");
    const allClicks = [...bannerClicks, ...socialClicks, ...linkClicks];
    
    // Unique counts by IP
    const uniqueOpenIps = new Set(opens.map(e => e.ip_address)).size;
    const uniqueClickIps = new Set(allClicks.map(e => e.ip_address)).size;
    
    // Device breakdown
    const deviceCounts = events.reduce((acc, e) => {
      const device = e.device_type || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Top clicked links
    const linkCounts = allClicks.reduce((acc, e) => {
      const link = e.link_id || e.target_url || "unknown";
      acc[link] = (acc[link] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topLinks = Object.entries(linkCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    return {
      totalOpens: opens.length,
      uniqueOpens: uniqueOpenIps,
      totalClicks: allClicks.length,
      uniqueClicks: uniqueClickIps,
      bannerClicks: bannerClicks.length,
      socialClicks: socialClicks.length,
      linkClicks: linkClicks.length,
      ctr: opens.length > 0 ? ((allClicks.length / opens.length) * 100).toFixed(1) : "0",
      deviceCounts,
      topLinks,
    };
  }, [events]);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "tablet": return <Smartphone className="h-4 w-4" />;
      case "desktop": return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Signature Analytics</h2>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSignature} onValueChange={setSelectedSignature}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All signatures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All signatures</SelectItem>
              {signatures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalOpens}</p>
                <p className="text-sm text-muted-foreground">Total Opens</p>
                <p className="text-xs text-muted-foreground">{metrics.uniqueOpens} unique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointer className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalClicks}</p>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-xs text-muted-foreground">{metrics.uniqueClicks} unique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.ctr}%</p>
                <p className="text-sm text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.bannerClicks}</p>
                <p className="text-sm text-muted-foreground">Banner Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tracking events yet. Send some emails with your signature to see analytics!
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="links" className="w-full">
          <TabsList>
            <TabsTrigger value="links">Top Links</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Clicked Links</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.topLinks.map(([link, count], i) => (
                      <TableRow key={i}>
                        <TableCell className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-xs">{formatLinkLabel(link)}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{count}</TableCell>
                      </TableRow>
                    ))}
                    {metrics.topLinks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No link clicks yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.deviceCounts).map(([device, count]) => {
                    const percentage = ((count / events.length) * 100).toFixed(0);
                    return (
                      <div key={device} className="flex items-center gap-3">
                        {getDeviceIcon(device)}
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="capitalize">{device}</span>
                            <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 20).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge variant={event.event_type === "open" ? "secondary" : "default"}>
                            {formatEventType(event.event_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-xs">
                          {event.link_id || event.target_url || "—"}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {getDeviceIcon(event.device_type || "unknown")}
                          <span className="capitalize">{event.device_type || "unknown"}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(new Date(event.created_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  switch (type) {
    case "open": return "Opened";
    case "banner_click": return "Banner";
    case "social_click": return "Social";
    case "link_click": return "Link";
    default: return type;
  }
}

function formatLinkLabel(link: string): string {
  if (link.startsWith("http")) {
    try {
      const url = new URL(link);
      return url.hostname + url.pathname;
    } catch {
      return link;
    }
  }
  // Format social link IDs
  const socialMap: Record<string, string> = {
    facebook: "Facebook",
    twitter: "X (Twitter)",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    banner: "Banner CTA",
    website: "Website",
  };
  return socialMap[link] || link;
}