import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phoneFormat";

interface Carrier {
  id: string;
  company_name: string;
  mc_number: string;
  dot_number: string;
  contact_name: string;
  phone: string;
  email: string;
  equipment_types: string;
  notes: string;
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: "",
    mc_number: "",
    dot_number: "",
    contact_name: "",
    phone: "",
    email: "",
    equipment_types: "",
    notes: "",
  });

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_carriers")
        .select("*")
        .eq("owner_id", user.id)
        .order("company_name");

      if (error) throw error;
      setCarriers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const carrierData = {
        owner_id: user.id,
        ...formData,
      };

      if (editingCarrier) {
        const { error } = await supabase
          .from("trucking_carriers")
          .update(carrierData)
          .eq("id", editingCarrier.id);
        if (error) throw error;
        toast({ title: "Carrier updated" });
      } else {
        const { error } = await supabase
          .from("trucking_carriers")
          .insert(carrierData);
        if (error) throw error;
        toast({ title: "Carrier added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchCarriers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setFormData({
      company_name: carrier.company_name || "",
      mc_number: carrier.mc_number || "",
      dot_number: carrier.dot_number || "",
      contact_name: carrier.contact_name || "",
      phone: carrier.phone || "",
      email: carrier.email || "",
      equipment_types: carrier.equipment_types || "",
      notes: carrier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this carrier?")) return;
    
    try {
      const { error } = await supabase.from("trucking_carriers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Carrier deleted" });
      fetchCarriers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingCarrier(null);
    setFormData({
      company_name: "",
      mc_number: "",
      dot_number: "",
      contact_name: "",
      phone: "",
      email: "",
      equipment_types: "",
      notes: "",
    });
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
          <h1 className="text-3xl font-bold">Carriers</h1>
          <p className="text-muted-foreground">Your carrier directory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Carrier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCarrier ? "Edit Carrier" : "Add Carrier"}</DialogTitle>
              <DialogDescription>Add carrier details to your directory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>MC Number</Label>
                  <Input
                    value={formData.mc_number}
                    onChange={(e) => setFormData({ ...formData, mc_number: e.target.value })}
                    placeholder="MC-123456"
                  />
                </div>
                <div>
                  <Label>DOT Number</Label>
                  <Input
                    value={formData.dot_number}
                    onChange={(e) => setFormData({ ...formData, dot_number: e.target.value })}
                    placeholder="1234567"
                  />
                </div>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    type="tel"
                    placeholder="405-444-4444"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                  />
                </div>
              </div>
              <div>
                <Label>Equipment Types</Label>
                <Input
                  value={formData.equipment_types}
                  onChange={(e) => setFormData({ ...formData, equipment_types: e.target.value })}
                  placeholder="Dry Van, Reefer, Flatbed"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCarrier ? "Update Carrier" : "Add Carrier"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {carriers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No carriers yet. Add carriers to your directory.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>MC / DOT</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.map((carrier) => (
                  <TableRow key={carrier.id}>
                    <TableCell className="font-medium">{carrier.company_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {carrier.mc_number && <div>MC# {carrier.mc_number}</div>}
                        {carrier.dot_number && <div className="text-muted-foreground">DOT# {carrier.dot_number}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{carrier.contact_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{carrier.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{carrier.equipment_types || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {carrier.phone && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${carrier.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {carrier.email && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`mailto:${carrier.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(carrier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(carrier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
