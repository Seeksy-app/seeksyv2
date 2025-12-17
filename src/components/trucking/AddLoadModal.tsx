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
const truckSizes = ["20 foot", "30 foot", "40 foot", "48 foot", "53 foot"];

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
    equipment_type: "Flatbed", // Aldhelpia default
    truck_size: "40 foot",
    tarp_required: false,
    weight_lbs: "",
    miles: "",
    commodity: "REBAR", // Aldhelpia default
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
        equipment_type: editingLoad.equipment_type || "Flatbed",
        truck_size: editingLoad.length_ft ? `${editingLoad.length_ft} foot` : "40 foot",
        tarp_required: editingLoad.tarp_required || false,
        weight_lbs: editingLoad.weight_lbs?.toString() || "",
        miles: editingLoad.miles?.toString() || "",
        commodity: editingLoad.commodity || "REBAR",
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
        equipment_type: "Flatbed", // Aldhelpia default
        truck_size: "40 foot",
        tarp_required: false,
        weight_lbs: "",
        miles: "",
        commodity: "REBAR", // Aldhelpia default
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

  // Auto-convert 20 foot to 40 foot (Aldhelpia rule)
  const getActualLength = (truckSize: string) => {
    const length = parseInt(truckSize) || 40;
    return length === 20 ? 40 : length;
  };

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
        length_ft: getActualLength(formData.truck_size),
        tarp_required: formData.tarp_required,
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
      <DialogContent className="max-w-[900px] max-h-[85vh] p-0 gap-0 rounded-2xl overflow-hidden border-2 border-primary/20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b-2 border-primary/20 px-6 py-5">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {editingLoad ? "Edit Load" : "Add New Load"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter the lane, timing, equipment, and rate.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 bg-muted/30" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Section: Basics */}
          <Section icon={<FileText className="h-4 w-4" />} title="Basics" color="blue">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Load Number" required>
                <Input
                  value={formData.load_number}
                  onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                  placeholder="e.g., LD-12345"
                  className="border-2 border-border hover:border-primary/50 focus:border-primary transition-colors bg-background"
                />
              </FormField>
              <FormField label="Pickup Date" required>
                <Input
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  className="border-2 border-border hover:border-primary/50 focus:border-primary transition-colors bg-background"
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Lane */}
          <Section icon={<MapPin className="h-4 w-4" />} title="Lane" color="green">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Origin" required>
                <div className="flex gap-2">
                  <SelectWithRecent
                    value={formData.origin_city}
                    onChange={(val) => setFormData({ ...formData, origin_city: val })}
                    placeholder="City"
                    recentValues={getRecentValues("pickup_city")}
                    className="flex-1 border-2 border-border hover:border-emerald-500/50 focus-within:border-emerald-500 transition-colors"
                  />
                  <Select
                    value={formData.origin_state}
                    onValueChange={(val) => setFormData({ ...formData, origin_state: val })}
                  >
                    <SelectTrigger className="w-20 border-2 border-border hover:border-emerald-500/50 focus:border-emerald-500 transition-colors bg-background">
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
                    className="flex-1 border-2 border-border hover:border-emerald-500/50 focus-within:border-emerald-500 transition-colors"
                  />
                  <Select
                    value={formData.destination_state}
                    onValueChange={(val) => setFormData({ ...formData, destination_state: val })}
                  >
                    <SelectTrigger className="w-20 border-2 border-border hover:border-emerald-500/50 focus:border-emerald-500 transition-colors bg-background">
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
                  className="border-2 border-border hover:border-emerald-500/50 focus:border-emerald-500 transition-colors bg-background"
                />
              </FormField>
              <FormField label="Destination ZIP (optional)">
                <Input
                  value={formData.destination_zip}
                  onChange={(e) => setFormData({ ...formData, destination_zip: e.target.value })}
                  placeholder="ZIP Code"
                  className="border-2 border-border hover:border-emerald-500/50 focus:border-emerald-500 transition-colors bg-background"
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Pickup Window */}
          <Section icon={<Clock className="h-4 w-4" />} title="Pickup Window" helper="If unknown, leave blank." color="amber">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Window Start">
                <Input
                  type="time"
                  value={formData.pickup_window_start}
                  onChange={(e) => setFormData({ ...formData, pickup_window_start: e.target.value })}
                  className="border-2 border-border hover:border-amber-500/50 focus:border-amber-500 transition-colors bg-background"
                />
              </FormField>
              <FormField label="Window End">
                <Input
                  type="time"
                  value={formData.pickup_window_end}
                  onChange={(e) => setFormData({ ...formData, pickup_window_end: e.target.value })}
                  className="border-2 border-border hover:border-amber-500/50 focus:border-amber-500 transition-colors bg-background"
                />
              </FormField>
            </div>
          </Section>

          {/* Section: Equipment */}
          <Section icon={<Truck className="h-4 w-4" />} title="Equipment" color="purple">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Equipment Type" required>
                <Select
                  value={formData.equipment_type}
                  onValueChange={(val) => setFormData({ ...formData, equipment_type: val })}
                >
                  <SelectTrigger className="border-2 border-border hover:border-purple-500/50 focus:border-purple-500 transition-colors bg-background">
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
                  <SelectTrigger className="border-2 border-border hover:border-purple-500/50 focus:border-purple-500 transition-colors bg-background">
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
                  className="border-2 border-border hover:border-purple-500/50 focus:border-purple-500 transition-colors bg-background"
                />
              </FormField>
              <FormField label="Miles">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.miles}
                    onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                    placeholder="e.g., 500"
                    className="flex-1 border-2 border-border hover:border-purple-500/50 focus:border-purple-500 transition-colors bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={estimateMiles}
                    disabled={estimatingMiles || !formData.origin_city || !formData.destination_city}
                    title="Estimate miles"
                    className="border-2 hover:border-purple-500/50"
                  >
                    {estimatingMiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  </Button>
                </div>
              </FormField>
              <FormField label="Tarp Required">
                <div className="flex items-center h-10">
                  <Switch
                    checked={formData.tarp_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, tarp_required: checked })}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">{formData.tarp_required ? "Yes" : "No"}</span>
                </div>
              </FormField>
            </div>
            <FormField label="Commodity" className="mt-4">
              <Input
                value={formData.commodity}
                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                placeholder="e.g., REBAR"
                className="border-2 border-border hover:border-purple-500/50 focus:border-purple-500 transition-colors bg-background"
              />
            </FormField>
            <div className="flex items-center gap-6 mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.hazmat}
                  onCheckedChange={(checked) => setFormData({ ...formData, hazmat: checked })}
                />
                <Label className="text-sm font-medium">HAZMAT</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.temp_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, temp_required: checked })}
                />
                <Label className="text-sm font-medium">Temperature Controlled</Label>
              </div>
            </div>
            {formData.temp_required && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <FormField label="Min Temp (°F)">
                  <Input
                    type="number"
                    value={formData.temp_min_f}
                    onChange={(e) => setFormData({ ...formData, temp_min_f: e.target.value })}
                    placeholder="34"
                    className="border-2 border-blue-200 dark:border-blue-700 bg-background"
                  />
                </FormField>
                <FormField label="Max Temp (°F)">
                  <Input
                    type="number"
                    value={formData.temp_max_f}
                    onChange={(e) => setFormData({ ...formData, temp_max_f: e.target.value })}
                    placeholder="38"
                    className="border-2 border-blue-200 dark:border-blue-700 bg-background"
                  />
                </FormField>
              </div>
            )}
          </Section>

          {/* Section: Rate */}
          <Section icon={<DollarSign className="h-4 w-4" />} title="Rate" color="rose">
            {/* Segmented Control */}
            <div className="flex items-center gap-1 bg-background rounded-xl p-1 mb-4 border-2 border-rose-200/50 dark:border-rose-800/50">
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all",
                  formData.rate_type === "flat"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-rose-50 dark:hover:bg-rose-950/30"
                )}
                onClick={() => setFormData({ ...formData, rate_type: "flat" })}
              >
                Flat Rate
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all",
                  formData.rate_type === "per_ton"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-rose-50 dark:hover:bg-rose-950/30"
                )}
                onClick={() => setFormData({ ...formData, rate_type: "per_ton" })}
              >
                Per Ton
              </button>
            </div>

            {/* Rate Fields based on type */}
            {formData.rate_type === "flat" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Target Rate ($)" required helper="What we want to pay">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-semibold">$</span>
                    <Input
                      type="number"
                      step="1"
                      value={formData.target_rate}
                      onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
                      placeholder="2500"
                      className="pl-8 border-2 border-border hover:border-rose-500/50 focus:border-rose-500 transition-colors bg-background font-medium"
                    />
                  </div>
                </FormField>
                <FormField label="Ceiling Rate ($)" required helper="Max we can pay">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-semibold">$</span>
                    <Input
                      type="number"
                      step="1"
                      value={formData.floor_rate}
                      onChange={(e) => setFormData({ ...formData, floor_rate: e.target.value })}
                      placeholder="2700"
                      className="pl-8 border-2 border-border hover:border-rose-500/50 focus:border-rose-500 transition-colors bg-background font-medium"
                    />
                  </div>
                </FormField>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Desired Rate ($/ton)" required helper="What we want to pay">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.desired_rate_per_ton}
                        onChange={(e) => setFormData({ ...formData, desired_rate_per_ton: e.target.value })}
                        placeholder="75"
                        className="pl-8 border-2 border-border hover:border-rose-500/50 focus:border-rose-500 transition-colors bg-background font-medium"
                      />
                    </div>
                  </FormField>
                  <FormField label="Ceiling Rate ($/ton)" required helper="Max we can pay">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.floor_rate_per_ton}
                        onChange={(e) => setFormData({ ...formData, floor_rate_per_ton: e.target.value })}
                        placeholder="85"
                        className="pl-8 border-2 border-border hover:border-rose-500/50 focus:border-rose-500 transition-colors bg-background font-medium"
                      />
                    </div>
                  </FormField>
                </div>
                <FormField label="Tons" className="mt-4" helper="Auto-calculated from weight">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tons || calculatedTons}
                    onChange={(e) => setFormData({ ...formData, tons: e.target.value })}
                    placeholder={calculatedTons || "Enter tons"}
                    className="border-2 border-border bg-muted/30"
                  />
                </FormField>
                {formData.desired_rate_per_ton && (formData.tons || calculatedTons) && (
                  <div className="p-4 bg-rose-100/50 dark:bg-rose-950/30 rounded-xl text-sm mt-4 border border-rose-200/50 dark:border-rose-800/50">
                    <span className="text-muted-foreground">Est. Total:</span>{" "}
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-lg">
                      ${(parseFloat(formData.desired_rate_per_ton) * parseFloat(formData.tons || calculatedTons)).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-muted-foreground mt-4 p-2 bg-muted/30 rounded-lg">
              💡 Target/Desired = what we want to pay. Ceiling = max we can pay.
            </p>
          </Section>

          {/* Section: Special Instructions */}
          <Section icon={<FileText className="h-4 w-4" />} title="Special Instructions" color="blue">
            <Textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special requirements or notes..."
              rows={3}
              className="border-2 border-border hover:border-primary/50 focus:border-primary transition-colors bg-background resize-none"
            />
          </Section>
        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-gradient-to-r from-background via-background to-muted/30 border-t-2 border-primary/20 px-6 py-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2">
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
type SectionColor = 'blue' | 'green' | 'amber' | 'purple' | 'rose';

const sectionColors: Record<SectionColor, { bg: string; border: string; icon: string; header: string }> = {
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-200/50 dark:border-blue-800/50',
    icon: 'text-blue-600 dark:text-blue-400',
    header: 'bg-blue-100/50 dark:bg-blue-900/30'
  },
  green: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-200/50 dark:border-emerald-800/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    header: 'bg-emerald-100/50 dark:bg-emerald-900/30'
  },
  amber: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    border: 'border-amber-200/50 dark:border-amber-800/50',
    icon: 'text-amber-600 dark:text-amber-400',
    header: 'bg-amber-100/50 dark:bg-amber-900/30'
  },
  purple: {
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    border: 'border-purple-200/50 dark:border-purple-800/50',
    icon: 'text-purple-600 dark:text-purple-400',
    header: 'bg-purple-100/50 dark:bg-purple-900/30'
  },
  rose: {
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    border: 'border-rose-200/50 dark:border-rose-800/50',
    icon: 'text-rose-600 dark:text-rose-400',
    header: 'bg-rose-100/50 dark:bg-rose-900/30'
  }
};

function Section({ icon, title, helper, color = 'blue', children }: { 
  icon: React.ReactNode; 
  title: string; 
  helper?: string; 
  color?: SectionColor;
  children: React.ReactNode 
}) {
  const colors = sectionColors[color];
  return (
    <div className={cn(
      "rounded-xl border-2 overflow-hidden",
      colors.bg,
      colors.border
    )}>
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 border-b",
        colors.header,
        colors.border
      )}>
        <span className={cn("p-1.5 rounded-lg", colors.bg, colors.icon)}>{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
        {helper && <span className="text-xs text-muted-foreground ml-auto">{helper}</span>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, helper, className, children }: { label: string; required?: boolean; helper?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-semibold text-foreground/80">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
