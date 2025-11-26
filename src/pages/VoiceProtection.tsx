import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mic, DollarSign, Check, Clock, Zap, Star, Info, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CloneType = 'instant' | 'professional';

export default function VoiceProtection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cloneType, setCloneType] = useState<CloneType>('instant');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerAd, setPricePerAd] = useState("");
  const [availableForAds, setAvailableForAds] = useState(false);
  const [usageTerms, setUsageTerms] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [recordingChunks, setRecordingChunks] = useState<BlobPart[]>([]);

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
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
        setRecordingChunks(prev => [...prev, e.data]);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setRecordingStream(stream);
      setRecordingChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);

      toast({
        title: "Recording Started",
        description: cloneType === 'professional' 
          ? "Start speaking now. Best practice: Read aloud from a book for consistent quality."
          : "Speak naturally for 2 minutes.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      toast({
        title: "Recording Paused",
        description: "Click Resume to continue recording",
      });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      toast({
        title: "Recording Resumed",
        description: "Continue speaking",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
      }
      toast({
        title: "Recording Stopped",
        description: "Your voice sample has been saved",
      });
    }
  };

  const deleteRecording = () => {
    // Stop recording if in progress
    if (mediaRecorder) {
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop();
      }
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset all states
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setRecordingChunks([]);
    setMediaRecorder(null);
    setRecordingStream(null);
    
    toast({
      title: "Recording Deleted",
      description: "You can start a new recording",
    });
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
            cloneType, // 'instant' or 'professional'
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
              Choose a cloning method and record your voice sample
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clone Type Selection */}
            <div className="space-y-4">
              <Label>Select Clone Type</Label>
              <RadioGroup value={cloneType} onValueChange={(value) => setCloneType(value as CloneType)}>
                {/* Instant Voice Clone */}
                <Card className={cloneType === 'instant' ? 'border-primary border-2' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="instant" id="instant" className="mt-1" />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="instant" className="flex items-center gap-2 cursor-pointer font-semibold text-base">
                          <Zap className="h-5 w-5 text-primary" />
                          Instant Voice Clone
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Clone your voice with just 2 minutes of audio. Quick and easy setup.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">2 minutes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Voice Clone */}
                <Card className={cloneType === 'professional' ? 'border-primary border-2' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="professional" id="professional" className="mt-1" />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="professional" className="flex items-center gap-2 cursor-pointer font-semibold text-base">
                          <Star className="h-5 w-5 text-primary" />
                          Professional Voice Clone
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Create the most realistic digital replica of your voice. Requires 30 minutes of clean audio. <strong>Best practice: Read from a book.</strong>
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">30 minutes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>

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
              {/* Recording Guidance */}
              {!isRecording && !audioBlob && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Recording Tips:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Find a quiet environment</li>
                        <li>• Use a good quality microphone</li>
                        {cloneType === 'professional' && (
                          <>
                            <li>• <strong>Best practice:</strong> Read aloud from a book for 30 minutes</li>
                            <li>• Use pause/resume if you need breaks</li>
                            <li>• Maintain consistent tone and pace</li>
                          </>
                        )}
                        {cloneType === 'instant' && (
                          <li>• Speak naturally and clearly for 2 minutes</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Controls */}
              {!audioBlob && (
                <>
                  <Button
                    onClick={startRecording}
                    disabled={isRecording}
                    className="w-full"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {cloneType === 'instant' ? 'Start Recording (2 minutes)' : 'Start Recording (30 minutes)'}
                  </Button>

                  {isRecording && (
                    <div className="space-y-2">
                      <div className="bg-primary/10 p-4 rounded-lg text-center">
                        <p className="text-sm font-medium text-primary mb-2">
                          {isPaused ? "Recording Paused" : "Recording in Progress..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cloneType === 'professional' 
                            ? "Read aloud from a book. Use pause if you need a break."
                            : "Speak naturally and clearly."
                          }
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {isPaused ? (
                          <Button onClick={resumeRecording} variant="default" className="w-full">
                            Resume
                          </Button>
                        ) : (
                          <Button onClick={pauseRecording} variant="secondary" className="w-full">
                            Pause
                          </Button>
                        )}
                        <Button onClick={stopRecording} variant="outline" className="w-full">
                          Stop Recording
                        </Button>
                        <Button 
                          onClick={deleteRecording} 
                          variant="destructive" 
                          size="icon"
                          className="w-full"
                          title="Delete and start over"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Recorded Audio Preview */}
              {audioBlob && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
                    <Check className="h-4 w-4" />
                    Sample Recorded Successfully
                  </div>
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
                  </audio>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={deleteRecording} 
                      variant="destructive" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete & Start Over
                    </Button>
                    <Button onClick={() => {
                      deleteRecording();
                      setTimeout(() => startRecording(), 100);
                    }} variant="outline" size="sm">
                      Re-record
                    </Button>
                  </div>
                </div>
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
