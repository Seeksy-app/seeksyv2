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
import * as XLSX from "xlsx";

interface LoadCSVUploadFormProps {
  onUploadSuccess?: () => void;
}

// Our database fields that can be mapped
const DB_FIELDS = [
  { key: "load_number", label: "Load Number", required: false },
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
  { key: "equipment_notes", label: "Equipment Notes (Tarp)" },
  { key: "special_instructions", label: "Special Instructions" },
  { key: "internal_notes", label: "Internal Notes" },
  { key: "shipper_name", label: "Shipper Name" },
  { key: "shipper_phone", label: "Shipper Phone" },
  { key: "hazmat", label: "Hazmat (true/false)" },
  { key: "temp_required", label: "Temp Required (true/false)" },
  { key: "temp_min_f", label: "Temp Min (°F)" },
  { key: "temp_max_f", label: "Temp Max (°F)" },
  { key: "reference", label: "Reference #" },
  { key: "carrier_name", label: "Carrier Name" },
];

// Common Aljex/TMS column name mappings
const AUTO_MAP_HINTS: Record<string, string[]> = {
  load_number: ["load", "load #", "load_number", "loadnumber", "pro", "pro #", "pronumber", "shipment", "shipment #"],
  origin_city: ["origin", "origin city", "origincity", "pickup city", "pickup_city", "ship from city", "from city", "pick up at", "pick up"],
  origin_state: ["origin state", "originstate", "pickup state", "pickup_state", "ship from state", "from state", "o_state"],
  origin_zip: ["origin zip", "originzip", "pickup zip", "pickup_zip", "ship from zip", "from zip", "o_zip"],
  destination_city: ["destination", "dest", "dest city", "destination city", "destinationcity", "delivery city", "delivery_city", "ship to city", "to city", "consignee", "consignee city"],
  destination_state: ["dest state", "destination state", "destinationstate", "delivery state", "delivery_state", "ship to state", "to state", "d_state", "consignee state"],
  destination_zip: ["dest zip", "destination zip", "destinationzip", "delivery zip", "delivery_zip", "ship to zip", "to zip", "d_zip", "consignee zip"],
  pickup_date: ["pickup date", "pickup_date", "pickupdate", "ship date", "ship_date", "pu date", "ready"],
  delivery_date: ["delivery date", "delivery_date", "deliverydate", "del date", "deliver date", "due date", "eta date", "delivery appt date"],
  equipment_type: ["equipment", "equipment type", "equip", "trailer type", "truck type", "type", "type of shipment"],
  commodity: ["commodity", "product", "description", "freight", "cargo"],
  weight_lbs: ["weight", "weight_lbs", "lbs", "pounds", "gross weight"],
  miles: ["miles", "distance", "mileage", "miles/class"],
  target_rate: ["benchmark", "target rate", "target_rate", "rate"],
  floor_rate: ["floor rate", "floor_rate", "min rate", "minimum", "invoice amount", "invoice amt", "lh revenue"],
  length_ft: ["footage", "length", "length_ft", "feet"],
  equipment_notes: ["tarps", "tarp size", "tarp", "equipment notes"],
  pieces: ["pieces", "qty", "quantity", "count", "pcs"],
  special_instructions: ["instructions", "special instructions"],
  shipper_name: ["shipper", "shipper name", "customer", "customer name", "consignor"],
  shipper_phone: ["shipper phone", "customer phone", "phone"],
  reference: ["reference", "ref", "ref #", "reference #", "po", "po #"],
  hazmat: ["hazmat", "hazardous", "haz"],
  temp_required: ["temp", "temperature", "temp required", "reefer"],
  carrier_name: ["carrier", "carrier name", "trucking company"],
};

// Adelphia Metals specific format detection
const ADELPHIA_HEADERS = ["PICK UP AT", "RATE", "DESTINATION", "READY", "WEIGHT", "LENGTH", "TARP"];

// Aljex TMS - key identifying headers (flexible matching)
const ALJEX_TMS_HEADERS = ["Pro", "Ship Date", "Pickup City", "Pickup State", "Consignee City", "Destination City", "Weight", "LH Revenue", "Status"];

