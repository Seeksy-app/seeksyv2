import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface LoadCSVUploadFormProps {
  onUploadSuccess?: () => void;
}

// Our database fields that can be mapped
const DB_FIELDS = [
  { key: "load_number", label: "Load Number", required: true },
  { key: "origin_city", label: "Origin City", required: true },
  { key: "origin_state", label: "Origin State", required: true },
  { key: "origin_zip", label: "Origin Zip" },
  { key: "destination_city", label: "Destination City", required: true },
  { key: "destination_state", label: "Destination State", required: true },
  { key: "destination_zip", label: "Destination Zip" },
  { key: "pickup_date", label: "Pickup Date" },
  { key: "delivery_date", label: "Delivery Date" },
  { key: "equipment_type", label: "Equipment Type" },
  { key: "commodity", label: "Commodity" },
  { key: "weight_lbs", label: "Weight (lbs)" },
  { key: "miles", label: "Miles" },
  { key: "target_rate", label: "Target Rate ($)" },
  { key: "floor_rate", label: "Floor Rate ($)" },
  { key: "pieces", label: "Pieces" },
  { key: "length_ft", label: "Length (ft)" },
  { key: "special_instructions", label: "Special Instructions" },
  { key: "internal_notes", label: "Internal Notes" },
  { key: "shipper_name", label: "Shipper Name" },
  { key: "shipper_phone", label: "Shipper Phone" },
  { key: "hazmat", label: "Hazmat (true/false)" },
  { key: "temp_required", label: "Temp Required (true/false)" },
  { key: "temp_min_f", label: "Temp Min (°F)" },
  { key: "temp_max_f", label: "Temp Max (°F)" },
  { key: "reference", label: "Reference #" },
];

// Common Aljex/TMS column name mappings
const AUTO_MAP_HINTS: Record<string, string[]> = {
  load_number: ["load", "load #", "load_number", "loadnumber", "pro", "pro #", "pronumber", "shipment", "shipment #"],
  origin_city: ["origin", "origin city", "origincity", "pickup city", "pickup_city", "ship from city", "from city"],
  origin_state: ["origin state", "originstate", "pickup state", "pickup_state", "ship from state", "from state", "o_state"],
  origin_zip: ["origin zip", "originzip", "pickup zip", "pickup_zip", "ship from zip", "from zip", "o_zip"],
  destination_city: ["destination", "dest", "dest city", "destination city", "destinationcity", "delivery city", "delivery_city", "ship to city", "to city"],
  destination_state: ["dest state", "destination state", "destinationstate", "delivery state", "delivery_state", "ship to state", "to state", "d_state"],
  destination_zip: ["dest zip", "destination zip", "destinationzip", "delivery zip", "delivery_zip", "ship to zip", "to zip", "d_zip"],
  pickup_date: ["pickup date", "pickup_date", "pickupdate", "ship date", "ship_date", "pu date", "pick up"],
  delivery_date: ["delivery date", "delivery_date", "deliverydate", "del date", "deliver date", "due date"],
  equipment_type: ["equipment", "equipment type", "equip", "trailer type", "truck type", "mode"],
  commodity: ["commodity", "product", "description", "freight", "cargo"],
  weight_lbs: ["weight", "weight_lbs", "lbs", "pounds", "gross weight"],
  miles: ["miles", "distance", "mileage"],
  target_rate: ["rate", "target rate", "target_rate", "price", "amount", "linehaul", "line haul"],
  floor_rate: ["floor rate", "floor_rate", "min rate", "minimum"],
  pieces: ["pieces", "qty", "quantity", "count", "pcs"],
  length_ft: ["length", "length_ft", "feet", "ft"],
  special_instructions: ["instructions", "special instructions", "notes", "comments"],
  shipper_name: ["shipper", "shipper name", "customer", "customer name", "consignor"],
  shipper_phone: ["shipper phone", "customer phone", "phone"],
  reference: ["reference", "ref", "ref #", "reference #", "po", "po #"],
  hazmat: ["hazmat", "hazardous", "haz"],
  temp_required: ["temp", "temperature", "temp required", "reefer"],
};

