import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, UserCheck, Phone, TrendingUp, Plus, ArrowRight } from "lucide-react";
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

      // Fetch stats
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

      // Fetch hot loads
      const { data: loads } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      setHotLoads(loads || []);

      // Fetch recent leads
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

  const statCards = [
    { label: "Open Loads", value: stats.openLoads, icon: Package, color: "text-blue-500" },
    { label: "New Leads Today", value: stats.leadsToday, icon: UserCheck, color: "text-green-500" },
    { label: "AI Calls Today", value: stats.callsToday, icon: Phone, color: "text-purple-500" },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500/10 text-green-500",
      booked: "bg-blue-500/10 text-blue-500",
      interested: "bg-yellow-500/10 text-yellow-500",
      countered: "bg-orange-500/10 text-orange-500",
      declined: "bg-red-500/10 text-red-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your loads and leads</p>
        </div>
        <Link to="/trucking/loads">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Load
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hot Loads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Hot Loads</CardTitle>
              <CardDescription>Your open loads ready for carriers</CardDescription>
            </div>
            <Link to="/trucking/loads">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {hotLoads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No open loads. Add your first load to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotLoads.map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.load_number}</TableCell>
                      <TableCell>
                        {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
                      </TableCell>
                      <TableCell>{load.pickup_date}</TableCell>
                      <TableCell>${load.target_rate?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Carriers interested in your loads</CardDescription>
            </div>
            <Link to="/trucking/leads">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads yet. Carriers will appear here when they call.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.company_name || lead.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </TableCell>
                      <TableCell>{lead.trucking_loads?.load_number || "—"}</TableCell>
                      <TableCell>${lead.rate_offered?.toLocaleString() || "—"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
