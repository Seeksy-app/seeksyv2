import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Plus, MoreHorizontal, Settings, Edit, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import LoadFormDialog from "@/components/trucking/LoadFormDialog";

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
}

export default function TruckingDashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("open");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_loads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads((data as Load[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openLoads = loads.filter((l) => l.status === "open");
  const confirmedLoads = loads.filter((l) => l.status === "booked");

  const displayedLoads = activeTab === "open" ? openLoads : confirmedLoads;

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
    navigate(`/trucking/loads?edit=${load.id}`);
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
      fetchLoads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("trucking_loads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Load deleted" });
      fetchLoads();
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
      fetchLoads();
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loads</h1>
          <p className="text-slate-500 mt-1">Manage your freight loads for Jess to share with carriers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/trucking/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Custom Labels
            </Button>
          </Link>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Load
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-slate-100 p-1 rounded-full">
          <TabsTrigger 
            value="open" 
            className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Open Loads
            <Badge className="ml-2 bg-amber-400 text-amber-900 border-0">{openLoads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="confirmed"
            className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Confirmed
            <Badge className="ml-2 bg-slate-300 text-slate-700 border-0">{confirmedLoads.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="w-[140px] font-medium text-slate-600">Load #</TableHead>
              <TableHead className="font-medium text-slate-600">Lane</TableHead>
              <TableHead className="w-[100px] font-medium text-slate-600">Distance</TableHead>
              <TableHead className="w-[160px] font-medium text-slate-600">Pickup</TableHead>
              <TableHead className="w-[120px] font-medium text-slate-600">Equipment</TableHead>
              <TableHead className="w-[120px] font-medium text-slate-600">Rate</TableHead>
              <TableHead className="w-[100px] font-medium text-slate-600">Status</TableHead>
              <TableHead className="w-[80px] font-medium text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedLoads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Package className="h-10 w-10 text-slate-300" />
                    <p>No {activeTab === "open" ? "open" : "confirmed"} loads</p>
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
                <TableRow key={load.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{load.load_number}</TableCell>
                  <TableCell>
                    <span className="text-slate-700">
                      {load.origin_city}, {load.origin_state}
                    </span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span className="text-slate-700">
                      {load.destination_city}, {load.destination_state}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{load.miles ? `${load.miles} mi` : "—"}</TableCell>
                  <TableCell>
                    <div className="text-slate-700">
                      {load.pickup_date ? format(new Date(load.pickup_date), "yyyy-MM-dd") : "—"}
                    </div>
                    {load.pickup_window_start && load.pickup_window_end && (
                      <div className="text-xs text-slate-500">
                        {load.pickup_window_start} - {load.pickup_window_end}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">{load.equipment_type || "—"}</TableCell>
                  <TableCell>{formatRate(load)}</TableCell>
                  <TableCell>{getStatusBadge(load.status)}</TableCell>
                  <TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Load Dialog */}
      <LoadFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={() => {
          fetchLoads();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
