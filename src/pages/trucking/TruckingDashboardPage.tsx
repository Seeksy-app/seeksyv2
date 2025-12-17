import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Package, Plus, MoreHorizontal, Settings, Edit, Trash2, Copy, CheckCircle2, 
  ChevronDown, ChevronUp, Phone, Users, Search, Sun, Moon, Voicemail, Play, Pause, Archive, RefreshCw, Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import LoadFormDialog from "@/components/trucking/LoadFormDialog";
import { LoadCSVUploadForm } from "@/components/trucking/LoadCSVUploadForm";
import TruckingAnalytics from "@/components/trucking/TruckingAnalytics";

interface Load {
  id: string;
  load_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  pickup_date: string;
  pickup_window_start: string;
  pickup_window_end: string;
  target_rate: number;
  floor_rate: number;
  rate_type: 'flat' | 'per_ton';
  desired_rate_per_ton: number;
  tons: number;
  equipment_type: string;
  miles: number;
  status: string;
  broker_commission?: number;
  commodity?: string;
  weight_lbs?: number;
  notes?: string;
  owner_id?: string;
}

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  mc_number: string;
  status: string;
  created_at: string;
  load_id: string | null;
  negotiated_rate?: number;
  trucking_loads?: {
    id: string;
    load_number: string;
    origin_city: string;
    origin_state: string;
    destination_city: string;
    destination_state: string;
    target_rate: number;
    equipment_type: string;
    miles: number;
    pickup_date: string;
  } | null;
}

interface CallLog {
  id: string;
  carrier_phone: string;
  call_outcome: string;
  recording_url?: string;
  voicemail_transcript?: string;
  routed_to_voicemail?: boolean;
  created_at: string;
}

