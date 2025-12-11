import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, UserCheck, Phone, Plus, ArrowRight, CheckCircle, DollarSign, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TruckingPageWrapper, TruckingContentCard, TruckingEmptyState, TruckingStatCardLight } from "@/components/trucking/TruckingPageWrapper";
import { useTruckingCostStats } from "@/hooks/useTruckingCostStats";

interface LoadStats {
  openLoads: number;
  leadsToday: number;
  callsToday: number;
  confirmedLoads: number;
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
  status: string;
}

interface Lead {
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
  const [stats, setStats] = useState<LoadStats>({ openLoads: 0, leadsToday: 0, callsToday: 0, confirmedLoads: 0 });
  const [hotLoads, setHotLoads] = useState<Load[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const costStats = useTruckingCostStats();

  const formatCost = (cost: number) => {
    if (cost === 0) return "—";
    if (cost < 0.01) return "< $0.01";
    return `$${cost.toFixed(2)}`;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [loadsResult, confirmedResult, leadsResult, callsResult] = await Promise.all([
        supabase.from("trucking_loads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("status", "open"),
        supabase.from("trucking_loads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("status", "booked"),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("owner_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("trucking_call_logs").select("id", { count: "exact" }).eq("owner_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        openLoads: loadsResult.count || 0,
        confirmedLoads: confirmedResult.count || 0,
        leadsToday: leadsResult.count || 0,
        callsToday: callsResult.count || 0,
      });

      const { data: loads } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      setHotLoads(loads || []);

      const { data: leads } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentLeads(leads || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-700",
      booked: "bg-blue-100 text-blue-700",
      interested: "bg-yellow-100 text-yellow-700",
      countered: "bg-orange-100 text-orange-700",
      declined: "bg-red-100 text-red-700",
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

  return (
    <TruckingPageWrapper 
      title="Dashboard" 
      description="Overview of your loads and leads"
      action={
        <Link to="/trucking/loads">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add Load
          </Button>
        </Link>
      }
    >
      {/* Stats Cards */}
      <TooltipProvider>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <TruckingStatCardLight 
            label="Open Loads" 
            value={stats.openLoads} 
            icon={<Package className="h-6 w-6 text-blue-600" />}
          />
          <TruckingStatCardLight 
            label="New Leads Today" 
            value={stats.leadsToday} 
            icon={<UserCheck className="h-6 w-6 text-green-600" />}
          />
          <TruckingStatCardLight 
            label="AI Calls Today" 
            value={stats.callsToday} 
            icon={<Phone className="h-6 w-6 text-amber-600" />}
          />
          <TruckingStatCardLight 
            label="Confirmed Loads" 
            value={stats.confirmedLoads} 
            icon={<CheckCircle className="h-6 w-6 text-purple-600" />}
          />
          {/* Cost Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-emerald-600" />
                <span className="text-sm text-slate-500">Est. Cost/Call</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="font-semibold mb-1">How this is calculated</p>
                  <p className="text-xs">We estimate this cost by counting how many characters the AI spoke in the last 20 live calls and applying your ElevenLabs rate (e.g. $50 per 1M characters). This is an estimate only.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {costStats.loading ? "..." : costStats.error ? "—" : formatCost(costStats.avgCostPerCall)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {costStats.callsLast20 > 0 ? `Based on last ${costStats.callsLast20} calls` : "No live calls yet"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-teal-600" />
                <span className="text-sm text-slate-500">Est. Cost/Mo</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="font-semibold mb-1">Monthly cost estimate</p>
                  <p className="text-xs">This is the sum of estimated ElevenLabs cost for all live AI calls this month (demo calls excluded). Calculated using total characters spoken by the AI and your configured price per 1M characters.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {costStats.loading ? "..." : costStats.error ? "—" : formatCost(costStats.totalCostThisMonth)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {costStats.callsThisMonth > 0 ? `${costStats.callsThisMonth} calls this month` : "No live calls yet"}
            </p>
          </div>
        </div>
      </TooltipProvider>

      {/* Recent Leads - Full Width */}
      <TruckingContentCard noPadding>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Recent Leads</h3>
            <p className="text-sm text-slate-500">Carriers interested in your loads</p>
          </div>
          <Link to="/trucking/leads">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <TruckingEmptyState
            icon={<UserCheck className="h-6 w-6 text-slate-400" />}
            title="No leads yet"
            description="Carriers will appear here when they call your AITrucking line about a load."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="text-slate-500 font-medium">Carrier</TableHead>
                  <TableHead className="text-slate-500 font-medium">Load</TableHead>
                  <TableHead className="text-slate-500 font-medium">Rate</TableHead>
                  <TableHead className="text-slate-500 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {lead.company_name || lead.contact_name}
                      </div>
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {lead.trucking_loads?.load_number || "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      ${lead.rate_offered?.toLocaleString() || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}</TruckingContentCard>
    </TruckingPageWrapper>
  );
}
