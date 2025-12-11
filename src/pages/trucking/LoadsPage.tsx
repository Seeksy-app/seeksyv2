import { useEffect, useState } from "react";
import TruckingLayout from "@/components/trucking/TruckingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, MapPin, Check, Copy, CheckCircle2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Load {
  id: string;
  load_number: string;
  reference: string;
  origin_city: string;
  origin_state: string;
  origin_zip: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  pickup_date: string;
  pickup_window_start: string;
  pickup_window_end: string;
  pickup_appointment_required: boolean;
  pickup_fcfs: boolean;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  delivery_date: string;
  delivery_window_start: string;
  delivery_window_end: string;
  delivery_appointment_required: boolean;
  delivery_fcfs: boolean;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  equipment_type: string;
  equipment_notes: string;
  commodity: string;
  hazmat: boolean;
  temp_required: boolean;
  temp_min_f: number;
  temp_max_f: number;
  weight_lbs: number;
  length_ft: number;
  pieces: number;
  miles: number;
  target_rate: number;
  floor_rate: number;
  detention_rate_per_hour: number;
  layover_rate: number;
  tonu_rate: number;
  lumpers_covered: boolean;
  special_instructions: string;
  internal_notes: string;
  notes: string;
  status: string;
  is_active: boolean;
}

const equipmentTypes = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Hotshot", "Conestoga", "Double Drop", "RGN"];

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [activeTab, setActiveTab] = useState("open");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    load_number: "",
    reference: "",
    origin_city: "",
    origin_state: "",
    origin_zip: "",
    destination_city: "",
    destination_state: "",
    destination_zip: "",
    pickup_date: "",
    pickup_window_start: "",
    pickup_window_end: "",
    pickup_appointment_required: false,
    pickup_fcfs: true,
    pickup_contact_name: "",
    pickup_contact_phone: "",
    delivery_date: "",
    delivery_window_start: "",
    delivery_window_end: "",
    delivery_appointment_required: false,
    delivery_fcfs: true,
    delivery_contact_name: "",
    delivery_contact_phone: "",
    equipment_type: "Dry Van",
    equipment_notes: "",
    commodity: "",
    hazmat: false,
    temp_required: false,
    temp_min_f: "",
    temp_max_f: "",
    weight_lbs: "",
    length_ft: "",
    pieces: "",
    miles: "",
    target_rate: "",
    floor_rate: "",
    detention_rate_per_hour: "",
    layover_rate: "",
    tonu_rate: "",
    lumpers_covered: true,
    special_instructions: "",
    internal_notes: "",
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
      setLoads((data as Load[]) || []);
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
        origin_zip: formData.origin_zip,
        destination_city: formData.destination_city,
        destination_state: formData.destination_state,
        destination_zip: formData.destination_zip,
        pickup_date: formData.pickup_date || null,
        pickup_window_start: formData.pickup_window_start || null,
        pickup_window_end: formData.pickup_window_end || null,
        pickup_appointment_required: formData.pickup_appointment_required,
        pickup_fcfs: formData.pickup_fcfs,
        pickup_contact_name: formData.pickup_contact_name,
        pickup_contact_phone: formData.pickup_contact_phone,
        delivery_date: formData.delivery_date || null,
        delivery_window_start: formData.delivery_window_start || null,
        delivery_window_end: formData.delivery_window_end || null,
        delivery_appointment_required: formData.delivery_appointment_required,
        delivery_fcfs: formData.delivery_fcfs,
        delivery_contact_name: formData.delivery_contact_name,
        delivery_contact_phone: formData.delivery_contact_phone,
        equipment_type: formData.equipment_type,
        equipment_notes: formData.equipment_notes,
        commodity: formData.commodity,
        hazmat: formData.hazmat,
        temp_required: formData.temp_required,
        temp_min_f: formData.temp_min_f ? parseFloat(formData.temp_min_f) : null,
        temp_max_f: formData.temp_max_f ? parseFloat(formData.temp_max_f) : null,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        length_ft: formData.length_ft ? parseInt(formData.length_ft) : null,
        pieces: formData.pieces ? parseInt(formData.pieces) : null,
        miles: formData.miles ? parseInt(formData.miles) : null,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        floor_rate: formData.floor_rate ? parseFloat(formData.floor_rate) : null,
        detention_rate_per_hour: formData.detention_rate_per_hour ? parseFloat(formData.detention_rate_per_hour) : null,
        layover_rate: formData.layover_rate ? parseFloat(formData.layover_rate) : null,
        tonu_rate: formData.tonu_rate ? parseFloat(formData.tonu_rate) : null,
        lumpers_covered: formData.lumpers_covered,
        special_instructions: formData.special_instructions,
        internal_notes: formData.internal_notes,
        notes: formData.notes,
        status: "open",
        is_active: true,
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
      origin_zip: load.origin_zip || "",
      destination_city: load.destination_city || "",
      destination_state: load.destination_state || "",
      destination_zip: load.destination_zip || "",
      pickup_date: load.pickup_date || "",
      pickup_window_start: load.pickup_window_start || "",
      pickup_window_end: load.pickup_window_end || "",
      pickup_appointment_required: load.pickup_appointment_required || false,
      pickup_fcfs: load.pickup_fcfs ?? true,
      pickup_contact_name: load.pickup_contact_name || "",
      pickup_contact_phone: load.pickup_contact_phone || "",
      delivery_date: load.delivery_date || "",
      delivery_window_start: load.delivery_window_start || "",
      delivery_window_end: load.delivery_window_end || "",
      delivery_appointment_required: load.delivery_appointment_required || false,
      delivery_fcfs: load.delivery_fcfs ?? true,
      delivery_contact_name: load.delivery_contact_name || "",
      delivery_contact_phone: load.delivery_contact_phone || "",
      equipment_type: load.equipment_type || "Dry Van",
      equipment_notes: load.equipment_notes || "",
      commodity: load.commodity || "",
      hazmat: load.hazmat || false,
      temp_required: load.temp_required || false,
      temp_min_f: load.temp_min_f?.toString() || "",
      temp_max_f: load.temp_max_f?.toString() || "",
      weight_lbs: load.weight_lbs?.toString() || "",
      length_ft: load.length_ft?.toString() || "",
      pieces: load.pieces?.toString() || "",
      miles: load.miles?.toString() || "",
      target_rate: load.target_rate?.toString() || "",
      floor_rate: load.floor_rate?.toString() || "",
      detention_rate_per_hour: load.detention_rate_per_hour?.toString() || "",
      layover_rate: load.layover_rate?.toString() || "",
      tonu_rate: load.tonu_rate?.toString() || "",
      lumpers_covered: load.lumpers_covered ?? true,
      special_instructions: load.special_instructions || "",
      internal_notes: load.internal_notes || "",
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

  const handleConfirmLoad = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "booked", is_active: false })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load confirmed and moved to Confirmed" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDuplicateLoad = async (load: Load) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newLoad = {
        owner_id: user.id,
        load_number: `${load.load_number}-COPY`,
        reference: load.reference,
        origin_city: load.origin_city,
        origin_state: load.origin_state,
        origin_zip: load.origin_zip,
        destination_city: load.destination_city,
        destination_state: load.destination_state,
        destination_zip: load.destination_zip,
        pickup_date: null,
        pickup_window_start: load.pickup_window_start,
        pickup_window_end: load.pickup_window_end,
        pickup_appointment_required: load.pickup_appointment_required,
        pickup_fcfs: load.pickup_fcfs,
        pickup_contact_name: load.pickup_contact_name,
        pickup_contact_phone: load.pickup_contact_phone,
        delivery_date: null,
        delivery_window_start: load.delivery_window_start,
        delivery_window_end: load.delivery_window_end,
        delivery_appointment_required: load.delivery_appointment_required,
        delivery_fcfs: load.delivery_fcfs,
        delivery_contact_name: load.delivery_contact_name,
        delivery_contact_phone: load.delivery_contact_phone,
        equipment_type: load.equipment_type,
        equipment_notes: load.equipment_notes,
        commodity: load.commodity,
        hazmat: load.hazmat,
        temp_required: load.temp_required,
        temp_min_f: load.temp_min_f,
        temp_max_f: load.temp_max_f,
        weight_lbs: load.weight_lbs,
        length_ft: load.length_ft,
        pieces: load.pieces,
        miles: load.miles,
        target_rate: load.target_rate,
        floor_rate: load.floor_rate,
        detention_rate_per_hour: load.detention_rate_per_hour,
        layover_rate: load.layover_rate,
        tonu_rate: load.tonu_rate,
        lumpers_covered: load.lumpers_covered,
        special_instructions: load.special_instructions,
        internal_notes: load.internal_notes,
        notes: load.notes,
        status: "open",
        is_active: true,
      };

      const { error } = await supabase.from("trucking_loads").insert(newLoad);
      if (error) throw error;
      toast({ title: "Load duplicated" });
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
      origin_zip: "",
      destination_city: "",
      destination_state: "",
      destination_zip: "",
      pickup_date: "",
      pickup_window_start: "",
      pickup_window_end: "",
      pickup_appointment_required: false,
      pickup_fcfs: true,
      pickup_contact_name: "",
      pickup_contact_phone: "",
      delivery_date: "",
      delivery_window_start: "",
      delivery_window_end: "",
      delivery_appointment_required: false,
      delivery_fcfs: true,
      delivery_contact_name: "",
      delivery_contact_phone: "",
      equipment_type: "Dry Van",
      equipment_notes: "",
      commodity: "",
      hazmat: false,
      temp_required: false,
      temp_min_f: "",
      temp_max_f: "",
      weight_lbs: "",
      length_ft: "",
      pieces: "",
      miles: "",
      target_rate: "",
      floor_rate: "",
      detention_rate_per_hour: "",
      layover_rate: "",
      tonu_rate: "",
      lumpers_covered: true,
      special_instructions: "",
      internal_notes: "",
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

  const openLoads = loads.filter(l => l.status === "open" && l.is_active !== false);
  const confirmedLoads = loads.filter(l => l.status === "booked" || l.is_active === false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const LoadsTable = ({ loadsData, showConfirmButton = false }: { loadsData: Load[], showConfirmButton?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Load #</TableHead>
          <TableHead>Lane</TableHead>
          <TableHead>Pickup</TableHead>
          <TableHead>Equipment</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Target Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loadsData.map((load) => (
          <TableRow key={load.id}>
            <TableCell className="font-medium">{load.load_number}</TableCell>
            <TableCell>
              {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
            </TableCell>
            <TableCell>
              <div>{load.pickup_date || "—"}</div>
              {load.pickup_window_start && (
                <div className="text-xs text-muted-foreground">
                  {load.pickup_window_start} - {load.pickup_window_end}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div>{load.equipment_type}</div>
              {load.hazmat && <Badge variant="destructive" className="text-xs">HAZMAT</Badge>}
              {load.temp_required && <Badge variant="secondary" className="text-xs">TEMP</Badge>}
            </TableCell>
            <TableCell>{load.weight_lbs?.toLocaleString() || "—"} lbs</TableCell>
            <TableCell>${load.target_rate?.toLocaleString() || "—"}</TableCell>
            <TableCell>
              <Badge className={getStatusBadge(load.status)}>{load.status}</Badge>
            </TableCell>
            <TableCell className="text-right space-x-1">
              {showConfirmButton && (
                <Button variant="ghost" size="icon" onClick={() => handleConfirmLoad(load.id)} title="Confirm Load">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleDuplicateLoad(load)} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loads</h1>
          <p className="text-muted-foreground">Manage your freight loads for Jess to share with carriers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Load
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLoad ? "Edit Load" : "Add New Load"}</DialogTitle>
              <DialogDescription>Enter the load details for carrier calls</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
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

              {/* Origin */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Pickup Location
                </h3>
                <div className="grid grid-cols-3 gap-4">
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
                  <Input
                    value={formData.origin_zip}
                    onChange={(e) => setFormData({ ...formData, origin_zip: e.target.value })}
                    placeholder="ZIP"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Pickup Date</Label>
                    <Input
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Open Time</Label>
                    <Input
                      type="time"
                      value={formData.pickup_window_start}
                      onChange={(e) => setFormData({ ...formData, pickup_window_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Close Time</Label>
                    <Input
                      type="time"
                      value={formData.pickup_window_end}
                      onChange={(e) => setFormData({ ...formData, pickup_window_end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.pickup_contact_name}
                      onChange={(e) => setFormData({ ...formData, pickup_contact_name: e.target.value })}
                      placeholder="Shipper contact"
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.pickup_contact_phone}
                      onChange={(e) => setFormData({ ...formData, pickup_contact_phone: e.target.value })}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.pickup_fcfs}
                      onCheckedChange={(checked) => setFormData({ ...formData, pickup_fcfs: checked })}
                    />
                    <Label>First Come First Serve</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.pickup_appointment_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, pickup_appointment_required: checked })}
                    />
                    <Label>Appointment Required</Label>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Delivery Location
                </h3>
                <div className="grid grid-cols-3 gap-4">
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
                  <Input
                    value={formData.destination_zip}
                    onChange={(e) => setFormData({ ...formData, destination_zip: e.target.value })}
                    placeholder="ZIP"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Open Time</Label>
                    <Input
                      type="time"
                      value={formData.delivery_window_start}
                      onChange={(e) => setFormData({ ...formData, delivery_window_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Close Time</Label>
                    <Input
                      type="time"
                      value={formData.delivery_window_end}
                      onChange={(e) => setFormData({ ...formData, delivery_window_end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.delivery_contact_name}
                      onChange={(e) => setFormData({ ...formData, delivery_contact_name: e.target.value })}
                      placeholder="Receiver contact"
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.delivery_contact_phone}
                      onChange={(e) => setFormData({ ...formData, delivery_contact_phone: e.target.value })}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.delivery_fcfs}
                      onCheckedChange={(checked) => setFormData({ ...formData, delivery_fcfs: checked })}
                    />
                    <Label>First Come First Serve</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.delivery_appointment_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, delivery_appointment_required: checked })}
                    />
                    <Label>Appointment Required</Label>
                  </div>
                </div>
              </div>

              {/* Equipment & Freight */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Equipment & Freight</h3>
                <div className="grid grid-cols-4 gap-4">
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
                    <Label>Length (ft)</Label>
                    <Input
                      type="number"
                      value={formData.length_ft}
                      onChange={(e) => setFormData({ ...formData, length_ft: e.target.value })}
                      placeholder="48"
                    />
                  </div>
                  <div>
                    <Label>Pieces</Label>
                    <Input
                      type="number"
                      value={formData.pieces}
                      onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Commodity</Label>
                    <Input
                      value={formData.commodity}
                      onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                      placeholder="e.g., General freight, palletized"
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
                  <Label>Equipment Notes</Label>
                  <Input
                    value={formData.equipment_notes}
                    onChange={(e) => setFormData({ ...formData, equipment_notes: e.target.value })}
                    placeholder="e.g., Air-ride required, E-track"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.hazmat}
                      onCheckedChange={(checked) => setFormData({ ...formData, hazmat: checked })}
                    />
                    <Label>HAZMAT</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.temp_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, temp_required: checked })}
                    />
                    <Label>Temperature Controlled</Label>
                  </div>
                </div>
                {formData.temp_required && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Temp (°F)</Label>
                      <Input
                        type="number"
                        value={formData.temp_min_f}
                        onChange={(e) => setFormData({ ...formData, temp_min_f: e.target.value })}
                        placeholder="34"
                      />
                    </div>
                    <div>
                      <Label>Max Temp (°F)</Label>
                      <Input
                        type="number"
                        value={formData.temp_max_f}
                        onChange={(e) => setFormData({ ...formData, temp_max_f: e.target.value })}
                        placeholder="38"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rates */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Rates</h3>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Detention ($/hr)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.detention_rate_per_hour}
                      onChange={(e) => setFormData({ ...formData, detention_rate_per_hour: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <Label>Layover Rate ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.layover_rate}
                      onChange={(e) => setFormData({ ...formData, layover_rate: e.target.value })}
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <Label>TONU Rate ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tonu_rate}
                      onChange={(e) => setFormData({ ...formData, tonu_rate: e.target.value })}
                      placeholder="250"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.lumpers_covered}
                    onCheckedChange={(checked) => setFormData({ ...formData, lumpers_covered: checked })}
                  />
                  <Label>Lumpers Covered</Label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <Label>Special Instructions (shared with carrier)</Label>
                  <Textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    placeholder="Any special instructions the driver needs to know..."
                  />
                </div>
                <div>
                  <Label>Internal Notes (not shared)</Label>
                  <Textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Private notes for your reference..."
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingLoad ? "Update Load" : "Create Load"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            Open Loads
            <Badge variant="secondary">{openLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2">
            Confirmed
            <Badge variant="secondary">{confirmedLoads.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Card>
            <CardContent className="p-0">
              {openLoads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No open loads. Add your first load to get started.
                </div>
              ) : (
                <LoadsTable loadsData={openLoads} showConfirmButton={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed">
          <Card>
            <CardContent className="p-0">
              {confirmedLoads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No confirmed loads yet.
                </div>
              ) : (
                <LoadsTable loadsData={confirmedLoads} showConfirmButton={false} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}