export default function TruckingDashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [voicemails, setVoicemails] = useState<CallLog[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [activeTab, setActiveTab] = useState("open");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiCallsEnabled, setAiCallsEnabled] = useState(true);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [playingVoicemailId, setPlayingVoicemailId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme: appTheme, setTheme } = useTheme();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast({ title: "Dashboard refreshed" });
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchData = async () => {
    try {
      const [loadsRes, leadsRes, callsRes, voicemailRes] = await Promise.all([
        supabase.from("trucking_loads").select("*").order("created_at", { ascending: false }),
        supabase.from("trucking_carrier_leads").select("*, trucking_loads(id, load_number, origin_city, origin_state, destination_city, destination_state, target_rate, equipment_type, miles, pickup_date)").order("created_at", { ascending: false }),
        supabase.from("trucking_call_logs").select("id").gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("trucking_call_logs").select("id, carrier_phone, call_outcome, recording_url, voicemail_transcript, routed_to_voicemail, created_at").eq("routed_to_voicemail", true).order("created_at", { ascending: false }).limit(10)
      ]);

      if (loadsRes.error) throw loadsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setLoads((loadsRes.data as Load[]) || []);
      setLeads((leadsRes.data as unknown as Lead[]) || []);
      setCallsToday(callsRes.data?.length || 0);
      setVoicemails((voicemailRes.data as unknown as CallLog[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Filter loads based on owner filter
  const filteredLoads = ownerFilter === "mine" && currentUserId 
    ? loads.filter(l => l.owner_id === currentUserId)
    : loads;

  const openLoads = filteredLoads.filter((l) => l.status === "open");
  const pendingLeads = leads.filter((l) => (l.status === "pending" || l.status === "interested" || l.status === "new") && !(l as any).is_archived);
  const archivedLeads = leads.filter((l) => (l as any).is_archived);
  const confirmedLoads = filteredLoads.filter((l) => l.status === "booked");

  // Earnings calculations
  const estRevenue = openLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0) + confirmedLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0);
  const bookedRevenue = confirmedLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0);
  const estEarnings = openLoads.reduce((sum, l) => sum + (l.broker_commission || 0), 0) + confirmedLoads.reduce((sum, l) => sum + (l.broker_commission || 0), 0);
  const bookedEarnings = confirmedLoads.reduce((sum, l) => sum + (l.broker_commission || 0), 0);

  const getDisplayedLoads = () => {
    if (activeTab === "open") return openLoads;
    if (activeTab === "pending") return []; // pending leads shown separately
    return confirmedLoads;
  };

  const displayedLoads = getDisplayedLoads();

  const confirmLead = async (lead: Lead) => {
    try {
      // Update lead status to confirmed
      const { error: leadError } = await supabase
        .from("trucking_carrier_leads")
        .update({ status: "confirmed", is_confirmed: true })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // If the lead has a load_id, update the load status to booked
      if (lead.load_id) {
        const { error: loadError } = await supabase
          .from("trucking_loads")
          .update({ status: "booked" })
          .eq("id", lead.load_id);

        if (loadError) throw loadError;
      }

      toast({ title: "Lead confirmed", description: `${lead.company_name} has been confirmed and load booked.` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditLead = (lead: Lead) => {
    // For now, just show a toast - can be expanded to open edit dialog
    toast({ title: "Edit Lead", description: `Editing ${lead.company_name || 'lead'}...` });
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from("trucking_carrier_leads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Lead deleted" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleArchiveLead = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq("id", lead.id);
      if (error) throw error;
      toast({ title: "Lead archived", description: `${lead.company_name || 'Lead'} moved to archive` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatRate = (load: Load) => {
    if (load.rate_type === "per_ton" && load.desired_rate_per_ton) {
      const total = load.desired_rate_per_ton * (load.tons || 0);
      return (
        <div>
          <div className="font-medium">${load.desired_rate_per_ton}/ton</div>
          <div className="text-xs text-slate-500">≈ ${total.toLocaleString()}</div>
        </div>
      );
    }
    const ratePerMile = load.miles && load.target_rate ? (load.target_rate / load.miles).toFixed(2) : null;
    return (
      <div>
        <div className="font-medium">${load.target_rate?.toLocaleString() || "—"}</div>
        {ratePerMile && <div className="text-xs text-slate-500">~${ratePerMile}/mi</div>}
      </div>
    );
  };

  const handleEdit = (load: Load) => {
    setEditingLoadId(load.id);
    setDialogOpen(true);
  };

  const handleDuplicate = async (load: Load) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newLoad = {
        owner_id: user.id,
        load_number: `${load.load_number}-COPY`,
        origin_city: load.origin_city,
        origin_state: load.origin_state,
        destination_city: load.destination_city,
        destination_state: load.destination_state,
        pickup_date: load.pickup_date || null,
        pickup_window_start: load.pickup_window_start || null,
        pickup_window_end: load.pickup_window_end || null,
        target_rate: load.target_rate,
        floor_rate: load.floor_rate,
        rate_type: load.rate_type || 'flat',
        desired_rate_per_ton: load.desired_rate_per_ton,
        tons: load.tons,
        equipment_type: load.equipment_type,
        miles: load.miles,
        status: "open",
        is_active: true,
      };

      const { error } = await supabase.from("trucking_loads").insert([newLoad]);
      if (error) throw error;
      toast({ title: "Load duplicated" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("trucking_loads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Load deleted" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_loads")
        .update({ status: "booked" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Load confirmed" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <Badge className="bg-green-100 text-green-700 border-0">open</Badge>;
    }
    if (status === "booked") {
      return <Badge className="bg-blue-100 text-blue-700 border-0">booked</Badge>;
    }
    if (status === "pending" || status === "interested") {
      return <Badge className="bg-amber-100 text-amber-700 border-0">pending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar - Search + Theme Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search loads, carriers, leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="shrink-0"
          title="Refresh dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(appTheme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10"
        >
          {appTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of your loads and leads</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Owner Filter Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 h-8 ${ownerFilter === 'all' ? 'bg-amber-400 text-slate-900 hover:bg-amber-400' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setOwnerFilter('all')}
            >
              See All Loads
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-4 h-8 ${ownerFilter === 'mine' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setOwnerFilter('mine')}
            >
              My Loads
            </Button>
          </div>
          <Button 
            variant="outline"
            className="gap-2"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Load
          </Button>
        </div>
      </div>

      {/* AI Live Banner */}
      <Card className={`p-4 ${aiCallsEnabled ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {aiCallsEnabled ? (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
            ) : (
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-400" />
              </span>
            )}
            <div>
              <p className={`font-semibold ${aiCallsEnabled ? 'text-green-800' : 'text-slate-600'}`}>
                {aiCallsEnabled ? 'AI Live — Jess is Ready' : 'AI Calls Paused'}
              </p>
              <p className={`text-sm ${aiCallsEnabled ? 'text-green-600' : 'text-slate-500'}`}>
                {aiCallsEnabled ? `Answering carrier calls • ${callsToday} calls today` : 'Toggle on to resume taking calls'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{aiCallsEnabled ? 'On' : 'Off'}</span>
            <Switch 
              checked={aiCallsEnabled} 
              onCheckedChange={setAiCallsEnabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
      </Card>

      {/* Analytics Section */}
      <TruckingAnalytics />

      {/* Earnings Row */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-6">
          <span>Est Revenue: <strong className="text-slate-700">${estRevenue.toLocaleString()}</strong></span>
          <span>Booked: <strong className="text-slate-700">{bookedRevenue > 0 ? `$${bookedRevenue.toLocaleString()}` : "—"}</strong></span>
        </div>
        <div className="flex items-center gap-6">
          <span>Est Earnings: <strong className="text-slate-700">{estEarnings > 0 ? `$${estEarnings.toLocaleString()}` : "—"}</strong></span>
          <span>Booked: <strong className="text-slate-700">{bookedEarnings > 0 ? `$${bookedEarnings.toLocaleString()}` : "—"}</strong></span>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-5 gap-4">
        <Card 
          className={`p-4 bg-white cursor-pointer transition-all hover:shadow-md ${activeTab === 'open' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setActiveTab("open")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Open Loads</p>
              <p className="text-3xl font-bold text-slate-900">{openLoads.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card 
          className={`p-4 bg-white cursor-pointer transition-all hover:shadow-md ${activeTab === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => setActiveTab("pending")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Leads</p>
              <p className="text-3xl font-bold text-slate-900">{pendingLeads.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card 
          className="p-4 bg-white cursor-pointer transition-all hover:shadow-md"
          onClick={() => navigate("/trucking/call-logs")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">AI Calls Today</p>
              <p className="text-3xl font-bold text-slate-900">{callsToday}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Phone className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card 
          className={`p-4 bg-white cursor-pointer transition-all hover:shadow-md ${activeTab === 'confirmed' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setActiveTab("confirmed")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Confirmed Loads</p>
              <p className="text-3xl font-bold text-slate-900">{confirmedLoads.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card 
          className="p-4 bg-white cursor-pointer transition-all hover:shadow-md"
          onClick={() => setActiveTab("voicemail")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Voicemails</p>
              <p className="text-3xl font-bold text-slate-900">{voicemails.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Voicemail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Mode Toggle + Status Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant={ownerFilter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setOwnerFilter("all")}
            className={ownerFilter === "all" ? "bg-amber-400 hover:bg-amber-500 text-amber-900 border-amber-400" : ""}
          >
            See All Loads
          </Button>
          <Button 
            variant={ownerFilter === "mine" ? "default" : "outline"} 
            size="sm"
            onClick={() => setOwnerFilter("mine")}
            className={ownerFilter === "mine" ? "bg-amber-400 hover:bg-amber-500 text-amber-900 border-amber-400" : ""}
          >
            My Loads
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 p-1 rounded-full">
            <TabsTrigger 
              value="open" 
              className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Open
              <Badge className="ml-2 bg-amber-400 text-amber-900 border-0">{openLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Pending Loads
              <Badge className="ml-2 bg-blue-400 text-blue-900 border-0">{pendingLeads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="confirmed"
              className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Confirmed
              <Badge className="ml-2 bg-green-400 text-green-900 border-0">{confirmedLoads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="voicemail"
              className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Voicemail
              <Badge className="ml-2 bg-purple-400 text-purple-900 border-0">{voicemails.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="archive"
              className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Archive
              <Badge className="ml-2 bg-slate-400 text-slate-900 border-0">{archivedLeads.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Voicemail Section */}
      {activeTab === "voicemail" ? (
        <Card className="bg-white border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Voicemails</h3>
            <p className="text-sm text-slate-500">Listen to voicemails from missed calls</p>
          </div>
          {voicemails.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 py-12">
              <Voicemail className="h-10 w-10 text-slate-300" />
              <p>No voicemails yet</p>
              <p className="text-sm">Voicemails from AI calls will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {voicemails.map((vm) => (
                <div key={vm.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{vm.carrier_phone || "Unknown"}</p>
                      <p className="text-sm text-slate-500">{format(new Date(vm.created_at), "MMM d, h:mm a")}</p>
                      {vm.voicemail_transcript && (
                        <p className="text-sm text-slate-600 mt-1 italic">"{vm.voicemail_transcript}"</p>
                      )}
                    </div>
                    {vm.recording_url && (
                      <audio controls className="h-8">
                        <source src={vm.recording_url} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : activeTab === "pending" ? (
        <Card className="bg-white border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="w-8"></TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Load #</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Company</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">MC #</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Phone</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Status</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Created</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Phone className="h-10 w-10 text-slate-300" />
                      <p>No pending leads yet</p>
                      <p className="text-sm">Leads from AI calls will appear here</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pendingLeads.map((lead) => (
                  <>
                    <TableRow 
                      key={lead.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                    >
                      <TableCell className="w-8">
                        {expandedLeadId === lead.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {lead.trucking_loads?.load_number || "—"}
                      </TableCell>
                      <TableCell className="font-medium">{lead.company_name || "—"}</TableCell>
                      <TableCell>{lead.mc_number || "—"}</TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {format(new Date(lead.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => confirmLead(lead)} className="text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveLead(lead)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedLeadId === lead.id && lead.trucking_loads && (
                      <TableRow key={`${lead.id}-details`} className="bg-slate-50">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs">Lane</p>
                              <p className="font-medium">
                                {lead.trucking_loads.origin_city}, {lead.trucking_loads.origin_state} → {lead.trucking_loads.destination_city}, {lead.trucking_loads.destination_state}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Equipment</p>
                              <p className="font-medium">{lead.trucking_loads.equipment_type || "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Distance</p>
                              <p className="font-medium">{lead.trucking_loads.miles ? `${lead.trucking_loads.miles} mi` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Pickup</p>
                              <p className="font-medium">{lead.trucking_loads.pickup_date ? format(new Date(lead.trucking_loads.pickup_date), "MMM d, yyyy") : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Target Rate</p>
                              <p className="font-medium">${lead.trucking_loads.target_rate?.toLocaleString() || "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Confirmed Rate</p>
                              <p className="font-bold text-green-700 text-lg">${lead.negotiated_rate?.toLocaleString() || lead.trucking_loads.target_rate?.toLocaleString() || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : activeTab === "archive" ? (
        <Card className="bg-white border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Archived Leads</h3>
            <p className="text-sm text-slate-500">Leads you've archived for later reference</p>
          </div>
          {archivedLeads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 py-12">
              <Archive className="h-10 w-10 text-slate-300" />
              <p>No archived leads</p>
              <p className="text-sm">Archive leads from the pending tab to see them here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-medium text-slate-600">Load #</TableHead>
                  <TableHead className="font-medium text-slate-600">Company</TableHead>
                  <TableHead className="font-medium text-slate-600">MC #</TableHead>
                  <TableHead className="font-medium text-slate-600">Phone</TableHead>
                  <TableHead className="font-medium text-slate-600">Archived</TableHead>
                  <TableHead className="font-medium text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-blue-600">
                      {lead.trucking_loads?.load_number || "—"}
                    </TableCell>
                    <TableCell className="font-medium">{lead.company_name || "—"}</TableCell>
                    <TableCell>{lead.mc_number || "—"}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {(lead as any).archived_at ? format(new Date((lead as any).archived_at), "MMM d, h:mm a") : format(new Date(lead.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from("trucking_carrier_leads")
                                .update({ is_archived: false, archived_at: null })
                                .eq("id", lead.id);
                              if (error) throw error;
                              toast({ title: "Lead restored", description: `${lead.company_name || 'Lead'} moved back to pending` });
                              fetchData();
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            }
                          }}>
                            <Archive className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : (
        <Card className="bg-white border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="font-medium text-slate-600 whitespace-nowrap w-8"></TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Load #</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Lane</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Distance</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Pickup</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Equipment</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Rate</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Status</TableHead>
                <TableHead className="font-medium text-slate-600 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLoads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Package className="h-10 w-10 text-slate-300" />
                      <p>No {activeTab} loads</p>
                      {activeTab === "open" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add your first load
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedLoads.map((load) => (
                  <>
                    <TableRow 
                      key={load.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedLoadId(expandedLoadId === load.id ? null : load.id)}
                    >
                      <TableCell className="w-8">
                        {expandedLoadId === load.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{load.load_number}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-slate-700">{load.origin_city}, {load.origin_state}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="text-slate-700">{load.destination_city}, {load.destination_state}</span>
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">{load.miles ? `${load.miles} mi` : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-slate-700">
                          {load.pickup_date ? format(new Date(load.pickup_date), "yyyy-MM-dd") : "—"}
                        </div>
                        {load.pickup_window_start && load.pickup_window_end && (
                          <div className="text-xs text-slate-500">
                            {load.pickup_window_start} - {load.pickup_window_end}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">{load.equipment_type || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatRate(load)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(load.status)}</TableCell>
                      <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(load)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(load)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {load.status === "open" && (
                              <DropdownMenuItem onClick={() => handleConfirm(load.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(load.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedLoadId === load.id && (
                      <TableRow key={`${load.id}-details`} className="bg-slate-50">
                        <TableCell colSpan={9} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs">Commodity</p>
                              <p className="font-medium">{load.commodity || "General Freight"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Weight</p>
                              <p className="font-medium">{load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Floor Rate</p>
                              <p className="font-medium">{load.floor_rate ? `$${load.floor_rate.toLocaleString()}` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Commission</p>
                              <p className="font-medium">{load.broker_commission ? `$${load.broker_commission.toLocaleString()}` : "—"}</p>
                            </div>
                            {load.notes && (
                              <div className="col-span-4">
                                <p className="text-slate-500 text-xs">Notes</p>
                                <p className="font-medium">{load.notes}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Load Dialog */}
      <LoadFormDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingLoadId(null);
        }} 
        onSuccess={() => {
          fetchData();
          setDialogOpen(false);
          setEditingLoadId(null);
        }}
        editingLoadId={editingLoadId || undefined}
      />

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Loads from CSV/Excel</DialogTitle>
          </DialogHeader>
          <LoadCSVUploadForm 
            onUploadSuccess={() => {
              fetchData();
              setImportDialogOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
