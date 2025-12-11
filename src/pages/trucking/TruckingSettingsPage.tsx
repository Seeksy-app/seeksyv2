import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phoneFormat";
import { TruckingPageWrapper, TruckingContentCard } from "@/components/trucking/TruckingPageWrapper";

interface Settings {
  id?: string;
  demo_mode_enabled: boolean;
  notification_email: string;
  notification_sms_number: string;
  ai_caller_name: string;
  ai_caller_company_name: string;
  ai_calls_enabled: boolean;
  ai_price_per_million_chars_usd: number;
}

export default function TruckingSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    demo_mode_enabled: true,
    notification_email: "",
    notification_sms_number: "",
    ai_caller_name: "Christy",
    ai_caller_company_name: "Dispatch",
    ai_calls_enabled: true,
    ai_price_per_million_chars_usd: 50.00,
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
        ai_calls_enabled: settings.ai_calls_enabled,
        ai_price_per_million_chars_usd: settings.ai_price_per_million_chars_usd,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <TruckingPageWrapper 
      title="Settings" 
      description="Configure your AITrucking preferences"
    >
      <div className="max-w-2xl space-y-6">
        <TruckingContentCard>
          <div className="space-y-1 mb-5">
            <h3 className="font-semibold text-slate-900">AI Caller Settings</h3>
            <p className="text-sm text-slate-500">Configure how your AI assistant introduces itself to carriers</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">AI Caller Name</Label>
              <Input
                value={settings.ai_caller_name}
                onChange={(e) => setSettings({ ...settings, ai_caller_name: e.target.value })}
                placeholder="Christy"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                "Hi, this is [Name] with..."
              </p>
            </div>
            <div>
              <Label className="text-slate-700">Company Name</Label>
              <Input
                value={settings.ai_caller_company_name}
                onChange={(e) => setSettings({ ...settings, ai_caller_company_name: e.target.value })}
                placeholder="Dispatch"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                "...on behalf of [Company]"
              </p>
            </div>
          </div>
        </TruckingContentCard>

        <TruckingContentCard>
          <div className="space-y-1 mb-5">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <p className="text-sm text-slate-500">Where to send lead alerts and escalations</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Notification Email</Label>
              <Input
                type="email"
                value={settings.notification_email}
                onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                placeholder="you@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-700">SMS Number (optional)</Label>
              <Input
                type="tel"
                value={settings.notification_sms_number}
                onChange={(e) => setSettings({ ...settings, notification_sms_number: formatPhoneNumber(e.target.value) })}
                placeholder="405-444-4444"
                className="mt-1"
              />
            </div>
          </div>
        </TruckingContentCard>

        <TruckingContentCard>
          <div className="space-y-1 mb-5">
            <h3 className="font-semibold text-slate-900">AI Calling</h3>
            <p className="text-sm text-slate-500">Enable or disable AI phone calls</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">AI Calls Enabled</p>
              <p className="text-sm text-slate-500">
                When disabled, the AI agent will not make or receive calls
              </p>
            </div>
            <Switch
              checked={settings.ai_calls_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, ai_calls_enabled: checked })}
            />
          </div>
        </TruckingContentCard>

        <TruckingContentCard>
          <div className="space-y-1 mb-5">
            <h3 className="font-semibold text-slate-900">Demo Mode</h3>
            <p className="text-sm text-slate-500">Test the AI without making real calls</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Demo Mode Enabled</p>
              <p className="text-sm text-slate-500">
                When enabled, the AI console will simulate calls instead of using real telephony
              </p>
            </div>
            <Switch
              checked={settings.demo_mode_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, demo_mode_enabled: checked })}
            />
          </div>
        </TruckingContentCard>

        <TruckingContentCard>
          <div className="space-y-1 mb-5">
            <h3 className="font-semibold text-slate-900">Twilio Integration</h3>
            <p className="text-sm text-slate-500">Connect your Twilio phone number for real calls</p>
          </div>
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <p className="text-sm text-slate-600">
              To receive real carrier calls, configure your Twilio phone number's webhook to point to:
            </p>
            <code className="block mt-2 p-3 bg-white rounded-lg text-xs text-slate-800 break-all border border-slate-200">
              {`${window.location.origin}/functions/v1/ai-trucking-call-router`}
            </code>
            <p className="text-xs text-slate-500 mt-2">
              Set the HTTP method to POST and configure "A call comes in" to use this webhook.
            </p>
          </div>
        </TruckingContentCard>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </TruckingPageWrapper>
  );
}
