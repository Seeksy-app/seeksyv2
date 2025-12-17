import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, Save, DollarSign, Percent, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

const EQUIPMENT_OPTIONS = ['Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only', 'Other'];

interface RatePreferences {
  id?: string;
  agency_id: string | null;
  target_margin_percent: number;
  absolute_rate_floor: number;
  rate_increment: number;
  max_negotiation_rounds: number;
  equipment_types: string[];
}

export default function TruckingAdminRatePreferencesPage() {
  const [preferences, setPreferences] = useState<RatePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_rate_preferences")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPreferences(data);
      } else {
        // Get default agency
        const { data: agency } = await supabase
          .from("trucking_agencies")
          .select("id")
          .limit(1)
          .single();
          
        setPreferences({
          agency_id: agency?.id || null,
          target_margin_percent: 15,
          absolute_rate_floor: 500,
          rate_increment: 25,
          max_negotiation_rounds: 3,
          equipment_types: ['Van', 'Reefer', 'Flatbed'],
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      if (preferences.id) {
        const { error } = await supabase
          .from("trucking_rate_preferences")
          .update({
            target_margin_percent: preferences.target_margin_percent,
            absolute_rate_floor: preferences.absolute_rate_floor,
            rate_increment: preferences.rate_increment,
            max_negotiation_rounds: preferences.max_negotiation_rounds,
            equipment_types: preferences.equipment_types,
            updated_at: new Date().toISOString(),
          })
          .eq("id", preferences.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trucking_rate_preferences")
          .insert(preferences);

        if (error) throw error;
      }

      toast({ title: "Rate preferences saved" });
      fetchPreferences();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (equipment: string) => {
    if (!preferences) return;
    
    const current = preferences.equipment_types || [];
    const updated = current.includes(equipment)
      ? current.filter(e => e !== equipment)
      : [...current, equipment];
    
    setPreferences({ ...preferences, equipment_types: updated });
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
      title="Rate Preferences"
      description="Configure how Jess negotiates rates with carriers"
      action={
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Margin Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              Margin Settings
            </CardTitle>
            <CardDescription>
              Control profit margins and minimum acceptable rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target_margin">Target Margin (%)</Label>
              <Input
                id="target_margin"
                type="number"
                value={preferences?.target_margin_percent || 15}
                onChange={(e) => setPreferences(p => p ? { ...p, target_margin_percent: parseFloat(e.target.value) || 0 } : null)}
              />
              <p className="text-xs text-muted-foreground">
                Jess starts at target rate, then offers +$25 increments up to ceiling when drivers want more.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_floor">Absolute Rate Floor (per load)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rate_floor"
                  type="number"
                  className="pl-9"
                  value={preferences?.absolute_rate_floor || 500}
                  onChange={(e) => setPreferences(p => p ? { ...p, absolute_rate_floor: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                AI will not book below this unless you manually approve.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Negotiation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Negotiation Settings
            </CardTitle>
            <CardDescription>
              Configure how the AI handles rate negotiations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate_increment">Rate Increment ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rate_increment"
                  type="number"
                  className="pl-9"
                  value={preferences?.rate_increment || 25}
                  onChange={(e) => setPreferences(p => p ? { ...p, rate_increment: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Amount to increase rate when driver asks for more.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_rounds">Max Negotiation Rounds</Label>
              <Input
                id="max_rounds"
                type="number"
                min={1}
                max={5}
                value={preferences?.max_negotiation_rounds || 3}
                onChange={(e) => setPreferences(p => p ? { ...p, max_negotiation_rounds: parseInt(e.target.value) || 3 } : null)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum times AI will counter before requiring human approval.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Types */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-500" />
              Equipment You Broker
            </CardTitle>
            <CardDescription>
              Select the equipment types you handle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((equipment) => {
                const isActive = preferences?.equipment_types?.includes(equipment);
                return (
                  <Badge
                    key={equipment}
                    variant={isActive ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                      isActive 
                        ? "bg-amber-500 hover:bg-amber-600" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleEquipment(equipment)}
                  >
                    {equipment}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TruckingPageWrapper>
  );
}
