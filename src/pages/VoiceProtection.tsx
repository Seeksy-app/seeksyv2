import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mic, DollarSign, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function VoiceProtection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerAd, setPricePerAd] = useState("");
  const [availableForAds, setAvailableForAds] = useState(false);
  const [usageTerms, setUsageTerms] = useState("");

  // Fetch user's voice profiles
  const { data: voiceProfiles } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_voice_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Record audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }, 30000); // 30 second recording
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  // Upload and clone voice
  const cloneVoice = useMutation({
    mutationFn: async () => {
      if (!audioBlob || !voiceName) {
        throw new Error("Missing audio or voice name");
      }

      // Upload audio to storage
      const fileName = `voice-samples/${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-ads-generated')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-ads-generated')
        .getPublicUrl(fileName);

      // Clone voice via ElevenLabs
      const { data: cloneData, error: cloneError } = await supabase.functions.invoke(
        'elevenlabs-clone-voice',
        {
          body: {
            voiceName,
            audioUrl: publicUrl,
            description,
          },
        }
      );

      if (cloneError) throw cloneError;

      // Save voice profile
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase
        .from('creator_voice_profiles')
        .insert({
          user_id: user.user.id,
          voice_name: voiceName,
          elevenlabs_voice_id: cloneData.voiceId,
          sample_audio_url: publicUrl,
          is_available_for_ads: availableForAds,
          price_per_ad: pricePerAd ? parseFloat(pricePerAd) : null,
          usage_terms: usageTerms,
        });

      if (insertError) throw insertError;

      return cloneData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Voice profile created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      // Reset form
      setVoiceName("");
      setDescription("");
      setPricePerAd("");
      setAvailableForAds(false);
      setUsageTerms("");
      setAudioBlob(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create voice profile",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Voice Protection & Marketplace</h1>
          <p className="text-muted-foreground">Protect your voice and monetize it through ads</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Voice Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Create Voice Profile</CardTitle>
            <CardDescription>
              Record a 30-second sample to clone your voice and make it available for advertisers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voiceName">Voice Name</Label>
              <Input
                id="voiceName"
                placeholder="My Professional Voice"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your voice tone and style..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Button
                onClick={startRecording}
                disabled={isRecording || !!audioBlob}
                className="w-full"
                variant={audioBlob ? "outline" : "default"}
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Recording... (30s)" : audioBlob ? "Sample Recorded ✓" : "Record Voice Sample"}
              </Button>
              
              {audioBlob && (
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
                </audio>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="availableForAds">Make Available for Ads</Label>
                <Switch
                  id="availableForAds"
                  checked={availableForAds}
                  onCheckedChange={setAvailableForAds}
                />
              </div>

              {availableForAds && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerAd">Price per Ad ($)</Label>
                    <Input
                      id="pricePerAd"
                      type="number"
                      placeholder="50.00"
                      value={pricePerAd}
                      onChange={(e) => setPricePerAd(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageTerms">Usage Terms</Label>
                    <Textarea
                      id="usageTerms"
                      placeholder="Describe how advertisers can use your voice..."
                      value={usageTerms}
                      onChange={(e) => setUsageTerms(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={() => cloneVoice.mutate()}
              disabled={!audioBlob || !voiceName || cloneVoice.isPending}
              className="w-full"
            >
              {cloneVoice.isPending ? "Creating Voice Profile..." : "Create Voice Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Your Voice Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Your Voice Profiles</CardTitle>
            <CardDescription>Manage your voice profiles and earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voiceProfiles?.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{profile.voice_name}</h3>
                    {profile.is_verified && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  {profile.is_available_for_ads && profile.price_per_ad && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      ${profile.price_per_ad} per ad
                    </div>
                  )}

                  {profile.sample_audio_url && (
                    <audio controls className="w-full">
                      <source src={profile.sample_audio_url} type="audio/mp3" />
                    </audio>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!voiceProfiles || voiceProfiles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No voice profiles yet. Create your first one!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
