import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Edit, Trash2, Users, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  profile_image_url: string | null;
  agency_id: string | null;
  agency_name?: string;
}

interface Agency {
  id: string;
  name: string;
}

export default function TruckingAdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    agency_id: "",
    profile_image_url: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from("trucking_agents")
        .select(`
          *,
          trucking_agencies(name)
        `)
        .order("created_at", { ascending: false });

      if (agentsError) throw agentsError;
      
      const formattedAgents = (agentsData || []).map((a: any) => ({
        ...a,
        agency_name: a.trucking_agencies?.name
      }));
      
      setAgents(formattedAgents);

      // Fetch agencies
      const { data: agenciesData, error: agenciesError } = await supabase
        .from("trucking_agencies")
        .select("id, name")
        .eq("is_active", true);

      if (agenciesError) throw agenciesError;
      setAgencies(agenciesData || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.email) {
        toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
        return;
      }

      const agentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        agency_id: formData.agency_id || null,
        profile_image_url: formData.profile_image_url || null,
      };

      if (selectedAgent) {
        const { error } = await supabase
          .from("trucking_agents")
          .update(agentData)
          .eq("id", selectedAgent.id);

        if (error) throw error;
        toast({ title: "Agent updated" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("trucking_agents")
          .insert({
            ...agentData,
            owner_id: user.id,
            role: "agent",
          });

        if (error) throw error;
        toast({ title: "Agent created" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from("trucking_agents")
        .update({ is_active: !agent.is_active })
        .eq("id", agent.id);

      if (error) throw error;
      toast({ title: agent.is_active ? "Agent deactivated" : "Agent activated" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;

    try {
      const { error } = await supabase
        .from("trucking_agents")
        .delete()
        .eq("id", selectedAgent.id);

      if (error) throw error;
      toast({ title: "Agent deleted" });
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setFormData({ name: "", email: "", phone: "", agency_id: "", profile_image_url: "" });
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({ 
      name: agent.name, 
      email: agent.email, 
      phone: agent.phone || "",
      agency_id: agent.agency_id || "",
      profile_image_url: agent.profile_image_url || ""
    });
    setDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <TruckingPageWrapper
      title="Manage Agents"
      description="Manage team members across all agencies"
      action={
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Agent
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents yet. Add your first team member.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {agent.profile_image_url ? (
                            <AvatarImage src={agent.profile_image_url} alt={agent.name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm">
                            {getInitials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.email}</TableCell>
                    <TableCell>{agent.phone || "—"}</TableCell>
                    <TableCell>
                      {agent.agency_name ? (
                        <Badge variant="outline">{agent.agency_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.is_active ? "default" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(agent.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={() => handleToggleActive(agent)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(agent)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedAgent(agent); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgent ? "Edit Agent" : "Add Agent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Profile Image Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {formData.profile_image_url ? (
                    <AvatarImage src={formData.profile_image_url} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xl">
                    {formData.name ? getInitials(formData.name) : <Camera className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile_image_url">Profile Image URL</Label>
              <Input
                id="profile_image_url"
                value={formData.profile_image_url}
                onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Select 
                value={formData.agency_id} 
                onValueChange={(val) => setFormData({ ...formData, agency_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{selectedAgent ? "Save" : "Add Agent"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedAgent?.name} from your team. They will no longer be able to access your loads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TruckingPageWrapper>
  );
}
