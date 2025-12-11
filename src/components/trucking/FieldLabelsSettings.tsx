import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, RotateCcw } from "lucide-react";
import { useTruckingFieldLabels, FieldLabels } from "@/hooks/useTruckingFieldLabels";

interface FieldConfig {
  key: keyof FieldLabels;
  defaultLabel: string;
  description: string;
}

const EDITABLE_FIELDS: FieldConfig[] = [
  { key: "reference", defaultLabel: "Reference", description: "Load reference / PO number field" },
  { key: "shipper_name", defaultLabel: "Shipper Name", description: "Pickup shipper name field" },
  { key: "contact_name", defaultLabel: "Main Contact Name", description: "Primary contact name field" },
  { key: "pickup_city", defaultLabel: "City", description: "Pickup location city field" },
  { key: "delivery_city", defaultLabel: "City", description: "Delivery location city field" },
];

export default function FieldLabelsSettings() {
  const { labels, updateLabel, resetLabels, DEFAULT_LABELS } = useTruckingFieldLabels();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Custom Labels
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Field Labels</DialogTitle>
          <DialogDescription>
            Rename key fields in the load form to match your workflow (e.g., "Load #" → "Ref # for D&L")
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {EDITABLE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm">
                {field.defaultLabel}
                <span className="text-muted-foreground text-xs ml-2">({field.description})</span>
              </Label>
              <Input
                value={labels[field.key]}
                onChange={(e) => updateLabel(field.key, e.target.value)}
                placeholder={field.defaultLabel}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={resetLabels} className="gap-2 text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            Reset to defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
