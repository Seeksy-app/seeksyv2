import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phoneFormat";

interface Settings {
  id?: string;
  demo_mode_enabled: boolean;
  notification_email: string;
  notification_sms_number: string;
  ai_caller_name: string;
  ai_caller_company_name: string;
}

export default function TruckingSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    demo_mode_enabled: true,
    notification_email: "",
    notification_sms_number: "",
    ai_caller_name: "Christy",
    ai_caller_company_name: "Dispatch",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_settings")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      // No settings yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        owner_id: user.id,
        demo_mode_enabled: settings.demo_mode_enabled,
        notification_email: settings.notification_email,
        notification_sms_number: settings.notification_sms_number,
        ai_caller_name: settings.ai_caller_name,
        ai_caller_company_name: settings.ai_caller_company_name,
      };

      const { error } = await supabase
        .from("trucking_settings")
        .upsert(settingsData, { onConflict: "owner_id" });

      if (error) throw error;
      toast({ title: "Settings saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your AITrucking preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Caller Settings</CardTitle>
          <CardDescription>Configure how your AI assistant introduces itself to carriers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>AI Caller Name</Label>
              <Input
                value={settings.ai_caller_name}
                onChange={(e) => setSettings({ ...settings, ai_caller_name: e.target.value })}
                placeholder="Christy"
              />
              <p className="text-xs text-muted-foreground mt-1">
                "Hi, this is [Name] with..."
              </p>
            </div>
            <div>
              <Label>Company Name</Label>
              <Input
                value={settings.ai_caller_company_name}
                onChange={(e) => setSettings({ ...settings, ai_caller_company_name: e.target.value })}
                placeholder="Dispatch"
              />
              <p className="text-xs text-muted-foreground mt-1">
                "...on behalf of [Company]"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Where to send lead alerts and escalations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notification Email</Label>
            <Input
              type="email"
              value={settings.notification_email}
              onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <Label>SMS Number (optional)</Label>
            <Input
              type="tel"
              value={settings.notification_sms_number}
              onChange={(e) => setSettings({ ...settings, notification_sms_number: formatPhoneNumber(e.target.value) })}
              placeholder="405-444-4444"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo Mode</CardTitle>
          <CardDescription>Test the AI without making real calls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Demo Mode Enabled</p>
              <p className="text-sm text-muted-foreground">
                When enabled, the AI console will simulate calls instead of using real telephony
              </p>
            </div>
            <Switch
              checked={settings.demo_mode_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, demo_mode_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twilio Integration</CardTitle>
          <CardDescription>Connect your Twilio phone number for real calls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              To receive real carrier calls, configure your Twilio phone number's webhook to point to:
            </p>
            <code className="block mt-2 p-2 bg-background rounded text-xs break-all">
              {`${window.location.origin}/functions/v1/ai-trucking-call-router`}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Set the HTTP method to POST and configure "A call comes in" to use this webhook.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
