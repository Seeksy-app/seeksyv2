import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL",
  "IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

interface City {
  id: string;
  name: string;
  state_code: string;
  zip: string | null;
  is_favorite: boolean;
  aliases: string[] | null;
}

interface CityComboboxProps {
  value: { city: string; state: string };
  onChange: (value: { city: string; state: string }) => void;
  placeholder?: string;
}

export default function CityCombobox({ value, onChange, placeholder = "Select city..." }: CityComboboxProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", state_code: "", zip: "", is_favorite: true });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const { data } = await supabase
      .from("trucking_cities")
      .select("*")
      .eq("is_active", true)
      .order("is_favorite", { ascending: false })
      .order("name");
    
    if (data) setCities(data);
  };

  const filteredCities = cities.filter((city) => {
    const searchLower = search.toLowerCase();
    const matchesName = city.name.toLowerCase().includes(searchLower);
    const matchesState = city.state_code.toLowerCase().includes(searchLower);
    const matchesZip = city.zip?.includes(search);
    const matchesAlias = city.aliases?.some(a => a.toLowerCase().includes(searchLower));
    return matchesName || matchesState || matchesZip || matchesAlias;
  });

  // Sort: favorites first, then exact matches, then prefix matches
  const sortedCities = [...filteredCities].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    
    const searchLower = search.toLowerCase();
    const aExact = a.name.toLowerCase() === searchLower;
    const bExact = b.name.toLowerCase() === searchLower;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    const aPrefix = a.name.toLowerCase().startsWith(searchLower);
    const bPrefix = b.name.toLowerCase().startsWith(searchLower);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;
    
    return a.name.localeCompare(b.name);
  });

  const handleSelect = (city: City) => {
    onChange({ city: city.name, state: city.state_code });
    setOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    if (!newCity.name || !newCity.state_code) {
      toast({ title: "City and State are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("trucking_cities")
        .insert({
          name: newCity.name,
          state_code: newCity.state_code,
          zip: newCity.zip || null,
          is_favorite: newCity.is_favorite,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Duplicate - find existing and select it
          const existing = cities.find(
            c => c.name.toLowerCase() === newCity.name.toLowerCase() && 
                 c.state_code === newCity.state_code
          );
          if (existing) {
            handleSelect(existing);
            toast({ title: "City already exists - selected" });
          }
        } else {
          throw error;
        }
      } else if (data) {
        setCities(prev => [...prev, data]);
        onChange({ city: data.name, state: data.state_code });
        toast({ title: "City added" });
      }

      setShowCreateModal(false);
      setNewCity({ name: "", state_code: "", zip: "", is_favorite: true });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const displayValue = value.city && value.state ? `${value.city}, ${value.state}` : "";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {displayValue || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search city, state, zip..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <span className="text-muted-foreground">No cities found</span>
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setNewCity({ ...newCity, name: search });
                    setShowCreateModal(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create City
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Cities">
                {sortedCities.slice(0, 20).map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.id}
                    onSelect={() => handleSelect(city)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.city === city.name && value.state === city.state_code
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="flex-1">
                      {city.name}, {city.state_code}
                      {city.zip && <span className="text-muted-foreground ml-1">({city.zip})</span>}
                    </span>
                    {city.is_favorite && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city_name">City *</Label>
              <Input
                id="city_name"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                placeholder="e.g., Dallas"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Select
                value={newCity.state_code}
                onValueChange={(v) => setNewCity({ ...newCity, state_code: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city_zip">ZIP (optional)</Label>
              <Input
                id="city_zip"
                value={newCity.zip}
                onChange={(e) => setNewCity({ ...newCity, zip: e.target.value })}
                placeholder="e.g., 75201"
                maxLength={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_favorite"
                checked={newCity.is_favorite}
                onCheckedChange={(c) => setNewCity({ ...newCity, is_favorite: c })}
              />
              <Label htmlFor="is_favorite">Add to Favorites</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create City"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
