import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, Phone, Users, TrendingUp, CheckCircle, Clock, 
  PhoneIncoming, PhoneMissed, Voicemail, BarChart3, Timer, 
  TrendingDown, MessageSquare, DollarSign
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  // Load metrics
  totalLoads: number;
  openLoads: number;
  pendingLoads: number;
  confirmedLoads: number;
  archivedLoads: number;
  loadsAddedToday: number;
  loadsAddedThisWeek: number;
  
  // Call metrics
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  answeredCalls: number;
  missedCalls: number;
  voicemails: number;
  avgCallDuration: number;
  
  // Call behavior metrics
  callsUnder30Sec: number;
  callsUnder60Sec: number;
  callsOver2Min: number;
  hungUpBeforeRate: number;
  hungUpAfterRate: number;
  askedHigherRate: number;
  confirmedAtTargetRate: number;
  
  // Lead metrics
  totalLeads: number;
  leadsToday: number;
  interestedLeads: number;
  confirmedLeads: number;
  conversionRate: number;
  
  // Rate metrics
  avgTargetRate: number;
  avgNegotiatedRate: number;
}

export default function TruckingAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const weekAgo = subDays(today, 7).toISOString();

      // Fetch all data in parallel
      const [
        loadsRes,
        loadsTodayRes,
        loadsWeekRes,
        callsRes,
        callsTodayRes,
        callsWeekRes,
        leadsRes,
        leadsTodayRes,
        transcriptsRes
      ] = await Promise.all([
        supabase.from("trucking_loads").select("id, status, target_rate"),
        supabase.from("trucking_loads").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("trucking_loads").select("id").gte("created_at", weekAgo),
        supabase.from("trucking_call_logs").select("id, call_outcome, routed_to_voicemail, created_at, duration_seconds, summary"),
        supabase.from("trucking_call_logs").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("trucking_call_logs").select("id").gte("created_at", weekAgo),
        supabase.from("trucking_carrier_leads").select("id, status, rate_offered, rate_requested"),
        supabase.from("trucking_carrier_leads").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("trucking_call_transcripts").select("duration_seconds, rate_discussed, negotiation_outcome, summary, key_topics")
      ]);

      const loads = loadsRes.data || [];
      const calls = callsRes.data || [];
      const leads = leadsRes.data || [];
      const transcripts = transcriptsRes.data || [];

      // Calculate load metrics
      const openLoads = loads.filter(l => l.status === 'open').length;
      const pendingLoads = loads.filter(l => l.status === 'pending').length;
      const confirmedLoads = loads.filter(l => l.status === 'confirmed').length;
      const archivedLoads = loads.filter(l => l.status === 'archived').length;

      // Calculate call metrics
      const answeredCalls = calls.filter(c => c.call_outcome === 'answered' || c.call_outcome === 'completed' || c.call_outcome === 'confirmed').length;
      const missedCalls = calls.filter(c => c.call_outcome === 'missed' || c.call_outcome === 'no_answer').length;
      const voicemailCalls = calls.filter(c => c.routed_to_voicemail).length;

      // Calculate call behavior metrics from calls and transcripts
      const allDurations = [
        ...calls.filter(c => c.duration_seconds).map(c => c.duration_seconds || 0),
        ...transcripts.filter(t => t.duration_seconds).map(t => t.duration_seconds || 0)
      ];
      
      const avgDuration = allDurations.length > 0 
        ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length 
        : 0;

      // Call duration breakdowns
      const callsUnder30Sec = allDurations.filter(d => d < 30).length;
      const callsUnder60Sec = allDurations.filter(d => d >= 30 && d < 60).length;
      const callsOver2Min = allDurations.filter(d => d >= 120).length;

      // Analyze transcripts for rate discussion behavior
      const rateDiscussed = transcripts.filter(t => t.rate_discussed && t.rate_discussed > 0);
      const askedHigherRate = transcripts.filter(t => 
        t.negotiation_outcome === 'counter_offered' || 
        t.negotiation_outcome === 'rejected' ||
        (t.key_topics && t.key_topics.some((topic: string) => 
          topic.toLowerCase().includes('higher') || 
          topic.toLowerCase().includes('negotiate') ||
          topic.toLowerCase().includes('counter')
        ))
      ).length;
      
      const confirmedAtTarget = transcripts.filter(t => 
        t.negotiation_outcome === 'accepted' || 
        t.negotiation_outcome === 'confirmed'
      ).length;

      // Estimate hung up before/after rate (based on call duration - short calls likely before rate)
      const hungUpBeforeRate = allDurations.filter(d => d > 0 && d < 45).length; // Very short calls
      const hungUpAfterRate = allDurations.filter(d => d >= 45 && d < 120).length; // Medium calls with rate discussed

      // Calculate lead metrics
      const interestedLeads = leads.filter(l => l.status === 'interested').length;
      const confirmedLeadCount = leads.filter(l => l.status === 'confirmed' || l.status === 'booked').length;
      const conversionRate = leads.length > 0 ? (confirmedLeadCount / leads.length) * 100 : 0;

      // Calculate rate metrics
      const targetRates = loads.filter(l => l.target_rate).map(l => l.target_rate);
      const avgTarget = targetRates.length > 0 ? targetRates.reduce((a, b) => a + b, 0) / targetRates.length : 0;
      
      const negotiatedRates = leads.filter(l => l.rate_offered).map(l => l.rate_offered || 0);
      const avgNegotiated = negotiatedRates.length > 0 ? negotiatedRates.reduce((a, b) => a + b, 0) / negotiatedRates.length : 0;

      setAnalytics({
        totalLoads: loads.length,
        openLoads,
        pendingLoads,
        confirmedLoads,
        archivedLoads,
        loadsAddedToday: loadsTodayRes.data?.length || 0,
        loadsAddedThisWeek: loadsWeekRes.data?.length || 0,
        totalCalls: calls.length,
        callsToday: callsTodayRes.data?.length || 0,
        callsThisWeek: callsWeekRes.data?.length || 0,
        answeredCalls,
        missedCalls,
        voicemails: voicemailCalls,
        avgCallDuration: Math.round(avgDuration),
        callsUnder30Sec,
        callsUnder60Sec,
        callsOver2Min,
        hungUpBeforeRate,
        hungUpAfterRate,
        askedHigherRate,
        confirmedAtTargetRate: confirmedAtTarget,
        totalLeads: leads.length,
        leadsToday: leadsTodayRes.data?.length || 0,
        interestedLeads,
        confirmedLeads: confirmedLeadCount,
        conversionRate: Math.round(conversionRate),
        avgTargetRate: Math.round(avgTarget),
        avgNegotiatedRate: Math.round(avgNegotiated)
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-24 bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <span className="text-xs text-muted-foreground">
          Last updated: {format(new Date(), "h:mm a")}
        </span>
      </div>
      
      {/* Load Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Loads</p>
                <p className="text-2xl font-bold">{analytics.totalLoads}</p>
                <p className="text-xs text-muted-foreground">+{analytics.loadsAddedToday} today</p>
              </div>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{analytics.openLoads}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{analytics.pendingLoads}</p>
                <p className="text-xs text-muted-foreground">In negotiation</p>
              </div>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{analytics.confirmedLoads}</p>
                <p className="text-xs text-muted-foreground">Booked</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Lead to book</p>
              </div>
              <BarChart3 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Calls Today</p>
                <p className="text-2xl font-bold">{analytics.callsToday}</p>
                <p className="text-xs text-muted-foreground">{analytics.callsThisWeek} this week</p>
              </div>
              <Phone className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Answered</p>
                <p className="text-2xl font-bold">{analytics.answeredCalls}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
              <PhoneIncoming className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Missed</p>
                <p className="text-2xl font-bold">{analytics.missedCalls}</p>
                <p className="text-xs text-muted-foreground">No answer</p>
              </div>
              <PhoneMissed className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Voicemails</p>
                <p className="text-2xl font-bold">{analytics.voicemails}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
              <Voicemail className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Behavior Analytics */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Call Behavior Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Call Duration</p>
                  <p className="text-xl font-bold">
                    {analytics.avgCallDuration > 0 
                      ? `${Math.floor(analytics.avgCallDuration / 60)}m ${analytics.avgCallDuration % 60}s`
                      : "—"}
                  </p>
                </div>
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Quick Hangups</p>
                  <p className="text-xl font-bold">{analytics.callsUnder30Sec}</p>
                  <p className="text-xs text-muted-foreground">&lt; 30 seconds</p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hung Up Before Rate</p>
                  <p className="text-xl font-bold">{analytics.hungUpBeforeRate}</p>
                  <p className="text-xs text-muted-foreground">&lt; 45 sec calls</p>
                </div>
                <PhoneMissed className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hung Up After Rate</p>
                  <p className="text-xl font-bold">{analytics.hungUpAfterRate}</p>
                  <p className="text-xs text-muted-foreground">45s - 2min calls</p>
                </div>
                <MessageSquare className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Long Calls (2+ min)</p>
                  <p className="text-xl font-bold">{analytics.callsOver2Min}</p>
                  <p className="text-xs text-muted-foreground">Engaged callers</p>
                </div>
                <Phone className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Asked Higher Rate</p>
                  <p className="text-xl font-bold">{analytics.askedHigherRate}</p>
                  <p className="text-xs text-muted-foreground">Counter offers</p>
                </div>
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Confirmed @ Target</p>
                  <p className="text-xl font-bold">{analytics.confirmedAtTargetRate}</p>
                  <p className="text-xs text-muted-foreground">Accepted rate</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Target Rate</p>
                  <p className="text-xl font-bold">
                    {analytics.avgTargetRate > 0 ? `$${analytics.avgTargetRate.toLocaleString()}` : "—"}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{analytics.totalLeads}</p>
                <p className="text-xs text-muted-foreground">+{analytics.leadsToday} today</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Interested</p>
                <p className="text-2xl font-bold">{analytics.interestedLeads}</p>
                <p className="text-xs text-muted-foreground">Warm leads</p>
              </div>
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{analytics.confirmedLeads}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Negotiated</p>
                <p className="text-2xl font-bold">
                  {analytics.avgNegotiatedRate > 0 ? `$${analytics.avgNegotiatedRate.toLocaleString()}` : "—"}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
