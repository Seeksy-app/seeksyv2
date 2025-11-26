import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Trash2, Mail, Plus, Pencil, ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityLogger } from "@/lib/activityLogger";
import { SendSMSDialog } from "@/components/contacts/SendSMSDialog";
import { ContactViewDialog } from "@/components/contacts/ContactViewDialog";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contacts = () => {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false);
  const [selectedSMSContact, setSelectedSMSContact] = useState<any>(null);
  const [viewingContact, setViewingContact] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      company: "",
      notes: "",
    },
  });

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createContact = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("contacts")
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          title: data.title || null,
          company: data.company || null,
          notes: data.notes || null,
          user_id: user.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added successfully");
      setIsAddOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to add contact");
      console.error(error);
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContactFormData }) => {
      const { error } = await supabase
        .from("contacts")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated successfully");
      setEditingContact(null);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to update contact");
      console.error(error);
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete contact");
      console.error(error);
    },
  });

  const sendEmail = useMutation({
    mutationFn: async ({ recipientEmails, subject, message }: { recipientEmails: string[]; subject: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("Invoking send-contact-email function with:", { recipientEmails, subject, message });

      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: { recipientEmails, subject, message, userId: user.id },
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }
      
      return { recipientEmails, subject };
    },
    onSuccess: async (data) => {
      // Log the email activity for each recipient
      await Promise.all(
        data.recipientEmails.map(email => 
          ActivityLogger.emailSent(email, data.subject)
        )
      );
      
      toast.success(`Email sent successfully to ${data.recipientEmails.length} recipient(s)`);
      setIsEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedContacts([]);
    },
    onError: (error: any) => {
      console.error("Full error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      toast.error(`Failed to send email: ${error?.message || 'Unknown error'}`);
    },
  });

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateContact.mutate({ id: editingContact.id, data });
    } else {
      createContact.mutate(data);
    }
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      title: contact.title || "",
      company: contact.company || "",
      notes: contact.notes || "",
    });
  };

  const handleToggleSelect = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts?.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts?.map(c => c.id) || []);
    }
  };

  const handleSendEmail = (contactId?: string) => {
    if (contactId) {
      setSelectedContacts([contactId]);
    }
    setIsEmailDialogOpen(true);
  };

  const handleSendSMS = (contact: any) => {
    setSelectedSMSContact(contact);
    setIsSMSDialogOpen(true);
  };

  const handleSendEmailSubmit = () => {
    const recipientEmails = contacts
      ?.filter(c => selectedContacts.includes(c.id))
      .map(c => c.email) || [];

    if (recipientEmails.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    if (!emailSubject || !emailMessage) {
      toast.error("Please fill in subject and message");
      return;
    }

    sendEmail.mutate({ recipientEmails, subject: emailSubject, message: emailMessage });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Contacts</h1>
          </div>
          <div className="flex gap-2">
            {selectedContacts.length > 0 && (
              <Button onClick={() => handleSendEmail()}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email ({selectedContacts.length})
              </Button>
            )}
            <Dialog open={isAddOpen || editingContact !== null} onOpenChange={(open) => {
              if (!open) {
                setIsAddOpen(false);
                setEditingContact(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Doe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="john@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1 (555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Marketing Manager" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Acme Inc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional notes..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      {editingContact ? "Update Contact" : "Add Contact"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading contacts...</div>
        ) : contacts && contacts.length > 0 ? (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedContacts.length === contacts.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Company</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => handleToggleSelect(contact.id)}
                        />
                      </td>
                      <td 
                        className="p-4 font-medium cursor-pointer hover:text-primary underline-offset-4 hover:underline"
                        onClick={() => setViewingContact(contact)}
                      >
                        {contact.name}
                      </td>
                      <td className="p-4">{contact.email}</td>
                      <td className="p-4">{contact.phone || "-"}</td>
                      <td className="p-4">{contact.title || "-"}</td>
                      <td className="p-4">{contact.company || "-"}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(contact.id)}
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendSMS(contact)}
                            disabled={!contact.phone}
                            title={contact.phone ? "Send SMS" : "No phone number"}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                            title="Edit Contact"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContact.mutate(contact.id)}
                            title="Delete Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground mb-4">No contacts yet</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">To:</label>
              <p className="text-sm text-muted-foreground">
                {contacts?.filter(c => selectedContacts.includes(c.id)).map(c => c.email).join(", ")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Email message..."
                rows={6}
              />
            </div>
            <Button onClick={handleSendEmailSubmit} className="w-full">
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SendSMSDialog
        isOpen={isSMSDialogOpen}
        onOpenChange={setIsSMSDialogOpen}
        contact={selectedSMSContact}
      />

      <ContactViewDialog
        open={!!viewingContact}
        onOpenChange={(open) => !open && setViewingContact(null)}
        contact={viewingContact}
      />
    </div>
  );
};

export default Contacts;