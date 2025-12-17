import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Save, Globe, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

const VOICE_OPTIONS = [
  { id: '09AoN6tYyW3VSTQqCo7C', name: 'Jess (English)', language: 'en' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (English)', language: 'en' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (English)', language: 'en' },
  { id: 'spanish_voice_1', name: 'Maria (Spanish)', language: 'es' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
];

interface VoiceSettings {
  id?: string;
  agency_id: string | null;
  voice_id: string;
  voice_name: string | null;
  default_language: string;
  greeting_script: string | null;
}

export default function TruckingAdminVoicePage() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_ai_voice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
      } else {
        // Get default agency
        const { data: agency } = await supabase
          .from("trucking_agencies")
          .select("id")
          .limit(1)
          .single();
          
        setSettings({
          agency_id: agency?.id || null,
          voice_id: '09AoN6tYyW3VSTQqCo7C',
          voice_name: 'Jess (English)',
          default_language: 'en',
          greeting_script: 'This is Jess from D & L Transport. What load are you interested in booking?',
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from("trucking_ai_voice_settings")
          .update({
            voice_id: settings.voice_id,
            voice_name: settings.voice_name,
            default_language: settings.default_language,
            greeting_script: settings.greeting_script,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trucking_ai_voice_settings")
          .insert(settings);

        if (error) throw error;
      }

      toast({ title: "Voice settings saved" });
      fetchSettings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
    if (settings && voice) {
      setSettings({
        ...settings,
        voice_id: voiceId,
        voice_name: voice.name,
        default_language: voice.language,
      });
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
      title="AI Voice & Language"
      description="Configure how Jess sounds when speaking with carriers"
      action={
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Voice Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-amber-500" />
              Voice
            </CardTitle>
            <CardDescription>
              Select the AI voice for phone calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Voice</Label>
              <Select 
                value={settings?.voice_id || ''} 
                onValueChange={handleVoiceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current voice: <span className="font-medium text-foreground">{settings?.voice_name || 'Not selected'}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Default Call Language
            </CardTitle>
            <CardDescription>
              Primary language for carrier conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={settings?.default_language || 'en'} 
                onValueChange={(val) => setSettings(s => s ? { ...s, default_language: val } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Jess can detect and respond in Spanish when callers speak Spanish, regardless of default setting.
            </p>
          </CardContent>
        </Card>

        {/* Greeting Script */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Opening Greeting
            </CardTitle>
            <CardDescription>
              What Jess says when answering calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Script</Label>
              <Textarea
                id="greeting"
                rows={3}
                value={settings?.greeting_script || ''}
                onChange={(e) => setSettings(s => s ? { ...s, greeting_script: e.target.value } : null)}
                placeholder="This is Jess from D & L Transport. What load are you interested in booking?"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and professional. Jess will handle the rest of the conversation naturally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TruckingPageWrapper>
  );
}
