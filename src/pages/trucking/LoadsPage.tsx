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
import { Plus, Edit, Trash2, MapPin, Check, Copy, CheckCircle2, Truck, Flag, Phone, MoreHorizontal, Calculator, Loader2, Archive, ArchiveRestore, Clock, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContactPicker from "@/components/trucking/ContactPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import SelectWithRecent from "@/components/trucking/SelectWithRecent";
import FieldLabelsSettings from "@/components/trucking/FieldLabelsSettings";
import { useTruckingRecentValues } from "@/hooks/useTruckingRecentValues";
import { useTruckingFieldLabels } from "@/hooks/useTruckingFieldLabels";
import { formatPhoneNumber } from "@/utils/phoneFormat";
import AddLoadModal from "@/components/trucking/AddLoadModal";
import { LoadCSVUploadForm } from "@/components/trucking/LoadCSVUploadForm";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL",
  "IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

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
  // Rate fields
  rate_type: 'flat' | 'per_ton';
  target_rate: number;
  floor_rate: number;
  negotiated_rate: number;
  desired_rate_per_ton: number;
  negotiated_rate_per_ton: number;
  floor_rate_per_ton: number;
  tons: number;
  detention_rate_per_hour: number;
  layover_rate: number;
  tonu_rate: number;
  lumpers_covered: boolean;
  special_instructions: string;
  internal_notes: string;
  notes: string;
  status: string;
  is_active: boolean;
  broker_commission: number;
}

