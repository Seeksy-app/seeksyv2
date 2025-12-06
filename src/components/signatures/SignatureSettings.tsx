import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, Copy, Check, Bell, AlertCircle } from "lucide-react";
import { ChromeExtensionDownload } from "./ChromeExtensionDownload";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SignatureSettingsProps {
  signatures: any[];
}

export function SignatureSettings({ signatures }: SignatureSettingsProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_on_open: true,
    notify_on_click: true,
    notify_via_email: true,
    notify_via_browser: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch API key
    const { data: keyData } = await supabase
      .from("signature_extension_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (keyData) setApiKey(keyData.api_key);

    // Fetch notification settings
    const { data: settingsData } = await supabase
      .from("signature_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsData) {
      setSettings({
        notify_on_open: settingsData.notify_on_open,
        notify_on_click: settingsData.notify_on_click,
        notify_via_email: settingsData.notify_via_email,
        notify_via_browser: settingsData.notify_via_browser,
      });
    }
  };

  const generateApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newKey = `sk_${crypto.randomUUID().replace(/-/g, "")}`;

    // Deactivate existing keys
    await supabase
      .from("signature_extension_keys")
      .update({ is_active: false })
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("signature_extension_keys")
      .insert({
        user_id: user.id,
        api_key: newKey,
        is_active: true,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to generate API key", variant: "destructive" });
    } else {
      setApiKey(newKey);
      toast({ title: "API Key Generated", description: "Use this key in the Chrome extension" });
    }
  };

  const copyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveNotificationSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("signature_notification_settings")
      .upsert({
        user_id: user.id,
        ...settings,
      });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Notification preferences updated" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Chrome Extension Download */}
      <ChromeExtensionDownload signatures={signatures} apiKey={apiKey} />

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Extension API Key
          </CardTitle>
          <CardDescription>
            Required for the Chrome extension to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                {apiKey.slice(0, 12)}...{apiKey.slice(-8)}
              </code>
              <Button variant="outline" size="icon" onClick={copyApiKey}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={generateApiKey}>
                Regenerate
              </Button>
            </div>
          ) : (
            <Button onClick={generateApiKey}>Generate API Key</Button>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Get notified when your emails are opened or clicked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are saved for Phase 2. Email and browser alerts coming soon.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notify on email opens</Label>
                <p className="text-sm text-muted-foreground">When someone views your email</p>
              </div>
              <Switch 
                checked={settings.notify_on_open} 
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_open: v }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notify on link clicks</Label>
                <p className="text-sm text-muted-foreground">When someone clicks a link in your signature</p>
              </div>
              <Switch 
                checked={settings.notify_on_click} 
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_click: v }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch 
                checked={settings.notify_via_email} 
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_via_email: v }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Browser notifications</Label>
                <p className="text-sm text-muted-foreground">Chrome extension push notifications</p>
              </div>
              <Switch 
                checked={settings.notify_via_browser} 
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_via_browser: v }))} 
              />
            </div>
          </div>

          <Button onClick={saveNotificationSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}