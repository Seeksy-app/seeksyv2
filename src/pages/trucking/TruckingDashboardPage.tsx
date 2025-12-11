import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, UserCheck, Phone, Plus, ArrowRight, CheckCircle2, XCircle, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper, TruckingContentCard, TruckingEmptyState, TruckingStatCardLight } from "@/components/trucking/TruckingPageWrapper";
import { format } from "date-fns";

interface DashboardStats {
  openLoads: number;
  leadsToday: number;
  callsToday: number;
  confirmedLeads: number;
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
  const [confirmedLeads, setConfirmedLeads] = useState<ConfirmedLead[]>([]);
  const [recentLeads, setRecentLeads] = useState<CarrierLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch stats
      const [loadsResult, confirmedResult, leadsResult, callsResult] = await Promise.all([
        supabase.from("trucking_loads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("status", "open"),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("is_confirmed", true),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("is_confirmed", false).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("trucking_call_logs").select("id", { count: "exact" }).eq("owner_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        openLoads: loadsResult.count || 0,
        confirmedLeads: confirmedResult.count || 0,
        leadsToday: leadsResult.count || 0,
        callsToday: callsResult.count || 0,
      });

      // Fetch confirmed leads
      const { data: confirmed } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number, origin_city, origin_state, destination_city, destination_state)")
        .eq("owner_id", user.id)
        .eq("is_confirmed", true)
        .order("confirmed_at", { ascending: false })
        .limit(10);

      setConfirmedLeads(confirmed || []);

      // Fetch recent unconfirmed leads
      const { data: leads } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number)")
        .eq("owner_id", user.id)
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
      {/* Stats Cards - 4 cards only */}
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
          label="Confirmed Leads" 
          value={stats.confirmedLeads} 
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
        />
      </div>

      {/* Section A: Confirmed Leads (PRIMARY) */}
      <TruckingContentCard noPadding>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Confirmed Leads</h3>
            <p className="text-sm text-slate-500">Carriers ready to book loads</p>
          </div>
        </div>
        {confirmedLeads.length === 0 ? (
          <TruckingEmptyState
            icon={<CheckCircle2 className="h-6 w-6 text-slate-400" />}
            title="No confirmed leads yet"
            description="When carriers confirm they want to take a load, they'll appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="text-slate-500 font-medium">Carrier Name</TableHead>
                  <TableHead className="text-slate-500 font-medium">MC / DOT</TableHead>
                  <TableHead className="text-slate-500 font-medium">Load #</TableHead>
                  <TableHead className="text-slate-500 font-medium">Lane</TableHead>
                  <TableHead className="text-slate-500 font-medium">Rate</TableHead>
                  <TableHead className="text-slate-500 font-medium">Confirmed At</TableHead>
                  <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-slate-50 hover:bg-green-50/50">
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {lead.company_name || lead.contact_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {lead.mc_number && <span>MC# {lead.mc_number}</span>}
                      {lead.mc_number && lead.dot_number && <span className="mx-1">·</span>}
                      {lead.dot_number && <span>DOT# {lead.dot_number}</span>}
                      {!lead.mc_number && !lead.dot_number && "—"}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {lead.trucking_loads?.load_number || "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {lead.trucking_loads ? (
                        `${lead.trucking_loads.origin_city}, ${lead.trucking_loads.origin_state} → ${lead.trucking_loads.destination_city}, ${lead.trucking_loads.destination_state}`
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${(lead.rate_requested || lead.rate_offered)?.toLocaleString() || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {lead.confirmed_at ? format(new Date(lead.confirmed_at), "MMM d, h:mm a") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => handleConfirmBooking(lead.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Book
                        </Button>
                        {lead.phone && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <PhoneCall className="h-3.5 w-3.5" />
                            </a>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TruckingContentCard>

      {/* Section B: Recent Carrier Leads (Unconfirmed) */}
      <TruckingContentCard noPadding>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Recent Carrier Leads</h3>
            <p className="text-sm text-slate-500">Unconfirmed inbound interest</p>
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
        )}
      </TruckingContentCard>
    </TruckingPageWrapper>
  );
}