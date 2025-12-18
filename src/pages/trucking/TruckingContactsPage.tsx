import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Star, Search, Users, Phone as PhoneIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phoneFormat";

const EQUIPMENT_OPTIONS = ["Van", "Reefer", "Flatbed", "Stepdeck", "Power Only", "Hotshot", "Tanker", "Other"];
const CONTACT_TYPES = [
  { label: "Driver", value: "driver" },
  { label: "Carrier / Dispatch", value: "carrier" },
  { label: "Shipper", value: "shipper" },
  { label: "Customer / Broker", value: "customer" },
  { label: "Other", value: "other" },
];

interface Contact {
  id: string;
  contact_type: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  phone_alt: string | null;
  email: string | null;
  mc_number: string | null;
  dot_number: string | null;
  equipment_types: string[] | null;
  preferred_lanes: string | null;
  notes: string | null;
  rating: number | null;
  is_favorite: boolean;
  region_short: string | null;
  updated_at: string;
}

export default function TruckingContactsPage() {
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    contact_type: "driver",
    company_name: "",
    contact_name: "",
    phone: "",
    phone_alt: "",
    email: "",
    mc_number: "",
    dot_number: "",
    equipment_types: [] as string[],
    preferred_lanes: "",
    notes: "",
    rating: 0,
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_favorite", { ascending: false })
        .order("company_name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
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

      const contactData = {
        user_id: user.id,
        contact_type: formData.contact_type,
        company_name: formData.company_name || null,
        contact_name: formData.contact_name || null,
        phone: formData.phone || null,
        phone_alt: formData.phone_alt || null,
        email: formData.email || null,
        mc_number: formData.mc_number || null,
        dot_number: formData.dot_number || null,
        equipment_types: formData.equipment_types.length > 0 ? formData.equipment_types : null,
        preferred_lanes: formData.preferred_lanes || null,
        notes: formData.notes || null,
        rating: formData.rating > 0 ? formData.rating : null,
      };

      if (editingContact) {
        const { error } = await supabase
          .from("trucking_contacts")
          .update(contactData)
          .eq("id", editingContact.id);
        if (error) throw error;
        toast({ title: "Contact updated" });
      } else {
        const { error } = await supabase
          .from("trucking_contacts")
          .insert(contactData);
        if (error) throw error;
        toast({ title: "Contact saved" });
      }

      setDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      contact_type: contact.contact_type,
      company_name: contact.company_name || "",
      contact_name: contact.contact_name || "",
      phone: contact.phone || "",
      phone_alt: contact.phone_alt || "",
      email: contact.email || "",
      mc_number: contact.mc_number || "",
      dot_number: contact.dot_number || "",
      equipment_types: contact.equipment_types || [],
      preferred_lanes: contact.preferred_lanes || "",
      notes: contact.notes || "",
      rating: contact.rating || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    
    try {
      const { error } = await supabase.from("trucking_contacts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Contact deleted" });
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    setFormData({
      contact_type: "driver",
      company_name: "",
      contact_name: "",
      phone: "",
      phone_alt: "",
      email: "",
      mc_number: "",
      dot_number: "",
      equipment_types: [],
      preferred_lanes: "",
      notes: "",
      rating: 0,
    });
  };

  const toggleEquipment = (eq: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_types: prev.equipment_types.includes(eq)
        ? prev.equipment_types.filter(e => e !== eq)
        : [...prev.equipment_types, eq]
    }));
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      driver: "bg-blue-500/10 text-blue-600",
      carrier: "bg-purple-500/10 text-purple-600",
      shipper: "bg-green-500/10 text-green-600",
      customer: "bg-orange-500/10 text-orange-600",
      other: "bg-gray-500/10 text-gray-600",
    };
    return colors[type] || colors.other;
  };

  const filteredContacts = contacts.filter(c => {
    if (activeFilter !== "all" && c.contact_type !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.company_name?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.mc_number?.toLowerCase().includes(q) ||
        c.dot_number?.toLowerCase().includes(q) ||
        c.preferred_lanes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FF9F1C' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1D3557' }}>Contacts</h1>
            <p className="text-muted-foreground">Save your favorite drivers, carriers, shippers, and customers.</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} style={{ backgroundColor: '#FF9F1C' }} className="text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {[{ label: "All", value: "all" }, ...CONTACT_TYPES.slice(0, 4)].map(opt => (
              <Button
                key={opt.value}
                variant={activeFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(opt.value)}
                style={activeFilter === opt.value ? { backgroundColor: '#1D3557' } : undefined}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, name, MC, DOT, or lane"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            {filteredContacts.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No contacts yet</h3>
                <p className="text-muted-foreground mb-4">Add your regular drivers, carriers, and shippers so AITrucking can pull their details into future loads.</p>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }} style={{ backgroundColor: '#FF9F1C' }} className="text-white">
                  Add your first contact
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Preferred Lanes</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-[72px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge className={getTypeBadge(contact.contact_type)}>
                          {contact.contact_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{contact.company_name || "—"}</TableCell>
                      <TableCell>{contact.contact_name || "—"}</TableCell>
                      <TableCell>{contact.phone || "—"}</TableCell>
                      <TableCell>
                        {contact.equipment_types?.slice(0, 2).join(", ") || "—"}
                        {(contact.equipment_types?.length || 0) > 2 && ` +${contact.equipment_types!.length - 2}`}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{contact.preferred_lanes || "—"}</TableCell>
                      <TableCell>
                        {contact.rating ? (
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < contact.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit Contact" : "Save Contact"}</DialogTitle>
              <DialogDescription>Add contact details for drivers, carriers, shippers, or customers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Type *</Label>
                  <Select value={formData.contact_type} onValueChange={(val) => setFormData({ ...formData, contact_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="405-444-4444"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Alt Phone</Label>
                  <Input
                    value={formData.phone_alt}
                    onChange={(e) => setFormData({ ...formData, phone_alt: formatPhoneNumber(e.target.value) })}
                    placeholder="405-444-4444"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="driver@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>MC #</Label>
                  <Input
                    value={formData.mc_number}
                    onChange={(e) => setFormData({ ...formData, mc_number: e.target.value })}
                    placeholder="MC123456"
                  />
                </div>
                <div>
                  <Label>DOT #</Label>
                  <Input
                    value={formData.dot_number}
                    onChange={(e) => setFormData({ ...formData, dot_number: e.target.value })}
                    placeholder="DOT1234567"
                  />
                </div>
              </div>

              <div>
                <Label>Equipment</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <Button
                      key={eq}
                      type="button"
                      variant={formData.equipment_types.includes(eq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleEquipment(eq)}
                      style={formData.equipment_types.includes(eq) ? { backgroundColor: '#1D3557' } : undefined}
                    >
                      {eq}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Preferred Lanes</Label>
                <Textarea
                  value={formData.preferred_lanes}
                  onChange={(e) => setFormData({ ...formData, preferred_lanes: e.target.value })}
                  placeholder="Example: TX → GA, Southeast regional, Midwest only..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer ${i < formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Payment history, reliability, weekend runs, detention preferences, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: '#FF9F1C' }} className="text-white">Save Contact</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}