const equipmentTypes = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Hotshot", "Conestoga", "Double Drop", "RGN"];

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [activeTab, setActiveTab] = useState("open");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState<string | null>(null);
  const [estimatingMiles, setEstimatingMiles] = useState(false);
  const [deletedLoads, setDeletedLoads] = useState<Load[]>([]);
  const { toast } = useToast();
  const { getRecentValues, addRecentValue } = useTruckingRecentValues();
  const { labels } = useTruckingFieldLabels();

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
    // Rate type
    rate_type: "flat" as 'flat' | 'per_ton',
    // Flat rate fields
    target_rate: "",
    floor_rate: "",
    negotiated_rate: "",
    // Per-ton rate fields
    desired_rate_per_ton: "",
    negotiated_rate_per_ton: "",
    floor_rate_per_ton: "",
    tons: "",
    // Accessorials
    detention_rate_per_hour: "",
    layover_rate: "",
    tonu_rate: "",
    lumpers_covered: true,
    special_instructions: "",
    internal_notes: "",
    notes: "",
    // Contact fields
    shipper_name: "",
    shipper_phone: "",
    contact_name: "",
    contact_phone: "",
    broker_commission: "",
  });

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active loads (not soft deleted)
      const { data, error } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads((data as Load[]) || []);

      // Fetch deleted loads
      const { data: deletedData, error: deletedError } = await supabase
        .from("trucking_loads")
        .select("*")
        .eq("owner_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (deletedError) throw deletedError;
      setDeletedLoads((deletedData as Load[]) || []);
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
        // Rate type and fields
        rate_type: formData.rate_type,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        floor_rate: formData.floor_rate ? parseFloat(formData.floor_rate) : null,
        negotiated_rate: formData.negotiated_rate ? parseFloat(formData.negotiated_rate) : null,
        desired_rate_per_ton: formData.desired_rate_per_ton ? parseFloat(formData.desired_rate_per_ton) : null,
        negotiated_rate_per_ton: formData.negotiated_rate_per_ton ? parseFloat(formData.negotiated_rate_per_ton) : null,
        floor_rate_per_ton: formData.floor_rate_per_ton ? parseFloat(formData.floor_rate_per_ton) : null,
        tons: formData.tons ? parseFloat(formData.tons) : null,
        detention_rate_per_hour: formData.detention_rate_per_hour ? parseFloat(formData.detention_rate_per_hour) : null,
        layover_rate: formData.layover_rate ? parseFloat(formData.layover_rate) : null,
        tonu_rate: formData.tonu_rate ? parseFloat(formData.tonu_rate) : null,
        lumpers_covered: formData.lumpers_covered,
        special_instructions: formData.special_instructions,
        internal_notes: formData.internal_notes,
        notes: formData.notes,
        shipper_name: formData.shipper_name || null,
        shipper_phone: formData.shipper_phone || null,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        broker_commission: formData.broker_commission ? parseFloat(formData.broker_commission) : null,
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

      // Auto-create contacts from shipper and main contact fields
      if (formData.shipper_name && formData.shipper_phone) {
        await upsertContactFromLoad(user.id, formData.shipper_name, formData.shipper_phone, "shipper");
      }
      if (formData.contact_name && formData.contact_phone) {
        await upsertContactFromLoad(user.id, formData.contact_name, formData.contact_phone, "customer");
      }

      // Save recent values for quick access next time
      addRecentValue("pickup_city", formData.origin_city);
      addRecentValue("pickup_state", formData.origin_state);
      addRecentValue("pickup_zip", formData.origin_zip);
      addRecentValue("delivery_city", formData.destination_city);
      addRecentValue("delivery_state", formData.destination_state);
      addRecentValue("delivery_zip", formData.destination_zip);
      addRecentValue("shipper_name", formData.shipper_name);
      addRecentValue("shipper_phone", formData.shipper_phone);
      addRecentValue("contact_name", formData.contact_name);
      addRecentValue("contact_phone", formData.contact_phone);
      addRecentValue("pickup_contact_name", formData.pickup_contact_name);
      addRecentValue("pickup_contact_phone", formData.pickup_contact_phone);
      addRecentValue("delivery_contact_name", formData.delivery_contact_name);
      addRecentValue("delivery_contact_phone", formData.delivery_contact_phone);

      setDialogOpen(false);
      resetForm();
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Helper function to upsert contact from load data
  const upsertContactFromLoad = async (userId: string, name: string, phone: string, contactType: string) => {
    try {
      // Check if contact already exists by name+phone
      const { data: existingContact } = await supabase
        .from("trucking_contacts")
        .select("id")
        .eq("user_id", userId)
        .eq("phone", phone)
        .maybeSingle();

      if (existingContact) {
        // Update existing contact
        await supabase
          .from("trucking_contacts")
          .update({ company_name: name, contact_type: contactType, last_used_at: new Date().toISOString() })
          .eq("id", existingContact.id);
      } else {
        // Insert new contact
        await supabase
          .from("trucking_contacts")
          .insert({
            user_id: userId,
            company_name: name,
            phone: phone,
            contact_type: contactType,
          });
      }
    } catch (error) {
      console.error("Error upserting contact:", error);
    }
  };

  // Handler for the new AddLoadModal component
  const handleNewModalSubmit = async (formData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const loadData = {
      owner_id: user.id,
      load_number: formData.load_number,
      origin_city: formData.origin_city,
      origin_state: formData.origin_state,
      origin_zip: formData.origin_zip,
      destination_city: formData.destination_city,
      destination_state: formData.destination_state,
      destination_zip: formData.destination_zip,
      pickup_date: formData.pickup_date || null,
      pickup_window_start: formData.pickup_window_start || null,
      pickup_window_end: formData.pickup_window_end || null,
      equipment_type: formData.equipment_type,
      commodity: formData.commodity,
      hazmat: formData.hazmat,
      temp_required: formData.temp_required,
      temp_min_f: formData.temp_min_f,
      temp_max_f: formData.temp_max_f,
      weight_lbs: formData.weight_lbs,
      length_ft: formData.length_ft,
      miles: formData.miles,
      rate_type: formData.rate_type,
      target_rate: formData.target_rate,
      floor_rate: formData.floor_rate,
      desired_rate_per_ton: formData.desired_rate_per_ton,
      floor_rate_per_ton: formData.floor_rate_per_ton,
      tons: formData.tons,
      special_instructions: formData.special_instructions,
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

    // Save recent values
    addRecentValue("pickup_city", formData.origin_city);
    addRecentValue("delivery_city", formData.destination_city);
    
    setEditingLoad(null);
    fetchLoads();
  };

  const handleEditWithNewModal = (load: Load) => {
    setEditingLoad(load);
    setNewModalOpen(true);
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
      rate_type: load.rate_type || "flat",
      target_rate: load.target_rate?.toString() || "",
      floor_rate: load.floor_rate?.toString() || "",
      negotiated_rate: load.negotiated_rate?.toString() || "",
      desired_rate_per_ton: load.desired_rate_per_ton?.toString() || "",
      negotiated_rate_per_ton: load.negotiated_rate_per_ton?.toString() || "",
      floor_rate_per_ton: load.floor_rate_per_ton?.toString() || "",
      tons: load.tons?.toString() || "",
      detention_rate_per_hour: load.detention_rate_per_hour?.toString() || "",
      layover_rate: load.layover_rate?.toString() || "",
      tonu_rate: load.tonu_rate?.toString() || "",
      lumpers_covered: load.lumpers_covered ?? true,
      special_instructions: load.special_instructions || "",
      internal_notes: load.internal_notes || "",
      notes: load.notes || "",
      shipper_name: (load as any).shipper_name || "",
      shipper_phone: (load as any).shipper_phone || "",
      contact_name: (load as any).contact_name || "",
      contact_phone: (load as any).contact_phone || "",
      broker_commission: load.broker_commission?.toString() || "",
    });
    setDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setLoadToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!loadToDelete) return;
    
    try {
      // Soft delete - set deleted_at timestamp instead of actual delete
      const { error } = await supabase
        .from("trucking_loads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", loadToDelete);
      if (error) throw error;
      toast({ title: "Load moved to trash", description: "You can restore it from the Deleted tab" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setLoadToDelete(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ deleted_at: null, status: "open" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load restored" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("trucking_loads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Load permanently deleted" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleConfirmLoad = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "booked" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load confirmed" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleArchiveLoad = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "archived" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load archived" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUnarchiveLoad = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "open" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load restored to Open" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSetPending = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "pending" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load marked as pending" });
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDuplicateLoad = async (load: Load) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get next load number by incrementing the highest existing number
      const { data: lastLoads } = await supabase
        .from("trucking_loads")
        .select("load_number")
        .order("created_at", { ascending: false })
        .limit(1);
      
      let nextLoadNumber = "1001";
      if (lastLoads && lastLoads.length > 0) {
        const lastNumber = lastLoads[0].load_number;
        const numericMatch = lastNumber?.match(/(\d+)/);
        if (numericMatch) {
          const nextNum = parseInt(numericMatch[1]) + 1;
          const prefix = lastNumber.replace(/\d+.*$/, '');
          nextLoadNumber = prefix ? `${prefix}${nextNum}` : String(nextNum);
        }
      }

      const newLoad = {
        owner_id: user.id,
        load_number: nextLoadNumber,
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
        rate_type: load.rate_type || 'flat',
        target_rate: load.target_rate,
        floor_rate: load.floor_rate,
        negotiated_rate: null, // Reset negotiated on copy
        desired_rate_per_ton: load.desired_rate_per_ton,
        negotiated_rate_per_ton: null,
        floor_rate_per_ton: load.floor_rate_per_ton,
        tons: load.tons,
        detention_rate_per_hour: load.detention_rate_per_hour,
        layover_rate: load.layover_rate,
        tonu_rate: load.tonu_rate,
        lumpers_covered: load.lumpers_covered,
        special_instructions: load.special_instructions,
        internal_notes: load.internal_notes,
        notes: load.notes,
        // Include shipper and contact fields in copy
        shipper_name: (load as any).shipper_name || null,
        shipper_phone: (load as any).shipper_phone || null,
        contact_name: (load as any).contact_name || null,
        contact_phone: (load as any).contact_phone || null,
        broker_commission: load.broker_commission || null,
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
      rate_type: "flat" as 'flat' | 'per_ton',
      target_rate: "",
      floor_rate: "",
      negotiated_rate: "",
      desired_rate_per_ton: "",
      negotiated_rate_per_ton: "",
      floor_rate_per_ton: "",
      tons: "",
      detention_rate_per_hour: "",
      layover_rate: "",
      tonu_rate: "",
      lumpers_covered: true,
      special_instructions: "",
      internal_notes: "",
      notes: "",
      shipper_name: "",
      shipper_phone: "",
      contact_name: "",
      contact_phone: "",
      broker_commission: "",
    });
  };

  const estimateMiles = async () => {
    if (!formData.origin_city || !formData.origin_state || !formData.destination_city || !formData.destination_state) {
      toast({ 
        title: "Missing addresses", 
        description: "Please enter pickup and delivery city/state first.", 
        variant: "destructive" 
      });
      return;
    }

    setEstimatingMiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('trucking-distance', {
        body: {
          pickup: {
            city: formData.origin_city,
            state: formData.origin_state,
            zip: formData.origin_zip || undefined,
          },
          delivery: {
            city: formData.destination_city,
            state: formData.destination_state,
            zip: formData.destination_zip || undefined,
          }
        }
      });

      if (error || data?.error) {
        throw new Error(data?.message || error?.message || 'Distance lookup failed');
      }

      if (data?.distance_miles) {
        setFormData(prev => ({ ...prev, miles: data.distance_miles.toString() }));
        toast({ title: "Distance calculated", description: `${data.distance_miles} miles` });
      }
    } catch (error: any) {
      toast({ 
        title: "Couldn't estimate miles", 
        description: "Please check the addresses or enter a value manually.", 
        variant: "destructive" 
      });
    } finally {
      setEstimatingMiles(false);
    }
  };

  const handleDeliveryZipBlur = () => {
    // Auto-estimate miles if delivery ZIP is filled and miles is empty
    if (formData.destination_zip && !formData.miles && formData.origin_city && formData.destination_city) {
      estimateMiles();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      booked: "bg-blue-500/10 text-blue-500",
      confirmed: "bg-blue-500/10 text-blue-500",
      delivered: "bg-purple-500/10 text-purple-500",
      cancelled: "bg-red-500/10 text-red-500",
      archived: "bg-slate-500/10 text-slate-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  const openLoads = loads.filter(l => l.status === "open");
  const pendingLoads = loads.filter(l => l.status === "pending");
  const confirmedLoads = loads.filter(l => l.status === "booked" || l.status === "confirmed");
  const archivedLoads = loads.filter(l => l.status === "archived");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatRatePerMile = (load: Load) => {
    if (load.rate_type === 'per_ton') return null;
    if (load.miles && load.miles > 0 && load.target_rate && load.target_rate > 0) {
      return (load.target_rate / load.miles).toFixed(2);
    }
    return null;
  };

  const formatRateDisplay = (load: Load) => {
    if (load.rate_type === 'per_ton') {
      const tons = load.tons || (load.weight_lbs ? load.weight_lbs / 2000 : 0);
      const desiredTotal = load.desired_rate_per_ton && tons ? load.desired_rate_per_ton * tons : null;
      const negotiatedTotal = load.negotiated_rate_per_ton && tons ? load.negotiated_rate_per_ton * tons : null;
      return {
        primary: load.desired_rate_per_ton ? `$${load.desired_rate_per_ton}/ton` : '—',
        secondary: tons ? `× ${tons.toFixed(1)}t` : '',
        total: desiredTotal ? `≈ $${desiredTotal.toLocaleString()}` : '',
        negotiated: negotiatedTotal ? `Neg: $${negotiatedTotal.toLocaleString()}` : null,
      };
    }
    // Flat rate
    return {
      primary: load.target_rate ? `$${load.target_rate.toLocaleString()}` : '—',
      secondary: formatRatePerMile(load) ? `~$${formatRatePerMile(load)}/mi` : '',
      total: '',
      negotiated: load.negotiated_rate ? `Neg: $${load.negotiated_rate.toLocaleString()}` : null,
    };
  };

  // Auto-calculate tons from weight
  const calculatedTons = formData.weight_lbs ? (parseFloat(formData.weight_lbs) / 2000).toFixed(2) : '';

  const LoadsTable = ({ loadsData, tabType }: { loadsData: Load[], tabType: 'open' | 'pending' | 'confirmed' | 'archived' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Load #</TableHead>
          <TableHead>Lane</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead>Pickup</TableHead>
          <TableHead>Equipment</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loadsData.map((load) => (
          <TableRow key={load.id}>
            <TableCell className="font-medium">{load.load_number}</TableCell>
            <TableCell>
              <div>{load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}</div>
            </TableCell>
            <TableCell>
              {load.miles ? `${load.miles.toLocaleString()} mi` : "—"}
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
            <TableCell>
              {(() => {
                const rateInfo = formatRateDisplay(load);
                return (
                  <div>
                    <div className="flex items-center gap-1">
                      <span>{rateInfo.primary}</span>
                      {rateInfo.secondary && <span className="text-xs text-muted-foreground">{rateInfo.secondary}</span>}
                    </div>
                    {rateInfo.total && <div className="text-xs text-muted-foreground">{rateInfo.total}</div>}
                    {rateInfo.negotiated && <div className="text-xs text-green-600">{rateInfo.negotiated}</div>}
                  </div>
                );
              })()}
            </TableCell>
            <TableCell>
              <Badge className={getStatusBadge(load.status)}>{load.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditWithNewModal(load)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit load
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicateLoad(load)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Status change actions based on current tab */}
                  {tabType === 'open' && (
                    <>
                      <DropdownMenuItem onClick={() => handleSetPending(load.id)}>
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        Mark as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConfirmLoad(load.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Confirm load
                      </DropdownMenuItem>
                    </>
                  )}
                  {tabType === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => handleUnarchiveLoad(load.id)}>
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Move to Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConfirmLoad(load.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Confirm load
                      </DropdownMenuItem>
                    </>
                  )}
                  {tabType === 'confirmed' && (
                    <DropdownMenuItem onClick={() => handleUnarchiveLoad(load.id)}>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Reopen load
                    </DropdownMenuItem>
                  )}
                  {tabType === 'archived' && (
                    <DropdownMenuItem onClick={() => handleUnarchiveLoad(load.id)}>
                      <ArchiveRestore className="h-4 w-4 mr-2 text-blue-500" />
                      Restore to Open
                    </DropdownMenuItem>
                  )}
                  {tabType !== 'archived' && (
                    <DropdownMenuItem onClick={() => handleArchiveLoad(load.id)}>
                      <Archive className="h-4 w-4 mr-2 text-slate-500" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => confirmDelete(load.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete load
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="flex items-center gap-2">
          <FieldLabelsSettings />
          <Button onClick={() => { setEditingLoad(null); setNewModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Load
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                  <Label>{labels.reference}</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="PO or ref number"
                  />
                </div>
              </div>

              {/* Contacts Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Contacts
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{labels.shipper_name}</Label>
                    <SelectWithRecent
                      value={formData.shipper_name}
                      onChange={(val) => setFormData({ ...formData, shipper_name: val })}
                      placeholder="Start typing shipper..."
                      recentValues={getRecentValues("shipper_name")}
                    />
                  </div>
                  <div>
                    <Label>Shipper Phone</Label>
                    <SelectWithRecent
                      value={formData.shipper_phone}
                      onChange={(val) => setFormData({ ...formData, shipper_phone: val })}
                      placeholder="(555) 123-4567"
                      recentValues={getRecentValues("shipper_phone")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{labels.contact_name}</Label>
                    <SelectWithRecent
                      value={formData.contact_name}
                      onChange={(val) => setFormData({ ...formData, contact_name: val })}
                      placeholder="Start typing contact..."
                      recentValues={getRecentValues("contact_name")}
                    />
                  </div>
                  <div>
                    <Label>Main Contact Phone</Label>
                    <SelectWithRecent
                      value={formData.contact_phone}
                      onChange={(val) => setFormData({ ...formData, contact_phone: val })}
                      placeholder="(555) 987-6543"
                      recentValues={getRecentValues("contact_phone")}
                    />
                  </div>
                </div>
              </div>
              {/* Pickup Location */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Pickup Location
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{labels.pickup_city}</Label>
                    <SelectWithRecent
                      value={formData.origin_city}
                      onChange={(val) => setFormData({ ...formData, origin_city: val })}
                      placeholder="Start typing city..."
                      recentValues={getRecentValues("pickup_city")}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <SelectWithRecent
                      value={formData.origin_state}
                      onChange={(val) => setFormData({ ...formData, origin_state: val })}
                      placeholder="State"
                      recentValues={getRecentValues("pickup_state")}
                      options={US_STATES}
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <SelectWithRecent
                      value={formData.origin_zip}
                      onChange={(val) => setFormData({ ...formData, origin_zip: val })}
                      placeholder="ZIP"
                      recentValues={getRecentValues("pickup_zip")}
                    />
                  </div>
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
                    <Label>Pickup Contact Name</Label>
                    <SelectWithRecent
                      value={formData.pickup_contact_name}
                      onChange={(val) => setFormData({ ...formData, pickup_contact_name: val })}
                      placeholder="Shipper contact"
                      recentValues={getRecentValues("pickup_contact_name")}
                    />
                  </div>
                  <div>
                    <Label>Pickup Contact Phone</Label>
                    <SelectWithRecent
                      value={formData.pickup_contact_phone}
                      onChange={(val) => setFormData({ ...formData, pickup_contact_phone: val })}
                      placeholder="405-444-4444"
                      recentValues={getRecentValues("pickup_contact_phone")}
                      formatValue={formatPhoneNumber}
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

              {/* Delivery Location */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flag className="h-4 w-4" /> Delivery Location
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{labels.delivery_city}</Label>
                    <SelectWithRecent
                      value={formData.destination_city}
                      onChange={(val) => setFormData({ ...formData, destination_city: val })}
                      placeholder="Start typing city..."
                      recentValues={getRecentValues("delivery_city")}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <SelectWithRecent
                      value={formData.destination_state}
                      onChange={(val) => setFormData({ ...formData, destination_state: val })}
                      placeholder="State"
                      recentValues={getRecentValues("delivery_state")}
                      options={US_STATES}
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <SelectWithRecent
                      value={formData.destination_zip}
                      onChange={(val) => setFormData({ ...formData, destination_zip: val })}
                      placeholder="ZIP"
                      recentValues={getRecentValues("delivery_zip")}
                      onBlur={handleDeliveryZipBlur}
                    />
                  </div>
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
                    <Label>Delivery Contact Name</Label>
                    <SelectWithRecent
                      value={formData.delivery_contact_name}
                      onChange={(val) => setFormData({ ...formData, delivery_contact_name: val })}
                      placeholder="Receiver contact"
                      recentValues={getRecentValues("delivery_contact_name")}
                    />
                  </div>
                  <div>
                    <Label>Delivery Contact Phone</Label>
                    <SelectWithRecent
                      value={formData.delivery_contact_phone}
                      onChange={(val) => setFormData({ ...formData, delivery_contact_phone: val })}
                      placeholder="405-444-4444"
                      recentValues={getRecentValues("delivery_contact_phone")}
                      formatValue={formatPhoneNumber}
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
                    <Label>Distance (miles)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.miles}
                        onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                        placeholder="Auto-calculated or enter manually"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={estimateMiles}
                        disabled={estimatingMiles}
                      >
                        {estimatingMiles ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calculator className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-calculated from addresses. You can override if needed.
                    </p>
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Rates</h3>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        formData.rate_type === 'flat' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setFormData({ ...formData, rate_type: 'flat' })}
                    >
                      Flat Rate
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        formData.rate_type === 'per_ton' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setFormData({ ...formData, rate_type: 'per_ton' })}
                    >
                      Per Ton
                    </button>
                  </div>
                </div>

                {formData.rate_type === 'flat' ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Target Rate (Pay rate) ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.target_rate}
                          onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
                          placeholder="2500"
                        />
                      </div>
                      <div>
                        <Label>Ceiling Rate ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.floor_rate}
                          onChange={(e) => setFormData({ ...formData, floor_rate: e.target.value })}
                          placeholder="2200"
                        />
                      </div>
                      <div>
                        <Label>Negotiated Rate ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.negotiated_rate}
                          onChange={(e) => setFormData({ ...formData, negotiated_rate: e.target.value })}
                          placeholder="2350"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Set when carrier agrees</p>
                      </div>
                    </div>
                    {formData.target_rate && formData.floor_rate && (
                      <p className="text-xs text-muted-foreground">
                        Est. broker earnings: ${(parseFloat(formData.target_rate) - parseFloat(formData.floor_rate)).toLocaleString()} (Target - Ceiling)
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Desired Rate (Pay rate) ($/ton)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.desired_rate_per_ton}
                          onChange={(e) => setFormData({ ...formData, desired_rate_per_ton: e.target.value })}
                          placeholder="75"
                        />
                      </div>
                      <div>
                        <Label>Ceiling Rate ($/ton)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.floor_rate_per_ton}
                          onChange={(e) => setFormData({ ...formData, floor_rate_per_ton: e.target.value })}
                          placeholder="65"
                        />
                      </div>
                      <div>
                        <Label>Negotiated Rate ($/ton)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.negotiated_rate_per_ton}
                          onChange={(e) => setFormData({ ...formData, negotiated_rate_per_ton: e.target.value })}
                          placeholder="70"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tons</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.tons || calculatedTons}
                          onChange={(e) => setFormData({ ...formData, tons: e.target.value })}
                          placeholder={calculatedTons || "Enter tons"}
                        />
                        {calculatedTons && !formData.tons && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Auto-calculated from weight ({formData.weight_lbs} lbs ÷ 2000)
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Broker Commission ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.broker_commission}
                          onChange={(e) => setFormData({ ...formData, broker_commission: e.target.value })}
                          placeholder="300"
                        />
                      </div>
                    </div>
                    {formData.desired_rate_per_ton && (formData.tons || calculatedTons) && (
                      <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <p>Est. Total (Desired): <span className="font-medium">${(parseFloat(formData.desired_rate_per_ton) * parseFloat(formData.tons || calculatedTons)).toLocaleString()}</span></p>
                        {formData.negotiated_rate_per_ton && (
                          <p>Est. Total (Negotiated): <span className="font-medium text-green-600">${(parseFloat(formData.negotiated_rate_per_ton) * parseFloat(formData.tons || calculatedTons)).toLocaleString()}</span></p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Broker Commission for Flat Rate */}
                {formData.rate_type === 'flat' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Broker Commission ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.broker_commission}
                        onChange={(e) => setFormData({ ...formData, broker_commission: e.target.value })}
                        placeholder="300"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Your earnings on this load</p>
                    </div>
                  </div>
                )}

                {/* Accessorials - shown for both rate types */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Accessorials</Label>
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
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      checked={formData.lumpers_covered}
                      onCheckedChange={(checked) => setFormData({ ...formData, lumpers_covered: checked })}
                    />
                    <Label>Lumpers Covered</Label>
                  </div>
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            Open
            <Badge variant="secondary">{openLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <Badge variant="secondary">{pendingLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2">
            Confirmed
            <Badge variant="secondary">{confirmedLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            Archived
            <Badge variant="secondary">{archivedLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Deleted
            {deletedLoads.length > 0 && <Badge variant="secondary">{deletedLoads.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
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
                <LoadsTable loadsData={openLoads} tabType="open" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              {pendingLoads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending loads. Loads with carrier interest will appear here.
                </div>
              ) : (
                <LoadsTable loadsData={pendingLoads} tabType="pending" />
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
                <LoadsTable loadsData={confirmedLoads} tabType="confirmed" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardContent className="p-0">
              {archivedLoads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No archived loads.
                </div>
              ) : (
                <LoadsTable loadsData={archivedLoads} tabType="archived" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deleted">
          <Card>
            <CardContent className="p-0">
              {deletedLoads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No deleted loads. Deleted loads can be restored from here.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Deleted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedLoads.map((load) => (
                      <TableRow key={load.id} className="opacity-60">
                        <TableCell className="font-medium">{load.load_number}</TableCell>
                        <TableCell>
                          <div>{load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}</div>
                        </TableCell>
                        <TableCell>
                          {load.miles ? `${load.miles.toLocaleString()} mi` : "—"}
                        </TableCell>
                        <TableCell>
                          {load.target_rate ? `$${load.target_rate.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(load as any).deleted_at ? new Date((load as any).deleted_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(load.id)}
                              className="gap-1"
                            >
                              <ArchiveRestore className="h-4 w-4" />
                              Restore
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handlePermanentDelete(load.id)}
                            >
                              Delete Forever
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
        </TabsContent>

        <TabsContent value="import">
          <LoadCSVUploadForm onUploadSuccess={() => { fetchLoads(); setActiveTab("open"); }} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This load will be moved to the Deleted tab. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Add Load Modal */}
      <AddLoadModal
        open={newModalOpen}
        onOpenChange={(open) => { setNewModalOpen(open); if (!open) setEditingLoad(null); }}
        onSubmit={handleNewModalSubmit}
        editingLoad={editingLoad}
      />
    </div>
  );
}