import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Load {
  id: string;
  load_number: string;
  reference: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  pickup_date: string;
  delivery_date: string;
  equipment_type: string;
  commodity: string;
  weight_lbs: number;
  miles: number;
  target_rate: number;
  floor_rate: number;
  status: string;
  notes: string;
}

const equipmentTypes = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Hotshot"];

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    load_number: "",
    reference: "",
    origin_city: "",
    origin_state: "",
    destination_city: "",
    destination_state: "",
    pickup_date: "",
    delivery_date: "",
    equipment_type: "Dry Van",
    commodity: "",
    weight_lbs: "",
    miles: "",
    target_rate: "",
    floor_rate: "",
    notes: "",
  });

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data || []);
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

      const loadData = {
        owner_id: user.id,
        load_number: formData.load_number,
        reference: formData.reference,
        origin_city: formData.origin_city,
        origin_state: formData.origin_state,
        destination_city: formData.destination_city,
        destination_state: formData.destination_state,
        pickup_date: formData.pickup_date || null,
        delivery_date: formData.delivery_date || null,
        equipment_type: formData.equipment_type,
        commodity: formData.commodity,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        miles: formData.miles ? parseInt(formData.miles) : null,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        floor_rate: formData.floor_rate ? parseFloat(formData.floor_rate) : null,
        notes: formData.notes,
      };

      if (editingLoad) {
        const { error } = await supabase
          .from("trucking_loads")
          .update(loadData)
          .eq("id", editingLoad.id);
        if (error) throw error;
        toast({ title: "Load updated" });
      } else {
        const { error } = await supabase
          .from("trucking_loads")
          .insert(loadData);
        if (error) throw error;
        toast({ title: "Load created" });
      }

      setDialogOpen(false);
      resetForm();
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setFormData({
      load_number: load.load_number || "",
      reference: load.reference || "",
      origin_city: load.origin_city || "",
      origin_state: load.origin_state || "",
      destination_city: load.destination_city || "",
      destination_state: load.destination_state || "",
      pickup_date: load.pickup_date || "",
      delivery_date: load.delivery_date || "",
      equipment_type: load.equipment_type || "Dry Van",
      commodity: load.commodity || "",
      weight_lbs: load.weight_lbs?.toString() || "",
      miles: load.miles?.toString() || "",
      target_rate: load.target_rate?.toString() || "",
      floor_rate: load.floor_rate?.toString() || "",
      notes: load.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this load?")) return;
    
    try {
      const { error } = await supabase.from("trucking_loads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Load deleted" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingLoad(null);
    setFormData({
      load_number: "",
      reference: "",
      origin_city: "",
      origin_state: "",
      destination_city: "",
      destination_state: "",
      pickup_date: "",
      delivery_date: "",
      equipment_type: "Dry Van",
      commodity: "",
      weight_lbs: "",
      miles: "",
      target_rate: "",
      floor_rate: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500/10 text-green-500",
      booked: "bg-blue-500/10 text-blue-500",
      delivered: "bg-purple-500/10 text-purple-500",
      cancelled: "bg-red-500/10 text-red-500",
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
          <h1 className="text-3xl font-bold">Loads</h1>
          <p className="text-muted-foreground">Manage your freight loads</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Load
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLoad ? "Edit Load" : "Add New Load"}</DialogTitle>
              <DialogDescription>Enter the load details for carrier calls</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Load Number *</Label>
                  <Input
                    value={formData.load_number}
                    onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                    required
                    placeholder="e.g., LD-12345"
                  />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="PO or ref number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Origin
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.origin_city}
                      onChange={(e) => setFormData({ ...formData, origin_city: e.target.value })}
                      placeholder="City"
                    />
                    <Input
                      value={formData.origin_state}
                      onChange={(e) => setFormData({ ...formData, origin_state: e.target.value })}
                      placeholder="State"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Destination
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.destination_city}
                      onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
                      placeholder="City"
                    />
                    <Input
                      value={formData.destination_state}
                      onChange={(e) => setFormData({ ...formData, destination_state: e.target.value })}
                      placeholder="State"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pickup Date</Label>
                  <Input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Equipment Type</Label>
                  <Select
                    value={formData.equipment_type}
                    onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={formData.weight_lbs}
                    onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                    placeholder="40000"
                  />
                </div>
                <div>
                  <Label>Miles</Label>
                  <Input
                    type="number"
                    value={formData.miles}
                    onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label>Commodity</Label>
                <Input
                  value={formData.commodity}
                  onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                  placeholder="e.g., General freight, palletized"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_rate}
                    onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label>Floor Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.floor_rate}
                    onChange={(e) => setFormData({ ...formData, floor_rate: e.target.value })}
                    placeholder="2200"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions, appointment times, etc."
                />
              </div>

              <Button type="submit" className="w-full">
                {editingLoad ? "Update Load" : "Create Load"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No loads yet. Add your first load to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Target Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">{load.load_number}</TableCell>
                    <TableCell>
                      {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
                    </TableCell>
                    <TableCell>{load.pickup_date || "—"}</TableCell>
                    <TableCell>{load.equipment_type}</TableCell>
                    <TableCell>${load.target_rate?.toLocaleString() || "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(load.status)}>{load.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(load)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(load.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
