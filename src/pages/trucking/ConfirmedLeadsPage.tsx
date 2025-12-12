import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, CheckCircle2, XCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TruckingPageWrapper, TruckingContentCard, TruckingEmptyState } from "@/components/trucking/TruckingPageWrapper";

interface ConfirmedLead {
  id: string;
  company_name: string;
  mc_number: string;
  dot_number: string;
  contact_name: string;
  phone: string;
  email: string;
  rate_offered: number;
  rate_requested: number;
  status: string;
  confirmed_at: string;
  created_at: string;
  trucking_loads?: { load_number: string; origin_city: string; origin_state: string; destination_city: string; destination_state: string } | null;
  call_log?: { transcript_url: string } | null;
}

export default function ConfirmedLeadsPage() {
  const [leads, setLeads] = useState<ConfirmedLead[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select(`
          *,
          trucking_loads(load_number, origin_city, origin_state, destination_city, destination_state),
          call_log:trucking_call_logs!call_log_id(transcript_url)
        `)
        .eq("owner_id", user.id)
        .eq("is_confirmed", true)
        .order("confirmed_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ status: "booked" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Booking confirmed!" });
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const rejectLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ is_confirmed: false, status: "declined" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Lead rejected and moved back to Carrier Leads" });
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
    };
    return colors[status] || "bg-slate-100 text-slate-600";
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
      title="Confirmed Leads" 
      description="Carriers ready to book loads"
    >
      <TruckingContentCard noPadding>
        {leads.length === 0 ? (
          <TruckingEmptyState
            icon={<CheckCircle2 className="h-6 w-6 text-slate-400" />}
            title="No confirmed leads yet"
            description="When carriers confirm they want to take a load, they'll appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-slate-500 font-medium">Carrier Name</TableHead>
                  <TableHead className="text-slate-500 font-medium">MC / DOT</TableHead>
                  <TableHead className="text-slate-500 font-medium">Load #</TableHead>
                  <TableHead className="text-slate-500 font-medium">Lane</TableHead>
                  <TableHead className="text-slate-500 font-medium">Rate</TableHead>
                  <TableHead className="text-slate-500 font-medium">Status</TableHead>
                  <TableHead className="text-slate-500 font-medium">Confirmed At</TableHead>
                  <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-slate-100 hover:bg-green-50/50">
                    <TableCell>
                      <div className="font-medium text-slate-900">{lead.company_name || lead.contact_name}</div>
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {lead.mc_number && <div>MC# {lead.mc_number}</div>}
                      {lead.dot_number && <div>DOT# {lead.dot_number}</div>}
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
                    <TableCell>
                      <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {lead.confirmed_at ? format(new Date(lead.confirmed_at), "MMM d, h:mm a") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => confirmBooking(lead.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Book
                        </Button>
                        {lead.phone && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {lead.call_log?.transcript_url && (
                          <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                            <a href={lead.call_log.transcript_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => rejectLead(lead.id)}
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