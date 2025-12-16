import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Truck, MapPin, Clock, DollarSign, FileText, Calculator, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SelectWithRecent from "./SelectWithRecent";
import { useTruckingRecentValues } from "@/hooks/useTruckingRecentValues";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL",
  "IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const equipmentTypes = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Hotshot", "Conestoga", "Double Drop", "RGN"];
const truckSizes = ["48 foot", "53 foot"];

interface AddLoadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  editingLoad?: any;
}

export default function AddLoadModal({ open, onOpenChange, onSubmit, editingLoad }: AddLoadModalProps) {
  const { getRecentValues } = useTruckingRecentValues();
  const [submitting, setSubmitting] = useState(false);
  const [estimatingMiles, setEstimatingMiles] = useState(false);

  const [formData, setFormData] = useState({
    load_number: "",
    pickup_date: "",
    origin_city: "",
    origin_state: "",
    origin_zip: "",
    destination_city: "",
    destination_state: "",
    destination_zip: "",
    pickup_window_start: "",
    pickup_window_end: "",
    equipment_type: "Dry Van",
    truck_size: "53 foot",
    weight_lbs: "",
    miles: "",
    commodity: "",
    rate_type: "flat" as "flat" | "per_ton",
    target_rate: "",
    floor_rate: "",
    desired_rate_per_ton: "",
    floor_rate_per_ton: "",
    tons: "",
    special_instructions: "",
    // Keep other fields for compatibility
    hazmat: false,
    temp_required: false,
    temp_min_f: "",
    temp_max_f: "",
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && editingLoad) {
      setFormData({
        load_number: editingLoad.load_number || "",
        pickup_date: editingLoad.pickup_date || "",
        origin_city: editingLoad.origin_city || "",
        origin_state: editingLoad.origin_state || "",
        origin_zip: editingLoad.origin_zip || "",
        destination_city: editingLoad.destination_city || "",
        destination_state: editingLoad.destination_state || "",
        destination_zip: editingLoad.destination_zip || "",
        pickup_window_start: editingLoad.pickup_window_start || "",
        pickup_window_end: editingLoad.pickup_window_end || "",
        equipment_type: editingLoad.equipment_type || "Dry Van",
        truck_size: editingLoad.length_ft ? `${editingLoad.length_ft} foot` : "53 foot",
        weight_lbs: editingLoad.weight_lbs?.toString() || "",
        miles: editingLoad.miles?.toString() || "",
        commodity: editingLoad.commodity || "",
        rate_type: editingLoad.rate_type || "flat",
        target_rate: editingLoad.target_rate?.toString() || "",
        floor_rate: editingLoad.floor_rate?.toString() || "",
        desired_rate_per_ton: editingLoad.desired_rate_per_ton?.toString() || "",
        floor_rate_per_ton: editingLoad.floor_rate_per_ton?.toString() || "",
        tons: editingLoad.tons?.toString() || "",
        special_instructions: editingLoad.special_instructions || "",
        hazmat: editingLoad.hazmat || false,
        temp_required: editingLoad.temp_required || false,
        temp_min_f: editingLoad.temp_min_f?.toString() || "",
        temp_max_f: editingLoad.temp_max_f?.toString() || "",
      });
    } else if (open && !editingLoad) {
      setFormData({
        load_number: "",
        pickup_date: "",
        origin_city: "",
        origin_state: "",
        origin_zip: "",
        destination_city: "",
        destination_state: "",
        destination_zip: "",
        pickup_window_start: "",
        pickup_window_end: "",
        equipment_type: "Dry Van",
        truck_size: "53 foot",
        weight_lbs: "",
        miles: "",
        commodity: "",
        rate_type: "flat",
        target_rate: "",
        floor_rate: "",
        desired_rate_per_ton: "",
        floor_rate_per_ton: "",
        tons: "",
        special_instructions: "",
        hazmat: false,
        temp_required: false,
        temp_min_f: "",
        temp_max_f: "",
      });
    }
  }, [open, editingLoad]);

  // Smart default: update truck size based on equipment type
  useEffect(() => {
    if (formData.equipment_type === "Flatbed" || formData.equipment_type === "Step Deck") {
      setFormData(prev => ({ ...prev, truck_size: "48 foot" }));
    } else if (formData.equipment_type === "Dry Van" || formData.equipment_type === "Reefer") {
      setFormData(prev => ({ ...prev, truck_size: "53 foot" }));
    }
  }, [formData.equipment_type]);

  // Auto-calculate tons from weight
  const calculatedTons = formData.weight_lbs ? (parseFloat(formData.weight_lbs) / 2000).toFixed(2) : "";

  const isValid = formData.load_number && formData.pickup_date && formData.origin_city && formData.destination_city && formData.equipment_type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      // Transform data for submission
      const submitData = {
        ...formData,
        length_ft: parseInt(formData.truck_size) || 53,
        weight_lbs: formData.weight_lbs ? parseFloat(formData.weight_lbs) : null,
        miles: formData.miles ? parseInt(formData.miles) : null,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        floor_rate: formData.floor_rate ? parseFloat(formData.floor_rate) : null,
        desired_rate_per_ton: formData.desired_rate_per_ton ? parseFloat(formData.desired_rate_per_ton) : null,
        floor_rate_per_ton: formData.floor_rate_per_ton ? parseFloat(formData.floor_rate_per_ton) : null,
        tons: formData.tons ? parseFloat(formData.tons) : (calculatedTons ? parseFloat(calculatedTons) : null),
        temp_min_f: formData.temp_min_f ? parseFloat(formData.temp_min_f) : null,
        temp_max_f: formData.temp_max_f ? parseFloat(formData.temp_max_f) : null,
      };
      await onSubmit(submitData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const estimateMiles = async () => {
    if (!formData.origin_city || !formData.destination_city) return;
    setEstimatingMiles(true);
    // Simulate API call - in real implementation this would call a distance API
    setTimeout(() => {
      const mockMiles = Math.floor(Math.random() * 1500) + 200;
      setFormData(prev => ({ ...prev, miles: mockMiles.toString() }));
      setEstimatingMiles(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold">
              {editingLoad ? "Edit Load" : "Add New Load"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Enter the lane, timing, equipment, and rate.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Section: Basics */}
          <Section icon={<FileText className="h-4 w-4" />} title="Basics">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Load Number" required>
                <Input
                  value={formData.load_number}
                  onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                  placeholder="e.g., LD-12345"
                />
              </FormField>
              <FormField label="Pickup Date" required>
                <Input
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Lane */}
          <Section icon={<MapPin className="h-4 w-4" />} title="Lane">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Origin" required>
                <div className="flex gap-2">
                  <SelectWithRecent
                    value={formData.origin_city}
                    onChange={(val) => setFormData({ ...formData, origin_city: val })}
                    placeholder="City"
                    recentValues={getRecentValues("pickup_city")}
                    className="flex-1"
                  />
                  <Select
                    value={formData.origin_state}
                    onValueChange={(val) => setFormData({ ...formData, origin_state: val })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="ST" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormField>
              <FormField label="Destination" required>
                <div className="flex gap-2">
                  <SelectWithRecent
                    value={formData.destination_city}
                    onChange={(val) => setFormData({ ...formData, destination_city: val })}
                    placeholder="City"
                    recentValues={getRecentValues("delivery_city")}
                    className="flex-1"
                  />
                  <Select
                    value={formData.destination_state}
                    onValueChange={(val) => setFormData({ ...formData, destination_state: val })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="ST" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormField>
              <FormField label="Origin ZIP (optional)">
                <Input
                  value={formData.origin_zip}
                  onChange={(e) => setFormData({ ...formData, origin_zip: e.target.value })}
                  placeholder="ZIP Code"
                />
              </FormField>
              <FormField label="Destination ZIP (optional)">
                <Input
                  value={formData.destination_zip}
                  onChange={(e) => setFormData({ ...formData, destination_zip: e.target.value })}
                  placeholder="ZIP Code"
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Pickup Window */}
          <Section icon={<Clock className="h-4 w-4" />} title="Pickup Window" helper="If unknown, leave blank.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Window Start">
                <Input
                  type="time"
                  value={formData.pickup_window_start}
                  onChange={(e) => setFormData({ ...formData, pickup_window_start: e.target.value })}
                />
              </FormField>
              <FormField label="Window End">
                <Input
                  type="time"
                  value={formData.pickup_window_end}
                  onChange={(e) => setFormData({ ...formData, pickup_window_end: e.target.value })}
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Equipment */}
          <Section icon={<Truck className="h-4 w-4" />} title="Equipment">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Equipment Type" required>
                <Select
                  value={formData.equipment_type}
                  onValueChange={(val) => setFormData({ ...formData, equipment_type: val })}
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
              </FormField>
              <FormField label="Truck Size" required>
                <Select
                  value={formData.truck_size}
                  onValueChange={(val) => setFormData({ ...formData, truck_size: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {truckSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Weight (lbs)">
                <Input
                  type="number"
                  value={formData.weight_lbs}
                  onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                  placeholder="e.g., 40000"
                />
              </FormField>
              <FormField label="Miles">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.miles}
                    onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                    placeholder="e.g., 500"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={estimateMiles}
                    disabled={estimatingMiles || !formData.origin_city || !formData.destination_city}
                    title="Estimate miles"
                  >
                    {estimatingMiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  </Button>
                </div>
              </FormField>
            </div>
            <FormField label="Commodity" className="mt-3">
              <Input
                value={formData.commodity}
                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                placeholder="e.g., General Freight"
              />
            </FormField>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.hazmat}
                  onCheckedChange={(checked) => setFormData({ ...formData, hazmat: checked })}
                />
                <Label className="text-sm">HAZMAT</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.temp_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, temp_required: checked })}
                />
                <Label className="text-sm">Temperature Controlled</Label>
              </div>
            </div>
            {formData.temp_required && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FormField label="Min Temp (°F)">
                  <Input
                    type="number"
                    value={formData.temp_min_f}
                    onChange={(e) => setFormData({ ...formData, temp_min_f: e.target.value })}
                    placeholder="34"
                  />
                </FormField>
                <FormField label="Max Temp (°F)">
                  <Input
                    type="number"
                    value={formData.temp_max_f}
                    onChange={(e) => setFormData({ ...formData, temp_max_f: e.target.value })}
                    placeholder="38"
                  />
                </FormField>
              </div>
            )}
          </Section>

          {/* Section: Rate */}
          <Section icon={<DollarSign className="h-4 w-4" />} title="Rate">
            {/* Segmented Control */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-4">
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  formData.rate_type === "flat"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFormData({ ...formData, rate_type: "flat" })}
              >
                Flat Rate
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  formData.rate_type === "per_ton"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFormData({ ...formData, rate_type: "per_ton" })}
              >
                Per Ton
              </button>
            </div>

            {/* Rate Fields based on type */}
            {formData.rate_type === "flat" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Target Rate ($)" required helper="What we want to pay">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="1"
                      value={formData.target_rate}
                      onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
                      placeholder="2500"
                      className="pl-7"
                    />
                  </div>
                </FormField>
                <FormField label="Ceiling Rate ($)" required helper="Max we can pay">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="1"
                      value={formData.floor_rate}
                      onChange={(e) => setFormData({ ...formData, floor_rate: e.target.value })}
                      placeholder="2700"
                      className="pl-7"
                    />
                  </div>
                </FormField>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Desired Rate ($/ton)" required helper="What we want to pay">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.desired_rate_per_ton}
                        onChange={(e) => setFormData({ ...formData, desired_rate_per_ton: e.target.value })}
                        placeholder="75"
                        className="pl-7"
                      />
                    </div>
                  </FormField>
                  <FormField label="Ceiling Rate ($/ton)" required helper="Max we can pay">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.floor_rate_per_ton}
                        onChange={(e) => setFormData({ ...formData, floor_rate_per_ton: e.target.value })}
                        placeholder="85"
                        className="pl-7"
                      />
                    </div>
                  </FormField>
                </div>
                <FormField label="Tons" className="mt-3" helper="Auto-calculated from weight">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tons || calculatedTons}
                    onChange={(e) => setFormData({ ...formData, tons: e.target.value })}
                    placeholder={calculatedTons || "Enter tons"}
                    className="bg-muted/50"
                  />
                </FormField>
                {formData.desired_rate_per_ton && (formData.tons || calculatedTons) && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm mt-3">
                    Est. Total: <span className="font-semibold">${(parseFloat(formData.desired_rate_per_ton) * parseFloat(formData.tons || calculatedTons)).toLocaleString()}</span>
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Target/Desired = what we want to pay. Ceiling = max we can pay.
            </p>
          </Section>

          {/* Section: Special Instructions */}
          <Section icon={<FileText className="h-4 w-4" />} title="Special Instructions">
            <Textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </Section>
        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {editingLoad ? "Update Load" : "Create Load"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function Section({ icon, title, helper, children }: { icon: React.ReactNode; title: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
        {helper && <span className="text-xs text-muted-foreground ml-auto">{helper}</span>}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, required, helper, className, children }: { label: string; required?: boolean; helper?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