export function LoadCSVUploadForm({ onUploadSuccess }: LoadCSVUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv') {
        setFile(selectedFile);
        parseCSV(selectedFile);
      } else if (fileType === 'xlsx') {
        toast.error("XLSX support coming soon. Please export as CSV from Aljex.");
      } else {
        toast.error("Please upload a CSV file");
        e.target.value = '';
      }
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("No data found in CSV");
          return;
        }
        
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data as Record<string, string>[]);
        
        // Auto-map columns based on hints
        const autoMapping: Record<string, string> = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          for (const [dbField, hints] of Object.entries(AUTO_MAP_HINTS)) {
            if (hints.some(hint => lowerHeader.includes(hint) || hint.includes(lowerHeader))) {
              autoMapping[header] = dbField;
              break;
            }
          }
        });
        setColumnMapping(autoMapping);
        setStep("map");
        
        toast.success(`Found ${results.data.length} rows and ${headers.length} columns`);
      },
      error: (error) => {
        toast.error(`Parse error: ${error.message}`);
      }
    });
  };

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: dbField === "skip" ? "" : dbField
    }));
  };

  const getMappedPreview = () => {
    return csvData.slice(0, 5).map(row => {
      const mapped: Record<string, any> = {};
      for (const [csvCol, dbField] of Object.entries(columnMapping)) {
        if (dbField) {
          mapped[dbField] = row[csvCol];
        }
      }
      return mapped;
    });
  };

  const validateMapping = () => {
    const requiredFields = DB_FIELDS.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(columnMapping).filter(Boolean);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    
    if (missingRequired.length > 0) {
      const labels = missingRequired.map(f => DB_FIELDS.find(d => d.key === f)?.label).join(", ");
      toast.error(`Missing required fields: ${labels}`);
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (!validateMapping()) return;
    setStep("preview");
  };

  const parseBoolean = (value: string | undefined): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "yes" || lower === "1" || lower === "y";
  };

  const parseNumber = (value: string | undefined): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/[,$]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const parseDate = (value: string | undefined): string | null => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  const handleImport = async () => {
    setUploading(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const row of csvData) {
        try {
          // Map CSV row to database fields
          const loadData: Record<string, any> = {
            owner_id: user.id,
            status: "open",
            is_active: true,
          };

          for (const [csvCol, dbField] of Object.entries(columnMapping)) {
            if (!dbField) continue;
            
            const value = row[csvCol];
            
            // Type conversions based on field
            if (["weight_lbs", "miles", "pieces", "length_ft"].includes(dbField)) {
              loadData[dbField] = parseNumber(value);
            } else if (["target_rate", "floor_rate", "temp_min_f", "temp_max_f"].includes(dbField)) {
              loadData[dbField] = parseNumber(value);
            } else if (["hazmat", "temp_required"].includes(dbField)) {
              loadData[dbField] = parseBoolean(value);
            } else if (["pickup_date", "delivery_date"].includes(dbField)) {
              loadData[dbField] = parseDate(value);
            } else {
              loadData[dbField] = value?.trim() || null;
            }
          }

          // Skip if missing critical data
          if (!loadData.load_number && !loadData.origin_city) {
            failedCount++;
            continue;
          }

          // Generate load number if missing
          if (!loadData.load_number) {
            loadData.load_number = `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          }

          const { error } = await supabase
            .from("trucking_loads")
            .insert(loadData as any);

          if (error) {
            console.error("Row insert error:", error);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (rowError) {
          console.error("Row processing error:", rowError);
          failedCount++;
        }
      }

      setImportResults({ success: successCount, failed: failedCount });
      setStep("done");
      
      if (successCount > 0) {
        toast.success(`Imported ${successCount} loads successfully!`);
        onUploadSuccess?.();
      }
      if (failedCount > 0) {
        toast.warning(`${failedCount} rows failed to import`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    setStep("upload");
    setImportResults({ success: 0, failed: 0 });
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Import Loads from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV export from Aljex or any TMS to bulk import loads
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="csv-file-input" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">CSV files only (XLSX coming soon)</p>
              <Input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Map your CSV columns to load fields ({csvData.length} rows found)
              </p>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Start Over
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Sample Data</TableHead>
                    <TableHead>Map To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {csvData[0]?.[header] || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[header] || "skip"}
                          onValueChange={(val) => handleMappingChange(header, val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Skip column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">— Skip column —</SelectItem>
                            {DB_FIELDS.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && "*"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handlePreview}>Preview Import</Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Preview (showing first 5 of {csvData.length} rows)
              </p>
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                Back to Mapping
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.values(columnMapping).filter(Boolean).map((field) => (
                      <TableHead key={field}>
                        {DB_FIELDS.find(f => f.key === field)?.label || field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedPreview().map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(columnMapping).filter(Boolean).map((field) => (
                        <TableCell key={field} className="text-sm">
                          {row[field] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>Back</Button>
              <Button onClick={handleImport} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {csvData.length} Loads
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <p className="text-lg font-medium">Import Complete!</p>
              <p className="text-muted-foreground">
                {importResults.success} loads imported successfully
                {importResults.failed > 0 && `, ${importResults.failed} failed`}
              </p>
            </div>
            <Button onClick={resetForm}>Import More</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
