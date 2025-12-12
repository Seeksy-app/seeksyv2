import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Mail, UserCheck, CheckCircle2, XCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TruckingPageWrapper, TruckingContentCard, TruckingEmptyState } from "@/components/trucking/TruckingPageWrapper";

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
  is_confirmed: boolean;
  created_at: string;
  call_log_id: string | null;
  trucking_loads?: { load_number: string; origin_city: string; origin_state: string; destination_city: string; destination_state: string } | null;
  trucking_call_logs?: { transcript_url: string } | null;
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
        .select("*, trucking_loads(load_number, origin_city, origin_state, destination_city, destination_state), trucking_call_logs!trucking_carrier_leads_call_log_id_fkey(transcript_url)")
        .eq("owner_id", user.id)
        .eq("is_confirmed", false)
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

  const confirmLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ 
          is_confirmed: true, 
          confirmed_at: new Date().toISOString(),
          status: "booked"
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Lead confirmed!", description: "Carrier moved to Confirmed Leads" });
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const markNotInterested = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ status: "declined" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Lead marked as not interested" });
      fetchLeads();
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
      no_answer: "bg-slate-100 text-slate-600",
    };
    return colors[status] || "bg-slate-100 text-slate-600";
  };

  const filteredLeads = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <TruckingPageWrapper 
      title="Carrier Leads" 
      description="Unconfirmed inbound interest from carriers"
      action={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-white border-slate-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <TruckingContentCard noPadding>
        {filteredLeads.length === 0 ? (
          <TruckingEmptyState
            icon={<UserCheck className="h-6 w-6 text-slate-400" />}
            title={filter === "all" ? "No leads yet" : `No ${filter.replace("_", " ")} leads`}
            description="Carriers will appear here when they call your AITrucking line about a load."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-slate-500 font-medium">Carrier</TableHead>
                  <TableHead className="text-slate-500 font-medium">MC / DOT</TableHead>
                  <TableHead className="text-slate-500 font-medium">Load / Lane</TableHead>
                  <TableHead className="text-slate-500 font-medium">Rate Discussed</TableHead>
                  <TableHead className="text-slate-500 font-medium">Status</TableHead>
                  <TableHead className="text-slate-500 font-medium">Date</TableHead>
                  <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell>
                      <div className="font-medium text-slate-900">{lead.company_name || lead.contact_name}</div>
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {lead.mc_number && <div>MC# {lead.mc_number}</div>}
                      {lead.dot_number && <div>DOT# {lead.dot_number}</div>}
                      {!lead.mc_number && !lead.dot_number && "—"}
                    </TableCell>
                    <TableCell>
                      {lead.trucking_loads ? (
                        <div>
                          <div className="font-medium text-slate-900">{lead.trucking_loads.load_number}</div>
                          <div className="text-xs text-slate-500">
                            {lead.trucking_loads.origin_city}, {lead.trucking_loads.origin_state} → {lead.trucking_loads.destination_city}, {lead.trucking_loads.destination_state}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {lead.rate_offered && (
                          <span className="text-slate-900 font-medium">${lead.rate_offered.toLocaleString()}</span>
                        )}
                        {lead.rate_requested && (
                          <span className="text-orange-600 text-sm">Asked: ${lead.rate_requested.toLocaleString()}</span>
                        )}
                        {!lead.rate_offered && !lead.rate_requested && <span className="text-slate-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => updateStatus(lead.id, value)}
                      >
                        <SelectTrigger className="h-8 w-28 border-0 bg-transparent p-0">
                          <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(lead.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Confirm Lead Button - PRIMARY */}
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => confirmLead(lead.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                        {lead.phone && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {lead.trucking_call_logs?.transcript_url && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={lead.trucking_call_logs.transcript_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => markNotInterested(lead.id)}
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
    </TruckingPageWrapper>
  );
}