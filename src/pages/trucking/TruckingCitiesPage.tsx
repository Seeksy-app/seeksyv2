import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper, TruckingContentCard } from "@/components/trucking/TruckingPageWrapper";
import { Plus, MoreHorizontal, Star, Search, Pencil, Trash2, Power, PowerOff } from "lucide-react";

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
  aliases: string[] | null;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
}

export default function TruckingCitiesPage() {
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    state_code: "",
    zip: "",
    is_favorite: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trucking_cities")
      .select("*")
      .order("is_favorite", { ascending: false })
      .order("name");
    
    if (data) setCities(data);
    setLoading(false);
  };

  const filteredCities = cities.filter((city) => {
    const matchesSearch = search
      ? city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.state_code.toLowerCase().includes(search.toLowerCase()) ||
        city.zip?.includes(search) ||
        city.aliases?.some(a => a.toLowerCase().includes(search.toLowerCase()))
      : true;
    
    const matchesState = stateFilter === "all" || city.state_code === stateFilter;
    const matchesFavorite = !showFavoritesOnly || city.is_favorite;
    const matchesActive = !showActiveOnly || city.is_active;
    
    return matchesSearch && matchesState && matchesFavorite && matchesActive;
  });

  const openAddModal = () => {
    setEditingCity(null);
    setFormData({ name: "", state_code: "", zip: "", is_favorite: false });
    setShowModal(true);
  };

  const openEditModal = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      state_code: city.state_code,
      zip: city.zip || "",
      is_favorite: city.is_favorite,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.state_code) {
      toast({ title: "City and State are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingCity) {
        const { error } = await supabase
          .from("trucking_cities")
          .update({
            name: formData.name,
            state_code: formData.state_code,
            zip: formData.zip || null,
            is_favorite: formData.is_favorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCity.id);
        
        if (error) throw error;
        toast({ title: "City updated" });
      } else {
        const { error } = await supabase
          .from("trucking_cities")
          .insert({
            name: formData.name,
            state_code: formData.state_code,
            zip: formData.zip || null,
            is_favorite: formData.is_favorite,
            created_by: user.id,
          });
        
        if (error) {
          if (error.code === "23505") {
            toast({ title: "City already exists", variant: "destructive" });
          } else {
            throw error;
          }
        } else {
          toast({ title: "City added" });
        }
      }

      setShowModal(false);
      fetchCities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (city: City) => {
    const { error } = await supabase
      .from("trucking_cities")
      .update({ is_active: !city.is_active, updated_at: new Date().toISOString() })
      .eq("id", city.id);
    
    if (!error) {
      toast({ title: city.is_active ? "City deactivated" : "City activated" });
      fetchCities();
    }
  };

  const toggleFavorite = async (city: City) => {
    const { error } = await supabase
      .from("trucking_cities")
      .update({ is_favorite: !city.is_favorite, updated_at: new Date().toISOString() })
      .eq("id", city.id);
    
    if (!error) {
      fetchCities();
    }
  };

  const deleteCity = async (city: City) => {
    if (!confirm(`Delete ${city.name}, ${city.state_code}?`)) return;
    
    const { error } = await supabase
      .from("trucking_cities")
      .delete()
      .eq("id", city.id);
    
    if (!error) {
      toast({ title: "City deleted" });
      fetchCities();
    }
  };

  return (
    <TruckingPageWrapper 
      title="Cities Directory" 
      description="Manage your commonly used cities for quick load entry"
    >
      <TruckingContentCard>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search city, state, zip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={`h-4 w-4 mr-1 ${showFavoritesOnly ? "fill-current" : ""}`} />
            Favorites
          </Button>
          <Button
            variant={showActiveOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowActiveOnly(!showActiveOnly)}
          >
            Active Only
          </Button>
          <Button onClick={openAddModal} className="ml-auto">
            <Plus className="h-4 w-4 mr-1" />
            Add City
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No cities found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCities.map((city) => (
                  <TableRow key={city.id} className={!city.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <button
                        onClick={() => toggleFavorite(city)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            city.is_favorite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.state_code}</TableCell>
                    <TableCell>{city.zip || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          city.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {city.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(city)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(city)}>
                            {city.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteCity(city)}
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
        )}
      </TruckingContentCard>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>City *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dallas"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Select
                value={formData.state_code}
                onValueChange={(v) => setFormData({ ...formData, state_code: v })}
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
              <Label>ZIP (optional)</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                placeholder="e.g., 75201"
                maxLength={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="favorite"
                checked={formData.is_favorite}
                onCheckedChange={(c) => setFormData({ ...formData, is_favorite: c })}
              />
              <Label htmlFor="favorite">Add to Favorites</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingCity ? "Update" : "Add City"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TruckingPageWrapper>
  );
}
