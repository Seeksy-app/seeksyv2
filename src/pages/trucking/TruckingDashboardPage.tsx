import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, UserCheck, Phone, Plus, ArrowRight, CheckCircle2, XCircle, PhoneCall, Clock, Loader2, ChevronDown, ChevronRight, MapPin, DollarSign, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper, TruckingContentCard, TruckingEmptyState, TruckingStatCardLight } from "@/components/trucking/TruckingPageWrapper";
import { format, formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DashboardStats {
  openLoads: number;
  leadsToday: number;
  callsToday: number;
  confirmedLeads: number;
}

interface EarningsSummary {
  estRevenue: number;
  bookedRevenue: number;
  estEarnings: number;
  bookedEarnings: number;
}

interface CallMetrics {
  activeCallCount: number;
  maxConcurrentCalls: number;
  totalCallsToday: number;
  avgCallDuration: number;
}

interface Load {
  id: string;
  load_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  pickup_date: string;
  target_rate: number;
  floor_rate: number;
  equipment_type: string;
  miles: number;
  status: string;
  weight_lbs: number;
  commodity: string;
  special_instructions: string;
}

interface ConfirmedLead {
  id: string;
  company_name: string;
  contact_name: string;
  mc_number: string;
  dot_number: string;
  phone: string;
  rate_offered: number;
  rate_requested: number;
  confirmed_at: string;
  created_at: string;
  trucking_loads?: { load_number: string; origin_city: string; origin_state: string; destination_city: string; destination_state: string } | null;
}

interface CarrierLead {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  rate_offered: number;
  status: string;
  created_at: string;
  trucking_loads?: { load_number: string } | null;
}

export default function TruckingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ openLoads: 0, leadsToday: 0, callsToday: 0, confirmedLeads: 0 });
  const [earnings, setEarnings] = useState<EarningsSummary>({ estRevenue: 0, bookedRevenue: 0, estEarnings: 0, bookedEarnings: 0 });
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({ activeCallCount: 0, maxConcurrentCalls: 2, totalCallsToday: 0, avgCallDuration: 0 });
  const [loads, setLoads] = useState<Load[]>([]);
  const [confirmedLeads, setConfirmedLeads] = useState<ConfirmedLead[]>([]);
  const [recentLeads, setRecentLeads] = useState<CarrierLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);
  const [loadsOpen, setLoadsOpen] = useState(true);
  const [confirmedOpen, setConfirmedOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Fetch stats - ALL agents see ALL loads (no owner_id filter)
      const [loadsResult, confirmedResult, leadsResult, callsResult] = await Promise.all([
        supabase.from("trucking_loads").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("is_confirmed", true),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("is_confirmed", false).gte("created_at", today),
        supabase.from("trucking_call_logs").select("id", { count: "exact" }).gte("created_at", today),
      ]);

      setStats({
        openLoads: loadsResult.count || 0,
        confirmedLeads: confirmedResult.count || 0,
        leadsToday: leadsResult.count || 0,
        callsToday: callsResult.count || 0,
      });

      // Fetch open loads - ALL agents see ALL loads
      const { data: openLoads } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("status", "open")
        .order("pickup_date", { ascending: true })
        .limit(10);

      setLoads(openLoads || []);

      // Fetch loads for today's earnings calculation (based on pickup_date)
      const { data: todayLoads } = await supabase
        .from("trucking_loads")
        .select("target_rate, broker_commission, status")
        .eq("pickup_date", today);

      if (todayLoads) {
        const openAndConfirmed = todayLoads.filter(l => l.status === "open" || l.status === "booked");
        const confirmedOnly = todayLoads.filter(l => l.status === "booked");

        setEarnings({
          estRevenue: openAndConfirmed.reduce((sum, l) => sum + (l.target_rate || 0), 0),
          bookedRevenue: confirmedOnly.reduce((sum, l) => sum + (l.target_rate || 0), 0),
          estEarnings: openAndConfirmed.reduce((sum, l) => sum + (l.broker_commission || 0), 0),
          bookedEarnings: confirmedOnly.reduce((sum, l) => sum + (l.broker_commission || 0), 0),
        });
      }

      // Fetch call metrics and settings - ALL agents see ALL data
      const [settingsResult, activeCallsResult] = await Promise.all([
        supabase.from("trucking_settings").select("max_concurrent_calls").maybeSingle(),
        supabase.from("trucking_call_logs")
          .select("id, call_started_at, call_ended_at")
          .gte("call_started_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .is("call_ended_at", null),
      ]);

      const maxConcurrent = settingsResult.data?.max_concurrent_calls || 2;
      const activeCalls = activeCallsResult.data?.length || 0;

      setCallMetrics({
        activeCallCount: activeCalls,
        maxConcurrentCalls: maxConcurrent,
        totalCallsToday: callsResult.count || 0,
        avgCallDuration: 0,
      });

      // Fetch confirmed leads - ALL agents see ALL leads
      const { data: confirmed } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number, origin_city, origin_state, destination_city, destination_state)")
        .eq("is_confirmed", true)
        .order("confirmed_at", { ascending: false })
        .limit(10);

      setConfirmedLeads(confirmed || []);

      // Fetch recent unconfirmed leads - ALL agents see ALL leads
      const { data: leads } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number)")
        .eq("is_confirmed", false)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentLeads(leads || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ status: "booked" })
        .eq("id", leadId);

      if (error) throw error;
      toast({ title: "Booking confirmed!" });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ is_confirmed: false, status: "declined" })
        .eq("id", leadId);

      if (error) throw error;
      toast({ title: "Lead rejected" });
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      interested: "bg-yellow-100 text-yellow-700",
      countered: "bg-orange-100 text-orange-700",
      booked: "bg-green-100 text-green-700",
      declined: "bg-red-100 text-red-700",
      open: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isAiBusy = callMetrics.activeCallCount >= callMetrics.maxConcurrentCalls;

  return (
    <TruckingPageWrapper 
      title="Dashboard" 
      description="Overview of your loads and leads"
      action={
        <div className="flex items-center gap-3">
          {isAiBusy ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI Busy ({callMetrics.activeCallCount}/{callMetrics.maxConcurrentCalls})
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              AI Live
            </div>
          )}
          <Link to="/trucking/loads">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Load
            </Button>
          </Link>
        </div>
      }
    >
      {/* Compact Earnings Summary */}
      <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5" title="Sum of all open + confirmed loads today">
            <span className="text-slate-400">Est Revenue:</span>
            <span className="font-medium text-slate-700">
              {earnings.estRevenue > 0 ? `$${earnings.estRevenue.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Sum of confirmed loads only">
            <span className="text-slate-400">Booked:</span>
            <span className="font-medium text-green-600">
              {earnings.bookedRevenue > 0 ? `$${earnings.bookedRevenue.toLocaleString()}` : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5" title="Commission for all loads today">
            <span className="text-slate-400">Est Earnings:</span>
            <span className="font-medium text-slate-700">
              {earnings.estEarnings > 0 ? `$${earnings.estEarnings.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Commission for confirmed loads only">
            <span className="text-slate-400">Booked:</span>
            <span className="font-medium text-green-600">
              {earnings.bookedEarnings > 0 ? `$${earnings.bookedEarnings.toLocaleString()}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TruckingStatCardLight 
          label="Open Loads" 
          value={stats.openLoads} 
          icon={<Package className="h-6 w-6 text-blue-600" />}
        />
        <TruckingStatCardLight 
          label="New Leads Today" 
          value={stats.leadsToday} 
          icon={<UserCheck className="h-6 w-6 text-amber-600" />}
        />
        <TruckingStatCardLight 
          label="AI Calls Today" 
          value={stats.callsToday} 
          icon={<Phone className="h-6 w-6 text-slate-600" />}
        />
        <TruckingStatCardLight 
          label="Confirmed Loads" 
          value={stats.confirmedLeads} 
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
        />
      </div>

      {/* SECTION 1: Open Loads (PRIMARY - First thing they see) */}
      <Collapsible open={loadsOpen} onOpenChange={setLoadsOpen}>
        <TruckingContentCard noPadding>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                {loadsOpen ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                <div>
                  <h3 className="font-semibold text-slate-900">Open Loads</h3>
                  <p className="text-sm text-slate-500">Active loads available for carriers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700">{loads.length} loads</Badge>
                <Link to="/trucking/loads" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {loads.length === 0 ? (
              <TruckingEmptyState
                icon={<Package className="h-6 w-6 text-slate-400" />}
                title="No open loads"
                description="Add a load to start receiving carrier calls."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {loads.map((load) => (
                  <div key={load.id}>
                    {/* Load Row - Clickable to expand */}
                    <div 
                      className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedLoadId(expandedLoadId === load.id ? null : load.id)}
                    >
                      <div className="flex items-center gap-4">
                        {expandedLoadId === load.id ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{load.load_number}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-semibold text-green-600">${load.target_rate?.toLocaleString() || "—"}</div>
                          <div className="text-xs text-slate-500">{load.miles} mi</div>
                        </div>
                        <Badge className={getStatusBadge(load.status)}>{load.status}</Badge>
                        {load.pickup_date && (
                          <div className="text-sm text-slate-500">
                            {format(new Date(load.pickup_date), "MMM d")}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Load Details */}
                    {expandedLoadId === load.id && (
                      <div className="px-12 pb-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Equipment</div>
                            <div className="font-medium text-slate-900 flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5" />
                              {load.equipment_type || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Weight</div>
                            <div className="font-medium text-slate-900">{load.weight_lbs?.toLocaleString() || "—"} lbs</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Commodity</div>
                            <div className="font-medium text-slate-900">{load.commodity || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Floor Rate</div>
                            <div className="font-medium text-slate-900">${load.floor_rate?.toLocaleString() || "—"}</div>
                          </div>
                        </div>
                        {load.special_instructions && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-700">
                            <span className="font-medium">Notes:</span> {load.special_instructions}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Link to="/trucking/loads">
                            <Button size="sm" variant="outline">Edit Load</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </TruckingContentCard>
      </Collapsible>

      {/* SECTION 2: Pending Leads (Carriers who called) */}
      <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
        <TruckingContentCard noPadding>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                {pendingOpen ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                <div>
                  <h3 className="font-semibold text-slate-900">Pending Leads</h3>
                  <p className="text-sm text-slate-500">Carriers interested, awaiting confirmation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-amber-100 text-amber-700">{recentLeads.length} leads</Badge>
                <Link to="/trucking/leads" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {recentLeads.length === 0 ? (
              <TruckingEmptyState
                icon={<UserCheck className="h-6 w-6 text-slate-400" />}
                title="No pending leads"
                description="Carriers who call about your loads will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{lead.company_name || lead.contact_name}</div>
                        <div className="text-sm text-slate-500">{lead.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-600">{lead.trucking_loads?.load_number || "—"}</div>
                        <div className="text-sm font-medium text-green-600">${lead.rate_offered?.toLocaleString() || "—"}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm">{formatDistanceToNow(new Date(lead.created_at), { addSuffix: false })}</span>
                      </div>
                      <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                      <div className="flex gap-1">
                        {lead.phone && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={`tel:${lead.phone}`}><PhoneCall className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => handleConfirmBooking(lead.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </TruckingContentCard>
      </Collapsible>

      {/* SECTION 3: Confirmed Loads */}
      <Collapsible open={confirmedOpen} onOpenChange={setConfirmedOpen}>
        <TruckingContentCard noPadding>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                {confirmedOpen ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                <div>
                  <h3 className="font-semibold text-slate-900">Confirmed Loads</h3>
                  <p className="text-sm text-slate-500">Loads with confirmed carriers ready to dispatch</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700">{confirmedLeads.length} confirmed</Badge>
                <Link to="/trucking/confirmed-leads" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {confirmedLeads.length === 0 ? (
              <TruckingEmptyState
                icon={<CheckCircle2 className="h-6 w-6 text-slate-400" />}
                title="No confirmed loads yet"
                description="When you confirm a carrier for a load, it will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {confirmedLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-green-50/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{lead.company_name || lead.contact_name}</div>
                        <div className="text-sm text-slate-500">
                          {lead.mc_number && <span>MC# {lead.mc_number}</span>}
                          {lead.mc_number && lead.dot_number && <span className="mx-1">·</span>}
                          {lead.dot_number && <span>DOT# {lead.dot_number}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium text-slate-900">{lead.trucking_loads?.load_number || "—"}</div>
                        <div className="text-sm text-slate-500">
                          {lead.trucking_loads ? `${lead.trucking_loads.origin_city}, ${lead.trucking_loads.origin_state} → ${lead.trucking_loads.destination_city}, ${lead.trucking_loads.destination_state}` : "—"}
                        </div>
                      </div>
                      <div className="font-semibold text-green-600">
                        ${(lead.rate_requested || lead.rate_offered)?.toLocaleString() || "—"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {lead.confirmed_at ? format(new Date(lead.confirmed_at), "MMM d, h:mm a") : "—"}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => handleConfirmBooking(lead.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Book
                        </Button>
                        {lead.phone && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={`tel:${lead.phone}`}><PhoneCall className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectLead(lead.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </TruckingContentCard>
      </Collapsible>
    </TruckingPageWrapper>
  );
}
