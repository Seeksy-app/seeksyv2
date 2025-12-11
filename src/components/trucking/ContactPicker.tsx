import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check, Star, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  contact_type: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  mc_number: string | null;
  dot_number: string | null;
  equipment_types: string[] | null;
  preferred_lanes: string | null;
  is_favorite: boolean;
  region_short: string | null;
  last_used_at: string | null;
}

interface ContactPickerProps {
  value: string | null;
  onChange: (contactId: string | null, contact: Contact | null) => void;
  allowedTypes: string[];
  label?: string;
  placeholder?: string;
  allowCreateNew?: boolean;
  onCreateNew?: () => void;
}

export default function ContactPicker({
  value,
  onChange,
  allowedTypes,
  label,
  placeholder = "Search contacts...",
  allowCreateNew = false,
  onCreateNew,
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("trucking_contacts")
        .select("id, contact_type, company_name, contact_name, phone, mc_number, dot_number, equipment_types, preferred_lanes, is_favorite, region_short, last_used_at")
        .eq("user_id", user.id)
        .in("contact_type", allowedTypes)
        .order("is_favorite", { ascending: false })
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("company_name", { ascending: true })
        .limit(50);

      const { data, error } = await query;
      if (error) throw error;
      setContacts(data || []);

      // If there's a value, find the selected contact
      if (value && data) {
        const found = data.find(c => c.id === value);
        setSelectedContact(found || null);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [allowedTypes, value]);

  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open, fetchContacts]);

  useEffect(() => {
    // Update selected contact when value changes externally
    if (value && contacts.length > 0) {
      const found = contacts.find(c => c.id === value);
      setSelectedContact(found || null);
    } else if (!value) {
      setSelectedContact(null);
    }
  }, [value, contacts]);

  const handleSelect = async (contact: Contact) => {
    setSelectedContact(contact);
    onChange(contact.id, contact);
    setOpen(false);

    // Update last_used_at
    try {
      await supabase
        .from("trucking_contacts")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", contact.id);
    } catch (error) {
      console.error("Error updating last_used_at:", error);
    }
  };

  const handleClear = () => {
    setSelectedContact(null);
    onChange(null, null);
  };

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.mc_number?.toLowerCase().includes(q) ||
      c.dot_number?.toLowerCase().includes(q) ||
      c.preferred_lanes?.toLowerCase().includes(q)
    );
  });

  const recentContacts = filteredContacts.filter(c => c.last_used_at).slice(0, 5);
  const favoriteContacts = filteredContacts.filter(c => c.is_favorite).slice(0, 5);

  const displayValue = selectedContact
    ? `${selectedContact.company_name || ""}${selectedContact.contact_name ? ` (${selectedContact.contact_name})` : ""}`.trim() || "Selected"
    : null;

  return (
    <div className="w-full">
      {label && <label className="text-sm font-medium mb-1.5 block">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, MC, DOT, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">
                  {searchQuery ? "No contacts found" : "No contacts yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try a different name, MC/DOT, phone, or lane."
                    : "Save your first driver, carrier, or shipper to reuse them on future loads."}
                </p>
              </div>
            ) : (
              <>
                {/* Recent Section */}
                {!searchQuery && recentContacts.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Recent</div>
                    {recentContacts.map((contact) => (
                      <ContactRow key={contact.id} contact={contact} selected={value === contact.id} onSelect={handleSelect} />
                    ))}
                  </div>
                )}

                {/* Favorites Section */}
                {!searchQuery && favoriteContacts.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Favorites</div>
                    {favoriteContacts.map((contact) => (
                      <ContactRow key={contact.id} contact={contact} selected={value === contact.id} onSelect={handleSelect} />
                    ))}
                  </div>
                )}

                {/* All results */}
                {(searchQuery || (recentContacts.length === 0 && favoriteContacts.length === 0)) && (
                  <div>
                    {filteredContacts.map((contact) => (
                      <ContactRow key={contact.id} contact={contact} selected={value === contact.id} onSelect={handleSelect} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t p-2 flex gap-2">
            {selectedContact && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
            {allowCreateNew && onCreateNew && (
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onCreateNew(); }} className="ml-auto">
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ContactRow({ contact, selected, onSelect }: { contact: Contact; selected: boolean; onSelect: (c: Contact) => void }) {
  return (
    <button
      className={cn(
        "w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors",
        selected && "bg-muted"
      )}
      onClick={() => onSelect(contact)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {contact.company_name || contact.contact_name || "No name"}
          </span>
          {contact.is_favorite && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs py-0">
              <Star className="h-3 w-3 fill-yellow-400 mr-0.5" />
              Fav
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {contact.contact_type === "driver" || contact.contact_type === "carrier"
            ? `MC ${contact.mc_number || "-"} · ${contact.equipment_types?.join(", ") || "-"}`
            : contact.contact_type}
          {contact.region_short && ` · ${contact.region_short}`}
        </div>
      </div>
      {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  );
}