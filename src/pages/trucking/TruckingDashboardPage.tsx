import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TruckingLayout, { truckingTheme } from "@/components/trucking/TruckingLayout";
import { TruckingCard, TruckingCardHeader, TruckingStatCard } from "@/components/trucking/TruckingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, UserCheck, Phone, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoadStats {
  openLoads: number;
  leadsToday: number;
  callsToday: number;
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
  const [stats, setStats] = useState<LoadStats>({ openLoads: 0, leadsToday: 0, callsToday: 0 });
  const [hotLoads, setHotLoads] = useState<Load[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [loadsResult, leadsResult, callsResult] = await Promise.all([
        supabase.from("trucking_loads").select("id", { count: "exact" }).eq("owner_id", user.id).eq("status", "open"),
        supabase.from("trucking_carrier_leads").select("id", { count: "exact" }).eq("owner_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("trucking_call_logs").select("id", { count: "exact" }).eq("owner_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        openLoads: loadsResult.count || 0,
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
    const colors: Record<string, { bg: string; text: string }> = {
      open: { bg: `${truckingTheme.accent.green}20`, text: truckingTheme.accent.green },
      booked: { bg: `${truckingTheme.accent.blue}20`, text: truckingTheme.accent.blue },
      interested: { bg: `${truckingTheme.accent.yellow}20`, text: truckingTheme.accent.yellow },
      countered: { bg: "#F9731620", text: "#F97316" },
      declined: { bg: `${truckingTheme.accent.red}20`, text: truckingTheme.accent.red },
    };
    return colors[status] || { bg: "#6B728020", text: "#6B7280" };
  };

  if (loading) {
    return (
      <TruckingLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: truckingTheme.accent.blue }}
          />
        </div>
      </TruckingLayout>
    );
  }

  return (
    <TruckingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ color: truckingTheme.text.primary }}
            >
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: truckingTheme.text.secondary }}>
              Overview of your loads and leads
            </p>
          </div>
          <Link to="/trucking/loads">
            <Button 
              className="rounded-full text-white"
              style={{ backgroundColor: truckingTheme.accent.blue }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Load
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <TruckingStatCard 
            label="Open Loads" 
            value={stats.openLoads} 
            icon={<Package className="h-6 w-6" style={{ color: truckingTheme.accent.blue }} />}
            accentColor={truckingTheme.accent.blue}
          />
          <TruckingStatCard 
            label="New Leads Today" 
            value={stats.leadsToday} 
            icon={<UserCheck className="h-6 w-6" style={{ color: truckingTheme.accent.green }} />}
            accentColor={truckingTheme.accent.green}
          />
          <TruckingStatCard 
            label="AI Calls Today" 
            value={stats.callsToday} 
            icon={<Phone className="h-6 w-6" style={{ color: truckingTheme.accent.yellow }} />}
            accentColor={truckingTheme.accent.yellow}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hot Loads */}
          <TruckingCard>
            <TruckingCardHeader 
              title="Hot Loads" 
              description="Your open loads ready for carriers"
              action={
                <Link to="/trucking/loads">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              }
            />
            {hotLoads.length === 0 ? (
              <div className="text-center py-8" style={{ color: truckingTheme.text.muted }}>
                No open loads. Add your first load to get started.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b" style={{ borderColor: truckingTheme.card.border }}>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Load #</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Lane</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Pickup</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotLoads.map((load) => (
                      <TableRow 
                        key={load.id} 
                        className="border-b hover:bg-white/5"
                        style={{ borderColor: truckingTheme.card.border }}
                      >
                        <TableCell className="font-medium" style={{ color: truckingTheme.text.primary }}>
                          {load.load_number}
                        </TableCell>
                        <TableCell style={{ color: truckingTheme.text.secondary }}>
                          {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
                        </TableCell>
                        <TableCell style={{ color: truckingTheme.text.secondary }}>{load.pickup_date}</TableCell>
                        <TableCell style={{ color: truckingTheme.accent.yellow }}>
                          ${load.target_rate?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TruckingCard>

          {/* Recent Leads */}
          <TruckingCard>
            <TruckingCardHeader 
              title="Recent Leads" 
              description="Carriers interested in your loads"
              action={
                <Link to="/trucking/leads">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              }
            />
            {recentLeads.length === 0 ? (
              <div className="text-center py-8" style={{ color: truckingTheme.text.muted }}>
                No leads yet. Carriers will appear here when they call.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b" style={{ borderColor: truckingTheme.card.border }}>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Carrier</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Load</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Rate</TableHead>
                      <TableHead style={{ color: truckingTheme.text.muted }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((lead) => {
                      const statusColors = getStatusBadge(lead.status);
                      return (
                        <TableRow 
                          key={lead.id}
                          className="border-b hover:bg-white/5"
                          style={{ borderColor: truckingTheme.card.border }}
                        >
                          <TableCell>
                            <div className="font-medium" style={{ color: truckingTheme.text.primary }}>
                              {lead.company_name || lead.contact_name}
                            </div>
                            <div className="text-xs" style={{ color: truckingTheme.text.muted }}>{lead.phone}</div>
                          </TableCell>
                          <TableCell style={{ color: truckingTheme.text.secondary }}>
                            {lead.trucking_loads?.load_number || "—"}
                          </TableCell>
                          <TableCell style={{ color: truckingTheme.text.secondary }}>
                            ${lead.rate_offered?.toLocaleString() || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="border-0"
                              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TruckingCard>
        </div>
      </div>
    </TruckingLayout>
  );
}
