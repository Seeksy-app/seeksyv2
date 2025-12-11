import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Mail, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Lead {
  id: string;
  company_name: string;
  mc_number: string;
  dot_number: string;
  contact_name: string;
  phone: string;
  email: string;
  truck_type: string;
  rate_offered: number;
  rate_requested: number;
  status: string;
  source: string;
  notes: string;
  created_at: string;
  trucking_loads?: { load_number: string; origin_city: string; destination_city: string } | null;
}

const statusOptions = ["interested", "countered", "booked", "declined", "no_answer"];

export default function CarrierLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_carrier_leads")
        .select("*, trucking_loads(load_number, origin_city, destination_city)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Status updated" });
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      interested: "bg-yellow-500/10 text-yellow-500",
      countered: "bg-orange-500/10 text-orange-500",
      booked: "bg-green-500/10 text-green-500",
      declined: "bg-red-500/10 text-red-500",
      no_answer: "bg-gray-500/10 text-gray-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  const filteredLeads = filter === "all" ? leads : leads.filter((l) => l.status === filter);

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
          <h1 className="text-3xl font-bold">Carrier Leads</h1>
          <p className="text-muted-foreground">Carriers interested in your loads</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filter === "all" 
                ? "No leads yet. Carriers will appear here when they call about your loads."
                : `No ${filter.replace("_", " ")} leads.`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Rate Offered</TableHead>
                  <TableHead>Rate Requested</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.company_name || lead.contact_name}</div>
                        {lead.mc_number && (
                          <div className="text-xs text-muted-foreground">MC# {lead.mc_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.trucking_loads ? (
                        <div>
                          <div className="font-medium">{lead.trucking_loads.load_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {lead.trucking_loads.origin_city} → {lead.trucking_loads.destination_city}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${lead.rate_offered?.toLocaleString() || "—"}
                    </TableCell>
                    <TableCell>
                      {lead.rate_requested ? (
                        <span className="text-orange-500">${lead.rate_requested.toLocaleString()}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source || "ai_call"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => updateStatus(lead.id, value)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {lead.phone && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
