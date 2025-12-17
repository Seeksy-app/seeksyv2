import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

export default function TruckingAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_agents")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.name || !formData.email) {
        toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
        return;
      }

      if (selectedAgent) {
        // Update existing agent
        const { error } = await supabase
          .from("trucking_agents")
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
          })
          .eq("id", selectedAgent.id);

        if (error) throw error;
        toast({ title: "Agent updated" });
      } else {
        // Create new agent
        const { error } = await supabase
          .from("trucking_agents")
          .insert({
            owner_id: user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: "agent",
          });

        if (error) throw error;
        toast({ title: "Agent created", description: "They can now log in with their email." });
      }

      setDialogOpen(false);
      setSelectedAgent(null);
      setFormData({ name: "", email: "", phone: "" });
      fetchAgents();
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
      fetchAgents();
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
      fetchAgents();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({ name: agent.name, email: agent.email, phone: agent.phone || "" });
    setDialogOpen(true);
  };

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Agents</h1>
          <p className="text-slate-500 text-sm">Manage team members who can view and work on loads</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAgent(null);
            setFormData({ name: "", email: "", phone: "" });
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents yet. Add your first team member.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{agent.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={agent.is_active ? "default" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(agent.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={() => handleToggleActive(agent)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(agent)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(agent)}>
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
            <p className="text-xs text-slate-500">
              Agents can view all loads but cannot see analytics or cost estimates.
            </p>
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
    </div>
  );
}
