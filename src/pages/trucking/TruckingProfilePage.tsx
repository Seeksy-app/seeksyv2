import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TruckingLayout from "@/components/trucking/TruckingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building, Bell, Phone, Mic, Save, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TruckingProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: "",
    company_name: "D & L Logistics",
    email: "",
    phone: "",
    preferred_margin_percent: 15,
    min_rate_floor: 500,
    allowed_equipment: ["Van", "Reefer", "Flatbed"],
    ai_voice_name: "Jess (English)",
    default_language: "en",
    notify_new_lead_email: true,
    notify_new_lead_sms: true,
    notify_failed_calls: true,
    twilio_number: "+1 (555) 123-4567",
  });

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          company_name: user.user_metadata?.company_name || "D & L Logistics",
        }));
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          company_name: profile.company_name,
        },
      });
      if (error) throw error;
      toast({ title: "Profile saved!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/trucking");
  };

  const equipmentOptions = ["Van", "Reefer", "Flatbed", "Step Deck", "Power Only", "Other"];

  return (
    <TruckingLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1D3557' }}>My Profile</h1>
          <p className="text-muted-foreground">Manage your D & L broker settings and how Jess handles your calls.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" style={{ color: '#FF9F1C' }} />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" style={{ color: '#FF9F1C' }} />
                Business Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Margin (%)</Label>
                <Input
                  type="number"
                  value={profile.preferred_margin_percent}
                  onChange={(e) => setProfile({ ...profile, preferred_margin_percent: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Jess will try to keep this margin when negotiating rates.</p>
              </div>
              <div className="space-y-2">
                <Label>Absolute Rate Floor (per load)</Label>
                <Input
                  type="number"
                  value={profile.min_rate_floor}
                  onChange={(e) => setProfile({ ...profile, min_rate_floor: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">AI will not book below this unless you manually approve.</p>
              </div>
              <div className="space-y-2">
                <Label>Equipment You Broker</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {equipmentOptions.map((eq) => (
                    <Badge
                      key={eq}
                      variant={profile.allowed_equipment.includes(eq) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={profile.allowed_equipment.includes(eq) ? { backgroundColor: '#FF9F1C' } : undefined}
                      onClick={() => {
                        if (profile.allowed_equipment.includes(eq)) {
                          setProfile({ ...profile, allowed_equipment: profile.allowed_equipment.filter(e => e !== eq) });
                        } else {
                          setProfile({ ...profile, allowed_equipment: [...profile.allowed_equipment, eq] });
                        }
                      }}
                    >
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Voice & Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" style={{ color: '#FF9F1C' }} />
                AI Voice & Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={profile.ai_voice_name} onValueChange={(v) => setProfile({ ...profile, ai_voice_name: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jess (English)">Jess (English)</SelectItem>
                    <SelectItem value="Jess (Spanish)">Jess (Spanish)</SelectItem>
                    <SelectItem value="Neutral Female">Neutral Female</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Call Language</Label>
                <Select value={profile.default_language} onValueChange={(v) => setProfile({ ...profile, default_language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="auto">Detect from caller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: '#FF9F1C' }} />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email me when a driver wants a load</Label>
                </div>
                <Switch
                  checked={profile.notify_new_lead_email}
                  onCheckedChange={(v) => setProfile({ ...profile, notify_new_lead_email: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Text me new lead alerts</Label>
                </div>
                <Switch
                  checked={profile.notify_new_lead_sms}
                  onCheckedChange={(v) => setProfile({ ...profile, notify_new_lead_sms: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alert me when a call fails or hangs up</Label>
                </div>
                <Switch
                  checked={profile.notify_failed_calls}
                  onCheckedChange={(v) => setProfile({ ...profile, notify_failed_calls: v })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phone & Numbers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" style={{ color: '#FF9F1C' }} />
              Phone & Numbers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>AITrucking Phone Number</Label>
              <Input value={profile.twilio_number} disabled className="bg-muted font-mono" />
              <p className="text-xs text-muted-foreground">This is the number dispatchers and drivers will call to reach Jess.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#FF9F1C' }}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </TruckingLayout>
  );
}
