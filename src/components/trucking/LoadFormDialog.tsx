import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import CityCombobox from "./CityCombobox";
import { useDistanceCalculation } from "@/hooks/trucking/useDistanceCalculation";

const equipmentTypes = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Hotshot", "Conestoga", "Double Drop", "RGN"];

interface LoadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingLoadId?: string;
}

export default function LoadFormDialog({ open, onOpenChange, onSuccess, editingLoadId }: LoadFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { calculateDistance, loading: distanceLoading } = useDistanceCalculation();
  const [formData, setFormData] = useState({
    load_number: "",
    origin_city: "",
    origin_state: "",
    origin_zip: "",
    destination_city: "",
    destination_state: "",
    destination_zip: "",
    pickup_date: "",
    pickup_window_start: "",
    pickup_window_end: "",
    equipment_type: "Dry Van",
    commodity: "",
    weight_lbs: "",
    miles: "",
    rate_type: "flat" as 'flat' | 'per_ton',
    target_rate: "",
    ceiling_rate: "",
    desired_rate_per_ton: "",
    ceiling_rate_per_ton: "",
    tons: "",
    special_instructions: "",
  });

  // Auto-fill load number on new load creation
  useEffect(() => {
    const fetchNextLoadNumber = async () => {
      if (open && !editingLoadId) {
        const { data } = await supabase
          .from("trucking_loads")
          .select("load_number")
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          const lastNumber = data[0].load_number;
          // Try to extract numeric part and increment
          const numericMatch = lastNumber?.match(/(\d+)/);
          if (numericMatch) {
            const nextNumber = parseInt(numericMatch[1]) + 1;
            const prefix = lastNumber.replace(/\d+.*$/, '');
            setFormData(prev => ({ ...prev, load_number: `${prefix}${nextNumber}` }));
          }
        }
      }
    };
    fetchNextLoadNumber();
  }, [open, editingLoadId]);

  useEffect(() => {
    if (!open) {
      resetForm();
    } else if (editingLoadId) {
      fetchLoad();
    }
  }, [open, editingLoadId]);

  const fetchLoad = async () => {
    if (!editingLoadId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trucking_loads")
      .select("*")
      .eq("id", editingLoadId)
      .single();
    
    if (data && !error) {
      setFormData({
        load_number: data.load_number || "",
        origin_city: data.origin_city || "",
        origin_state: data.origin_state || "",
        origin_zip: data.origin_zip || "",
        destination_city: data.destination_city || "",
        destination_state: data.destination_state || "",
        destination_zip: data.destination_zip || "",
        pickup_date: data.pickup_date || "",
        pickup_window_start: data.pickup_window_start || "",
        pickup_window_end: data.pickup_window_end || "",
        equipment_type: data.equipment_type || "Dry Van",
        commodity: data.commodity || "",
        weight_lbs: data.weight_lbs?.toString() || "",
        miles: data.miles?.toString() || "",
        rate_type: (data.rate_type as 'flat' | 'per_ton') || "flat",
        target_rate: data.target_rate?.toString() || "",
        ceiling_rate: data.floor_rate?.toString() || "",
        desired_rate_per_ton: data.desired_rate_per_ton?.toString() || "",
        ceiling_rate_per_ton: data.floor_rate_per_ton?.toString() || "",
        tons: data.tons?.toString() || "",
        special_instructions: data.special_instructions || "",
      });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      load_number: "",
      origin_city: "",
      origin_state: "",
      origin_zip: "",
      destination_city: "",
      destination_state: "",
      destination_zip: "",
      pickup_date: "",
      pickup_window_start: "",
      pickup_window_end: "",
      equipment_type: "Dry Van",
      commodity: "",
      weight_lbs: "",
      miles: "",
      rate_type: "flat",
      target_rate: "",
      ceiling_rate: "",
      desired_rate_per_ton: "",
      ceiling_rate_per_ton: "",
      tons: "",
      special_instructions: "",
    });
  };

  const handleCalculateDistance = async () => {
    const result = await calculateDistance(
      { city: formData.origin_city, state: formData.origin_state },
      { city: formData.destination_city, state: formData.destination_state }
    );
    if (result) {
      setFormData(prev => ({ ...prev, miles: result.distance_miles.toString() }));
      toast({ title: `Distance: ${result.distance_miles} miles (${result.duration_hours}h drive)` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const loadData = {
        owner_id: user.id,
        load_number: formData.load_number,
        origin_city: formData.origin_city,
        origin_state: formData.origin_state,
        destination_city: formData.destination_city,
        destination_state: formData.destination_state,
        pickup_date: formData.pickup_date || null,
        pickup_window_start: formData.pickup_window_start || null,
        pickup_window_end: formData.pickup_window_end || null,
        equipment_type: formData.equipment_type,
        commodity: formData.commodity,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        miles: formData.miles ? parseInt(formData.miles) : null,
        rate_type: formData.rate_type,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        floor_rate: formData.ceiling_rate ? parseFloat(formData.ceiling_rate) : null,
        desired_rate_per_ton: formData.desired_rate_per_ton ? parseFloat(formData.desired_rate_per_ton) : null,
        floor_rate_per_ton: formData.ceiling_rate_per_ton ? parseFloat(formData.ceiling_rate_per_ton) : null,
        tons: formData.tons ? parseFloat(formData.tons) : null,
        origin_zip: formData.origin_zip || null,
        destination_zip: formData.destination_zip || null,
        special_instructions: formData.special_instructions,
        status: "open",
        is_active: true,
      };

      if (editingLoadId) {
        const { error } = await supabase.from("trucking_loads").update(loadData).eq("id", editingLoadId);
        if (error) throw error;
        toast({ title: "Load updated successfully" });
      } else {
        const { error } = await supabase.from("trucking_loads").insert(loadData);
        if (error) throw error;
        toast({ title: "Load created successfully" });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate tons from weight
  useEffect(() => {
    if (formData.rate_type === "per_ton" && formData.weight_lbs) {
      const calculatedTons = (parseInt(formData.weight_lbs) / 2000).toFixed(2);
      setFormData(prev => ({ ...prev, tons: calculatedTons }));
    }
  }, [formData.weight_lbs, formData.rate_type]);

  // Auto-calculate distance when origin and destination change
  useEffect(() => {
    const shouldCalculate = formData.origin_city && formData.origin_state && 
                            formData.destination_city && formData.destination_state &&
                            !formData.miles; // Only auto-calc if miles not already set
    
    if (shouldCalculate && !distanceLoading) {
      handleCalculateDistance();
    }
  }, [formData.origin_city, formData.origin_state, formData.destination_city, formData.destination_state]);

  const canCalculateDistance = formData.origin_city && formData.origin_state && 
                                formData.destination_city && formData.destination_state;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingLoadId ? "Edit Load" : "Add New Load"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Load Number */}
            <div>
              <Label htmlFor="load_number">Load Number *</Label>
              <Input
                id="load_number"
                value={formData.load_number}
                onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                placeholder="e.g., 123456"
                required
              />
            </div>

            {/* Origin & Destination with City Combobox */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Origin *</Label>
                <CityCombobox
                  value={{ city: formData.origin_city, state: formData.origin_state }}
                  onChange={({ city, state }) => setFormData({ ...formData, origin_city: city, origin_state: state })}
                  placeholder="Select origin city..."
                />
                <Input
                  value={formData.origin_zip}
                  onChange={(e) => setFormData({ ...formData, origin_zip: e.target.value })}
                  placeholder="ZIP Code (optional)"
                  className="mt-1"
                />
                {formData.origin_zip && (
                  <p className="text-xs text-muted-foreground">Primary ZIP: {formData.origin_zip}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Destination *</Label>
                <CityCombobox
                  value={{ city: formData.destination_city, state: formData.destination_state }}
                  onChange={({ city, state }) => setFormData({ ...formData, destination_city: city, destination_state: state })}
                  placeholder="Select destination city..."
                />
                <Input
                  value={formData.destination_zip}
                  onChange={(e) => setFormData({ ...formData, destination_zip: e.target.value })}
                  placeholder="ZIP Code (optional)"
                  className="mt-1"
                />
                {formData.destination_zip && (
                  <p className="text-xs text-muted-foreground">Primary ZIP: {formData.destination_zip}</p>
                )}
              </div>
            </div>

            {/* Calculate Distance Button */}
            {canCalculateDistance && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateDistance}
                  disabled={distanceLoading}
                >
                  {distanceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Calculate Distance
                </Button>
                {formData.miles && (
                  <span className="text-sm text-muted-foreground">
                    {formData.miles} miles
                  </span>
                )}
              </div>
            )}

            {/* Pickup Date & Window */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pickup_date">Pickup Date</Label>
                <Input
                  id="pickup_date"
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pickup_window_start">Window Start</Label>
                <Input
                  id="pickup_window_start"
                  type="time"
                  value={formData.pickup_window_start}
                  onChange={(e) => setFormData({ ...formData, pickup_window_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pickup_window_end">Window End</Label>
                <Input
                  id="pickup_window_end"
                  type="time"
                  value={formData.pickup_window_end}
                  onChange={(e) => setFormData({ ...formData, pickup_window_end: e.target.value })}
                />
              </div>
            </div>

            {/* Equipment & Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Equipment Type</Label>
                <Select
                  value={formData.equipment_type}
                  onValueChange={(v) => setFormData({ ...formData, equipment_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weight_lbs">Weight (lbs)</Label>
                <Input
                  id="weight_lbs"
                  type="number"
                  value={formData.weight_lbs}
                  onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                  placeholder="e.g., 40000"
                />
              </div>
              <div>
                <Label htmlFor="miles">Miles</Label>
                <Input
                  id="miles"
                  type="number"
                  value={formData.miles}
                  onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            {/* Commodity */}
            <div>
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                value={formData.commodity}
                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                placeholder="e.g., General Freight"
              />
            </div>

            {/* Rate Type Toggle */}
            <div className="space-y-3">
              <Label>Rate Type</Label>
              <Tabs value={formData.rate_type} onValueChange={(v) => setFormData({ ...formData, rate_type: v as 'flat' | 'per_ton' })}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="flat">Flat Rate</TabsTrigger>
                  <TabsTrigger value="per_ton">Per Ton</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Rate Fields */}
            {formData.rate_type === "flat" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_rate">Target Rate (Pay rate) ($)</Label>
                  <Input
                    id="target_rate"
                    type="number"
                    step="0.01"
                    value={formData.target_rate}
                    onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
                    placeholder="e.g., 2500"
                  />
                </div>
                <div>
                  <Label htmlFor="ceiling_rate">Ceiling Rate ($)</Label>
                  <Input
                    id="ceiling_rate"
                    type="number"
                    step="0.01"
                    value={formData.ceiling_rate}
                    onChange={(e) => setFormData({ ...formData, ceiling_rate: e.target.value })}
                    placeholder="e.g., 2200"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="desired_rate_per_ton">Desired Rate (Pay rate) ($/ton)</Label>
                    <Input
                      id="desired_rate_per_ton"
                      type="number"
                      step="0.01"
                      value={formData.desired_rate_per_ton}
                      onChange={(e) => setFormData({ ...formData, desired_rate_per_ton: e.target.value })}
                      placeholder="e.g., 75"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ceiling_rate_per_ton">Ceiling Rate ($/ton)</Label>
                    <Input
                      id="ceiling_rate_per_ton"
                      type="number"
                      step="0.01"
                      value={formData.ceiling_rate_per_ton}
                      onChange={(e) => setFormData({ ...formData, ceiling_rate_per_ton: e.target.value })}
                      placeholder="e.g., 65"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tons">Tons</Label>
                  <Input
                    id="tons"
                    type="number"
                    step="0.01"
                    value={formData.tons}
                    onChange={(e) => setFormData({ ...formData, tons: e.target.value })}
                    placeholder="Auto-calculated from weight"
                  />
                  {formData.weight_lbs && (
                    <p className="text-xs text-slate-500 mt-1">
                      Calculated: {(parseInt(formData.weight_lbs) / 2000).toFixed(2)} tons
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Any special requirements or notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-600">
                {loading ? (editingLoadId ? "Saving..." : "Creating...") : (editingLoadId ? "Save Changes" : "Create Load")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
