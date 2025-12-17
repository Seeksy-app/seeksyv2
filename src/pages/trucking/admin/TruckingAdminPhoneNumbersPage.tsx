import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Phone, Plus, Edit, Trash2, Star, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

interface PhoneNumber {
  id: string;
  phone_number: string;
  label: string | null;
  elevenlabs_agent_id: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export default function TruckingAdminPhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
  const [formData, setFormData] = useState({ 
    phone_number: "", 
    label: "", 
    elevenlabs_agent_id: "",
    is_primary: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_ai_phone_numbers")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.phone_number) {
        toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
        return;
      }

      // Get default agency
      const { data: agency } = await supabase
        .from("trucking_agencies")
        .select("id")
        .limit(1)
        .single();

      const numberData = {
        phone_number: formData.phone_number,
        label: formData.label || null,
        elevenlabs_agent_id: formData.elevenlabs_agent_id || null,
        is_primary: formData.is_primary,
        agency_id: agency?.id || null,
      };

      // If setting as primary, unset others first
      if (formData.is_primary) {
        await supabase
          .from("trucking_ai_phone_numbers")
          .update({ is_primary: false })
          .neq("id", selectedNumber?.id || '');
      }

      if (selectedNumber) {
        const { error } = await supabase
          .from("trucking_ai_phone_numbers")
          .update(numberData)
          .eq("id", selectedNumber.id);

        if (error) throw error;
        toast({ title: "Phone number updated" });
      } else {
        const { error } = await supabase
          .from("trucking_ai_phone_numbers")
          .insert(numberData);

        if (error) throw error;
        toast({ title: "Phone number added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchPhoneNumbers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (number: PhoneNumber) => {
    try {
      const { error } = await supabase
        .from("trucking_ai_phone_numbers")
        .update({ is_active: !number.is_active })
        .eq("id", number.id);

      if (error) throw error;
      toast({ title: number.is_active ? "Number deactivated" : "Number activated" });
      fetchPhoneNumbers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSetPrimary = async (number: PhoneNumber) => {
    try {
      // Unset all as primary first
      await supabase
        .from("trucking_ai_phone_numbers")
        .update({ is_primary: false })
        .neq("id", number.id);

      // Set this one as primary
      const { error } = await supabase
        .from("trucking_ai_phone_numbers")
        .update({ is_primary: true })
        .eq("id", number.id);

      if (error) throw error;
      toast({ title: "Primary number updated" });
      fetchPhoneNumbers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedNumber) return;

    try {
      const { error } = await supabase
        .from("trucking_ai_phone_numbers")
        .delete()
        .eq("id", selectedNumber.id);

      if (error) throw error;
      toast({ title: "Phone number deleted" });
      setDeleteDialogOpen(false);
      setSelectedNumber(null);
      fetchPhoneNumbers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedNumber(null);
    setFormData({ phone_number: "", label: "", elevenlabs_agent_id: "", is_primary: false });
  };

  const openEditDialog = (number: PhoneNumber) => {
    setSelectedNumber(number);
    setFormData({ 
      phone_number: number.phone_number, 
      label: number.label || "",
      elevenlabs_agent_id: number.elevenlabs_agent_id || "",
      is_primary: number.is_primary
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const primaryNumber = phoneNumbers.find(n => n.is_primary);

  return (
    <TruckingPageWrapper
      title="AI Phone Numbers"
      description="Manage phone numbers connected to Jess AI"
      action={
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Number
        </Button>
      }
    >
      {/* Primary Number Card */}
      {primaryNumber && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Primary AI Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <PhoneCall className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold tracking-wide">{primaryNumber.phone_number}</p>
                {primaryNumber.label && (
                  <p className="text-sm text-muted-foreground">{primaryNumber.label}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            All Phone Numbers ({phoneNumbers.length})
          </CardTitle>
          <CardDescription>
            Phone numbers that route to Jess AI for carrier calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No phone numbers configured. Add your first AI phone number.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {number.phone_number}
                        {number.is_primary && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{number.label || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {number.elevenlabs_agent_id ? number.elevenlabs_agent_id.slice(0, 12) + "..." : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={number.is_active ? "default" : "secondary"}>
                        {number.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!number.is_primary && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSetPrimary(number)}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            Set Primary
                          </Button>
                        )}
                        <Switch
                          checked={number.is_active}
                          onCheckedChange={() => handleToggleActive(number)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(number)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedNumber(number); setDeleteDialogOpen(true); }}
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
            <DialogTitle>{selectedNumber ? "Edit Phone Number" : "Add Phone Number"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="(888) 785-7499"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Main Line, After Hours, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent_id">ElevenLabs Agent ID</Label>
              <Input
                id="agent_id"
                value={formData.elevenlabs_agent_id}
                onChange={(e) => setFormData({ ...formData, elevenlabs_agent_id: e.target.value })}
                placeholder="agent_xxxxx"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                The ElevenLabs conversational AI agent ID for this number.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_primary">Set as Primary Number</Label>
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{selectedNumber ? "Save" : "Add Number"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phone Number?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedNumber?.phone_number} from your AI system. Calls to this number will no longer be handled by Jess.
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
