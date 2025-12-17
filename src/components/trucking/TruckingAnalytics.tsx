import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, Phone, Users, TrendingUp, CheckCircle, Clock, 
  PhoneIncoming, PhoneMissed, Voicemail, BarChart3 
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
        supabase.from("trucking_call_logs").select("id, call_outcome, routed_to_voicemail, created_at"),
        supabase.from("trucking_call_logs").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("trucking_call_logs").select("id").gte("created_at", weekAgo),
        supabase.from("trucking_carrier_leads").select("id, status, rate_offered, rate_requested"),
        supabase.from("trucking_carrier_leads").select("id").gte("created_at", todayStart).lte("created_at", todayEnd),
        supabase.from("trucking_call_transcripts").select("duration_seconds, rate_discussed")
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
      const answeredCalls = calls.filter(c => c.call_outcome === 'answered' || c.call_outcome === 'completed').length;
      const missedCalls = calls.filter(c => c.call_outcome === 'missed' || c.call_outcome === 'no_answer').length;
      const voicemailCalls = calls.filter(c => c.routed_to_voicemail).length;

      // Calculate avg call duration
      const durations = transcripts.filter(t => t.duration_seconds).map(t => t.duration_seconds || 0);
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

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

  const statCards = [
    // Row 1: Load Stats
    { 
      label: "Total Loads", 
      value: analytics.totalLoads, 
      icon: Package, 
      color: "text-blue-500",
      subtext: `+${analytics.loadsAddedToday} today`
    },
    { 
      label: "Open Loads", 
      value: analytics.openLoads, 
      icon: Clock, 
      color: "text-yellow-500",
      subtext: "Available"
    },
    { 
      label: "Pending", 
      value: analytics.pendingLoads, 
      icon: TrendingUp, 
      color: "text-orange-500",
      subtext: "In negotiation"
    },
    { 
      label: "Confirmed", 
      value: analytics.confirmedLoads, 
      icon: CheckCircle, 
      color: "text-green-500",
      subtext: "Booked"
    },
    
    // Row 2: Call Stats
    { 
      label: "Calls Today", 
      value: analytics.callsToday, 
      icon: Phone, 
      color: "text-blue-500",
      subtext: `${analytics.callsThisWeek} this week`
    },
    { 
      label: "Answered", 
      value: analytics.answeredCalls, 
      icon: PhoneIncoming, 
      color: "text-green-500",
      subtext: "Connected calls"
    },
    { 
      label: "Missed", 
      value: analytics.missedCalls, 
      icon: PhoneMissed, 
      color: "text-red-500",
      subtext: "No answer"
    },
    { 
      label: "Voicemails", 
      value: analytics.voicemails, 
      icon: Voicemail, 
      color: "text-purple-500",
      subtext: "Messages left"
    },
    
    // Row 3: Lead Stats
    { 
      label: "Total Leads", 
      value: analytics.totalLeads, 
      icon: Users, 
      color: "text-blue-500",
      subtext: `+${analytics.leadsToday} today`
    },
    { 
      label: "Interested", 
      value: analytics.interestedLeads, 
      icon: TrendingUp, 
      color: "text-yellow-500",
      subtext: "Warm leads"
    },
    { 
      label: "Confirmed", 
      value: analytics.confirmedLeads, 
      icon: CheckCircle, 
      color: "text-green-500",
      subtext: "Converted"
    },
    { 
      label: "Conversion", 
      value: `${analytics.conversionRate}%`, 
      icon: BarChart3, 
      color: "text-emerald-500",
      subtext: "Lead to book rate"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <span className="text-xs text-muted-foreground">
          Last updated: {format(new Date(), "h:mm a")}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Call Duration</p>
                <p className="text-xl font-bold">
                  {Math.floor(analytics.avgCallDuration / 60)}m {analytics.avgCallDuration % 60}s
                </p>
              </div>
              <Phone className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Target Rate</p>
                <p className="text-xl font-bold">${analytics.avgTargetRate.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Negotiated Rate</p>
                <p className="text-xl font-bold">${analytics.avgNegotiatedRate.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