type ImportTemplate = "auto" | "adelphia" | "aljex" | "standard";

export function LoadCSVUploadForm({ onUploadSuccess }: LoadCSVUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [isAdelphiaFormat, setIsAdelphiaFormat] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate>("auto");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv') {
        setFile(selectedFile);
        parseCSV(selectedFile);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        setFile(selectedFile);
        parseXLSX(selectedFile);
      } else {
        toast.error("Please upload a CSV or Excel file");
        e.target.value = '';
      }
    }
  };

  const parseXLSX = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON with header detection
      const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      if (rawData.length === 0) {
        toast.error("No data found in spreadsheet");
        return;
      }

      // Use selected template or auto-detect
      if (selectedTemplate === "adelphia") {
        setIsAdelphiaFormat(true);
        parseAdelphiaFormat(rawData);
      } else if (selectedTemplate === "aljex") {
        setIsAdelphiaFormat(true);
        parseAljexTMSFormat(rawData);
      } else if (selectedTemplate === "standard") {
        parseStandardFormat(rawData);
      } else {
        // Auto-detect format
        const isAdelphi = detectAdelphiaFormat(rawData);
        const isAljexTMS = detectAljexTMSFormat(rawData);
        setIsAdelphiaFormat(isAdelphi || isAljexTMS);

        if (isAdelphi) {
          parseAdelphiaFormat(rawData);
        } else if (isAljexTMS) {
          parseAljexTMSFormat(rawData);
        } else {
          parseStandardFormat(rawData);
        }
      }
    } catch (error) {
      console.error("XLSX parse error:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const parseStandardFormat = (rawData: any[][]) => {
    const headers = rawData[0].map(h => String(h || '').trim());
    const data = rawData.slice(1)
      .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
      .map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined ? String(row[i]) : '';
        });
        return obj;
      });

    setCsvHeaders(headers);
    setCsvData(data);
    autoMapColumns(headers);
    setStep("map");
    toast.success(`Found ${data.length} rows and ${headers.length} columns`);
  };

  const detectAljexTMSFormat = (rawData: any[][]): boolean => {
    // Look for Aljex TMS header row (Status, Pro, Customer, Pick Up, Consignee, etc.)
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      const rowHeaders = row.map(c => String(c || '').toLowerCase().trim());
      const matchCount = ALJEX_TMS_HEADERS.filter(h => 
        rowHeaders.some(rh => rh === h.toLowerCase() || rh.includes(h.toLowerCase()))
      ).length;
      if (matchCount >= 5) return true;
    }
    return false;
  };

  const parseAljexTMSFormat = (rawData: any[][]) => {
    // Find header row - look for row with recognizable column headers
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      const rowHeaders = row.map(c => String(c || '').toLowerCase().trim());
      // Check if this row looks like a header (has any of our expected column names)
      const matchCount = ALJEX_TMS_HEADERS.filter(h => 
        rowHeaders.some(rh => rh.includes(h.toLowerCase()) || h.toLowerCase().includes(rh))
      ).length;
      if (matchCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    // If no header found, assume first row is header
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headerRow = rawData[headerRowIndex].map(c => String(c || '').trim());
    
    // Find column indices - flexible matching with partial matches
    const findCol = (names: string[]) => {
      for (let i = 0; i < headerRow.length; i++) {
        const h = headerRow[i].toLowerCase();
        for (const n of names) {
          const nl = n.toLowerCase();
          // Exact match or contains match
          if (h === nl || h.includes(nl) || nl.includes(h)) {
            return i;
          }
        }
      }
      return -1;
    };

    // Column mappings based on user's Aljex export:
    // B: Pro #/Load#, J: Type/Equipment, N: Status, P: Ship date
    // AF: Pickup City, AG: Pickup State, AH: Pickup Zip
    // AJ: Consignee City/Destination City, AK: Consignee State/Destination State, AL: Consignee Zip/Destination Zip
    // AQ: Description/Commodity, AR: Weight, AS: Footage/Truck Size, AW: Miles
    // BA: LH Revenue/Customer Invoice, FU: Hazmat, GJ: Tarps, GK: Tarp Size
    const proIdx = findCol(["Pro #", "Pro#", "Load#", "Pro"]);
    const typeIdx = findCol(["Type of Shipment", "Type", "Equipment"]);
    const statusIdx = findCol(["Status"]);
    const shipDateIdx = findCol(["Ship Date", "Ship date", "ShipDate"]);
    const pickupCityIdx = findCol(["Pickup City"]);
    const pickupStateIdx = findCol(["Pickup State"]);
    const pickupZipIdx = findCol(["Pickup Zip"]);
    const destCityIdx = findCol(["Consignee City", "Destination City"]);
    const destStateIdx = findCol(["Consignee State", "Destination State"]);
    const destZipIdx = findCol(["Consignee Zip", "Destination Zip"]);
    const commodityIdx = findCol(["Description", "Commodity"]);
    const weightIdx = findCol(["Weight"]);
    const footageIdx = findCol(["Footage", "Truck Size"]);
    const milesIdx = findCol(["Miles"]);
    const rateIdx = findCol(["LH Revenue", "Customer Invoice", "Revenue"]);
    const hazmatIdx = findCol(["Hazmat"]);
    const tarpsIdx = findCol(["Tarps", "Tarp"]);
    const tarpSizeIdx = findCol(["Tarp Size"]);

    console.log("Aljex header row:", headerRow);
    console.log("Aljex column detection:", {
      proIdx, typeIdx, statusIdx, shipDateIdx, pickupCityIdx, pickupStateIdx,
      destCityIdx, destStateIdx, commodityIdx, weightIdx, milesIdx, rateIdx
    });

    // Validate we found essential columns
    if (pickupCityIdx === -1 && destCityIdx === -1) {
      toast.error("Could not find Pickup City or Destination City columns. Check your CSV headers match: 'Pickup City', 'Consignee City', or 'Destination City'");
      return;
    }

    const parsedData: Record<string, string>[] = [];

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every(c => !c)) continue;

      // Extract values from separate columns
      const proRaw = proIdx >= 0 ? String(row[proIdx] || '').trim() : '';
      const typeRaw = typeIdx >= 0 ? String(row[typeIdx] || '').trim() : '';
      const statusRaw = statusIdx >= 0 ? String(row[statusIdx] || '').trim() : '';
      const shipDateRaw = shipDateIdx >= 0 ? String(row[shipDateIdx] || '').trim() : '';
      const originCity = pickupCityIdx >= 0 ? String(row[pickupCityIdx] || '').trim() : '';
      const originState = pickupStateIdx >= 0 ? String(row[pickupStateIdx] || '').trim() : '';
      const originZip = pickupZipIdx >= 0 ? String(row[pickupZipIdx] || '').trim() : '';
      const destCity = destCityIdx >= 0 ? String(row[destCityIdx] || '').trim() : '';
      const destState = destStateIdx >= 0 ? String(row[destStateIdx] || '').trim() : '';
      const destZip = destZipIdx >= 0 ? String(row[destZipIdx] || '').trim() : '';
      const commodityRaw = commodityIdx >= 0 ? String(row[commodityIdx] || '').trim() : '';
      const weightRaw = weightIdx >= 0 ? String(row[weightIdx] || '').trim() : '';
      const footageRaw = footageIdx >= 0 ? String(row[footageIdx] || '').trim() : '';
      const milesRaw = milesIdx >= 0 ? String(row[milesIdx] || '').trim() : '';
      const rateRaw = rateIdx >= 0 ? String(row[rateIdx] || '').trim() : '';
      const hazmatRaw = hazmatIdx >= 0 ? String(row[hazmatIdx] || '').trim().toLowerCase() : '';
      const tarpsRaw = tarpsIdx >= 0 ? String(row[tarpsIdx] || '').trim().toLowerCase() : '';
      const tarpSizeRaw = tarpSizeIdx >= 0 ? String(row[tarpSizeIdx] || '').trim() : '';

      // Skip if no essential location data
      if (!originCity && !destCity) continue;

      // Parse ship date (format: "12/17/25" or "12/17/2025")
      const pickupDate = parseAljexDate(shipDateRaw);

      // Parse weight (remove commas)
      const weight = weightRaw.replace(/[,]/g, '');

      // Parse miles (remove commas)
      const miles = milesRaw.replace(/[,]/g, '');

      // Parse rate and calculate commission-based pricing
      // Customer Invoice (rate) → Target Pay (80% = 20% commission) → Max Pay (85% = 15% commission)
      const customerInvoice = parseFloat(rateRaw.replace(/[,$]/g, '')) || 0;
      const targetRate = customerInvoice > 0 ? Math.round(customerInvoice * 0.80) : 0; // 80% = 20% commission
      const floorRate = customerInvoice > 0 ? Math.round(customerInvoice * 0.85) : 0;  // 85% = 15% commission (max driver pay)

      // Parse boolean fields
      const hazmat = hazmatRaw === 'y' || hazmatRaw === 'yes' ? 'Yes' : 'No';
      const tarps = tarpsRaw === 'y' || tarpsRaw === 'yes' ? 'Yes' : 'No';

      if (originCity || destCity) {
        parsedData.push({
          "Pro #": proRaw,
          "Status": statusRaw,
          "Origin City": originCity,
          "Origin State": originState,
          "Origin Zip": originZip,
          "Destination City": destCity,
          "Destination State": destState,
          "Destination Zip": destZip,
          "Pickup Date": pickupDate,
          "Equipment Type": typeRaw,
          "Commodity": commodityRaw,
          "Weight": weight,
          "Footage": footageRaw,
          "Miles": miles,
          "Customer Invoice": customerInvoice > 0 ? String(customerInvoice) : '',
          "Target Pay": targetRate > 0 ? String(targetRate) : '',
          "Max Pay": floorRate > 0 ? String(floorRate) : '',
          "Hazmat": hazmat,
          "Tarps": tarps,
          "Tarp Size": tarpSizeRaw,
        });
      }
    }

    if (parsedData.length === 0) {
      toast.error("No valid load data found");
      return;
    }

    const headers = ["Pro #", "Status", "Origin City", "Origin State", "Origin Zip", "Destination City", "Destination State", "Destination Zip", "Pickup Date", "Equipment Type", "Commodity", "Weight", "Footage", "Miles", "Customer Invoice", "Target Pay", "Max Pay", "Hazmat", "Tarps", "Tarp Size"];
    setCsvHeaders(headers);
    setCsvData(parsedData);
    
    // Auto-map to DB fields
    setColumnMapping({
      "Pro #": "load_number",
      "Origin City": "origin_city",
      "Origin State": "origin_state",
      "Destination City": "destination_city",
      "Destination State": "destination_state",
      "Pickup Date": "pickup_date",
      "Equipment Type": "equipment_type",
      "Commodity": "commodity",
      "Weight": "weight_lbs",
      "Miles": "miles",
      "Target Pay": "target_rate",
      "Max Pay": "floor_rate",
    });
    
    setStep("map");
    toast.success(`Detected Aljex TMS format! Found ${parsedData.length} loads`);
  };

  // Parse "STATE CITY" format like "AL CENTRE" → ["AL", "CENTRE"]
  const parseStateFirstLocation = (value: string): [string, string] => {
    if (!value) return ['', ''];
    const parts = value.split(' ');
    if (parts.length >= 2) {
      const state = parts[0].trim();
      const city = parts.slice(1).join(' ').trim();
      return [state, city];
    }
    return ['', value.trim()];
  };

  // Parse Aljex date format "12/17/25" or "12/17/2025"
  const parseAljexDate = (value: string): string => {
    if (!value) return '';
    // Handle MM/DD/YY or MM/DD/YYYY format
    const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (match) {
      const month = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      let year = match[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      return `${year}-${month}-${day}`;
    }
    return value;
  };

  const detectAdelphiaFormat = (rawData: any[][]): boolean => {
    // Look for the Adelphia header row (contains "PICK UP AT", "RATE", "DESTINATION", etc.)
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      const rowStr = row.map(c => String(c || '').toUpperCase()).join('|');
      const matchCount = ADELPHIA_HEADERS.filter(h => rowStr.includes(h)).length;
      if (matchCount >= 4) return true;
    }
    return false;
  };

  const parseAdelphiaFormat = (rawData: any[][]) => {
    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      const rowStr = row.map(c => String(c || '').toUpperCase()).join('|');
      if (ADELPHIA_HEADERS.filter(h => rowStr.includes(h)).length >= 4) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      toast.error("Could not find header row");
      return;
    }

    // Find column indices for each field we care about
    const headerRow = rawData[headerRowIndex].map(c => String(c || '').toUpperCase().trim());
    
    const pickupAtIdx = headerRow.findIndex(h => h.includes('PICK UP AT') || h === 'PICK UP AT');
    const rateIdx = headerRow.findIndex(h => h === 'RATE');
    const destIdx = headerRow.findIndex(h => h === 'DESTINATION');
    const readyIdx = headerRow.findIndex(h => h === 'READY');
    const weightIdx = headerRow.findIndex(h => h === 'WEIGHT');
    const lengthIdx = headerRow.findIndex(h => h === 'LENGTH');
    const tarpIdx = headerRow.findIndex(h => h === 'TARP');

    // Parse data rows
    const parsedData: Record<string, string>[] = [];
    
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every(c => !c)) continue; // Skip empty rows
      
      // Get pickup location (format: "CITY,STATE" or "CITY, STATE")
      const pickupRaw = pickupAtIdx >= 0 ? String(row[pickupAtIdx] || '').trim() : '';
      const rateRaw = rateIdx >= 0 ? String(row[rateIdx] || '').trim() : '';
      const destRaw = destIdx >= 0 ? String(row[destIdx] || '').trim() : '';
      const readyRaw = readyIdx >= 0 ? String(row[readyIdx] || '').trim() : '';
      const weightRaw = weightIdx >= 0 ? String(row[weightIdx] || '').trim() : '';
      const lengthRaw = lengthIdx >= 0 ? String(row[lengthIdx] || '').trim() : '';
      const tarpRaw = tarpIdx >= 0 ? String(row[tarpIdx] || '').trim() : '';

      // Skip rows without essential data
      if (!pickupRaw && !destRaw && !rateRaw) continue;
      // Skip instruction/note rows
      const pickupUpper = pickupRaw.toUpperCase();
      if (pickupUpper.includes('ALL TRUCKS') || 
          pickupUpper.includes('DRIVERS MUST') || 
          pickupUpper.includes('CALL TO SET') ||
          pickupUpper.includes('NOTE') ||
          pickupUpper.includes('SECOND NOTE') ||
          pickupUpper.includes('ESCORT') ||
          pickupUpper.includes('WILL NOT LOAD') ||
          pickupUpper.includes('LOADING ON') ||
          pickupUpper.includes('APPOINTMENT')) continue;

      // Parse city,state format
      const [originCity, originState] = parseCityState(pickupRaw);
      const [destCity, destState] = parseCityState(destRaw);
      
      // Parse rate (remove $ and commas)
      const rate = parseRateValue(rateRaw);
      
      // Parse date (format: "12-Dec" or similar)
      const pickupDate = parseShortDate(readyRaw);
      
      // Parse weight
      const weight = weightRaw.replace(/[,]/g, '');
      
      // Parse length (remove ' suffix)
      const length = lengthRaw.replace(/['"]/g, '');
      
      // Parse tarp
      const tarp = tarpRaw.toUpperCase() === 'YES' ? 'Tarp Required' : (tarpRaw.toUpperCase() === 'NO' ? 'No Tarp' : tarpRaw);

      if (originCity || destCity) {
        // Calculate rates from invoice amount (20% target, 15% floor)
        const invoiceAmount = parseFloat(rate) || 0;
        const targetRate = (invoiceAmount * 0.80).toFixed(2);
        
        parsedData.push({
          "Origin City": originCity,
          "Origin State": originState,
          "Destination City": destCity,
          "Destination State": destState,
          "Customer Rate": rate, // Invoice amount
          "Target Rate": targetRate, // 20% commission (80% of invoice)
          "Pickup Date": pickupDate,
          "Weight": weight,
          "Length": length,
          "Tarp": tarp,
          "Commodity": "REBAR", // All Adelphia loads are Rebar
          "Equipment Type": "Flatbed", // All Adelphia loads are Flatbed
        });
      }
    }

    if (parsedData.length === 0) {
      toast.error("No valid load data found");
      return;
    }

    // Set up with pre-parsed headers
    const headers = ["Origin City", "Origin State", "Destination City", "Destination State", "Customer Rate", "Target Rate", "Pickup Date", "Weight", "Length", "Tarp", "Commodity", "Equipment Type"];
    setCsvHeaders(headers);
    setCsvData(parsedData);
    
    // Auto-map to our DB fields
    setColumnMapping({
      "Origin City": "origin_city",
      "Origin State": "origin_state",
      "Destination City": "destination_city",
      "Destination State": "destination_state",
      "Customer Rate": "floor_rate", // Store invoice as floor_rate
      "Target Rate": "target_rate", // 20% commission rate
      "Pickup Date": "pickup_date",
      "Weight": "weight_lbs",
      "Length": "length_ft",
      "Tarp": "equipment_notes",
      "Commodity": "commodity",
      "Equipment Type": "equipment_type",
    });
    
    setStep("map");
    toast.success(`Detected Adelphia Metals format! Found ${parsedData.length} loads (Commodity: REBAR)`);
  };

  const parseCityState = (value: string): [string, string] => {
    if (!value) return ['', ''];
    // Handle formats like "SIOUX CITY,IA" or "SIOUX CITY, IA" or "FORT WAYNE,IN/WOODBURN,IN"
    // Take the first location if there are multiple
    const firstLocation = value.split('/')[0].trim();
    const parts = firstLocation.split(',');
    if (parts.length >= 2) {
      const city = parts.slice(0, -1).join(',').trim();
      const state = parts[parts.length - 1].trim();
      return [city, state];
    }
    return [value.trim(), ''];
  };

  const parseRateValue = (value: string): string => {
    if (!value) return '';
    // Remove $, commas, and other non-numeric chars except decimal
    return value.replace(/[$,]/g, '').trim();
  };

  // Convert Excel serial date to YYYY-MM-DD
  const parseExcelSerialDate = (value: any): string => {
    if (!value) return '';
    
    // Check if it's a number (Excel serial date)
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (!isNaN(numValue) && numValue > 40000 && numValue < 60000) {
      // Excel serial date: days since 1900-01-01 (with a bug where 1900 is treated as leap year)
      // Excel epoch is 1899-12-30 to account for the leap year bug
      const excelEpoch = new Date(1899, 11, 30);
      const resultDate = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);
      const year = resultDate.getFullYear();
      const month = String(resultDate.getMonth() + 1).padStart(2, '0');
      const day = String(resultDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const parseShortDate = (value: string): string => {
    if (!value) return '';
    
    // First try Excel serial date conversion
    const excelDate = parseExcelSerialDate(value);
    if (excelDate) return excelDate;
    
    // Handle formats like "12-Dec", "15-Dec", etc.
    const months: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
      'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const match = value.match(/(\d{1,2})-([a-zA-Z]{3})/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthStr = match[2].toLowerCase();
      const month = months[monthStr];
      if (month) {
        // Use current year, or next year if date appears to be in the past
        const now = new Date();
        let year = now.getFullYear();
        const dateToCheck = new Date(`${year}-${month}-${day}`);
        if (dateToCheck < now) {
          year += 1;
        }
        return `${year}-${month}-${day}`;
      }
    }
    return value;
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
        autoMapColumns(headers);
        setStep("map");
        
        toast.success(`Found ${results.data.length} rows and ${headers.length} columns`);
      },
      error: (error) => {
        toast.error(`Parse error: ${error.message}`);
      }
    });
  };

  const autoMapColumns = (headers: string[]) => {
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
          let value = row[csvCol];
          // Convert Excel serial dates for date fields in preview
          if (["pickup_date", "delivery_date"].includes(dbField)) {
            const excelDate = parseExcelSerialDate(value);
            if (excelDate) value = excelDate;
          }
          mapped[dbField] = value;
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
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // Try Excel serial date conversion first
    const excelDate = parseExcelSerialDate(value);
    if (excelDate) return excelDate;
    
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

      // Generate unique batch ID for this import
      const importBatchId = `${selectedTemplate}-${Date.now()}`;
      const importSource = selectedTemplate === "auto" 
        ? (isAdelphiaFormat ? "adelphia" : "standard") 
        : selectedTemplate;

      // Soft-delete existing loads from this template (mark as inactive on Load Board)
      // They will still appear on Loads page but not on Load Board
      if (importSource !== "standard") {
        // Deactivate loads with matching import_source
        const { error: deactivateError } = await supabase
          .from("trucking_loads")
          .update({ is_active: false })
          .eq("owner_id", user.id)
          .eq("import_source", importSource)
          .eq("is_active", true);
        
        if (deactivateError) {
          console.warn("Warning: Could not deactivate old loads:", deactivateError);
        }

        // Also deactivate legacy loads with NULL import_source (pre-tracking loads)
        const { error: deactivateLegacyError } = await supabase
          .from("trucking_loads")
          .update({ is_active: false })
          .eq("owner_id", user.id)
          .is("import_source", null)
          .eq("is_active", true);
        
        if (deactivateLegacyError) {
          console.warn("Warning: Could not deactivate legacy loads:", deactivateLegacyError);
        }
      }

      // Get the max sequential load number to continue the sequence
      const { data: maxLoadData } = await supabase
        .from("trucking_loads")
        .select("load_number")
        .like("load_number", "[0-9]%")
        .order("created_at", { ascending: false })
        .limit(100);
      
      // Find the highest numeric load number
      let nextLoadNumber = 1001;
      if (maxLoadData) {
        const numericLoads = maxLoadData
          .map(l => parseInt(l.load_number, 10))
          .filter(n => !isNaN(n));
        if (numericLoads.length > 0) {
          nextLoadNumber = Math.max(...numericLoads) + 1;
        }
      }

      const importedAt = new Date().toISOString();

      for (const row of csvData) {
        try {
          // Map CSV row to database fields
          const loadData: Record<string, any> = {
            owner_id: user.id,
            status: "open",
            is_active: true,
            import_source: importSource,
            import_batch_id: importBatchId,
            imported_at: importedAt,
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
          if (!loadData.origin_city && !loadData.destination_city) {
            failedCount++;
            continue;
          }

          // Generate sequential load number if missing
          if (!loadData.load_number) {
            loadData.load_number = String(nextLoadNumber);
            nextLoadNumber++;
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
    setIsAdelphiaFormat(false);
    setSelectedTemplate("auto");
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Import Loads from Spreadsheet
        </CardTitle>
        <CardDescription>
          Select a template format and upload your spreadsheet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Import Template</Label>
              <Select value={selectedTemplate} onValueChange={(val: ImportTemplate) => setSelectedTemplate(val)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="auto">Auto-detect format</SelectItem>
                  <SelectItem value="adelphia">Adelphia Metals</SelectItem>
                  <SelectItem value="aljex">Aljex TMS</SelectItem>
                  <SelectItem value="standard">Standard CSV/Excel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedTemplate === "adelphia" && "Expects columns: PICK UP AT, RATE, DESTINATION, READY, WEIGHT, LENGTH, TARP"}
                {selectedTemplate === "aljex" && "Expects columns: Status, Pro, Customer, Pick Up, Consignee, Ship Date, Type, Weight"}
                {selectedTemplate === "standard" && "First row should contain column headers"}
                {selectedTemplate === "auto" && "Will automatically detect Adelphia, Aljex, or standard format"}
              </p>
            </div>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="csv-file-input" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">CSV or Excel files (.csv, .xlsx, .xls)</p>
              <Input
                id="csv-file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
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
              <div>
                <p className="text-sm font-medium">
                  Map your columns to load fields ({csvData.length} rows found)
                </p>
                {isAdelphiaFormat && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Adelphia Metals format detected - columns auto-parsed
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Start Over
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
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
              <h3 className="text-lg font-semibold">Import Complete</h3>
              <p className="text-muted-foreground">
                Successfully imported {importResults.success} loads
                {importResults.failed > 0 && ` (${importResults.failed} failed)`}
              </p>
            </div>
            <Button onClick={resetForm}>Import More</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
