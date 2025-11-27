import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mic, DollarSign, Check, Clock, Zap, Star, Info, Trash2, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ScriptEditor from "@/components/voice/ScriptEditor";
import confetti from "canvas-confetti";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";

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
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoStopTimeout, setAutoStopTimeout] = useState<NodeJS.Timeout | null>(null);
  const [script, setScript] = useState("");
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

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

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [consentGiven, setConsentGiven] = useState(false);

  const handleStartRecordingClick = () => {
    if (!consentGiven) {
      setShowConsentDialog(true);
      setConsentChecked(false);
    } else {
      startRecording();
    }
  };

  const handleConsentConfirm = () => {
    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please confirm that you own the rights to this voice.",
        variant: "destructive",
      });
      return;
    }
    setShowConsentDialog(false);
    setConsentGiven(true);
  };

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
        // Clear timers
        if (countdownInterval) clearInterval(countdownInterval);
        if (autoStopTimeout) clearTimeout(autoStopTimeout);
        // Celebrate completion
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      };

      setMediaRecorder(recorder);
      setRecordingStream(stream);
      setRecordingChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Set initial time based on clone type
      const duration = cloneType === 'professional' ? 1800 : 120;
      setTimeRemaining(duration);

      // Start countdown
      const interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      setCountdownInterval(interval);

      // Auto-stop after duration
      const timeout = setTimeout(() => {
        stopRecording();
      }, duration * 1000);
      setAutoStopTimeout(timeout);

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
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      setCountdownInterval(interval);
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
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
        setAutoStopTimeout(null);
      }
    }
  };

  const deleteRecording = () => {
    if (mediaRecorder) {
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop();
      }
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    if (autoStopTimeout) {
      clearTimeout(autoStopTimeout);
      setAutoStopTimeout(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setRecordingChunks([]);
    setMediaRecorder(null);
    setRecordingStream(null);
    setTimeRemaining(cloneType === 'professional' ? 1800 : 120);
  };

  // Upload and clone voice
  const cloneVoice = useMutation({
    mutationFn: async () => {
      if (!audioBlob || !voiceName) {
        throw new Error("Missing audio or voice name");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/voice-samples/${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-ads-generated')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-ads-generated')
        .getPublicUrl(fileName);

      const { data: cloneData, error: cloneError } = await supabase.functions.invoke(
        'elevenlabs-clone-voice',
        {
          body: {
            voiceName,
            audioUrl: publicUrl,
            description,
            cloneType,
          },
        }
      );

      if (cloneError) throw cloneError;

      const { error: insertError } = await supabase
        .from('creator_voice_profiles')
        .insert({
          user_id: user.id,
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
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      toast({
        title: "Success! 🎉",
        description: "Voice profile created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
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

      {/* Voice Profiles at Top */}
      {voiceProfiles && voiceProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Your Voice Profiles
            </CardTitle>
            <CardDescription>
              Blockchain-certified voice ownership and licensing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Blockchain Certification Banner */}
            <div className="p-4 border-2 border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Voice Blockchain Certification Active</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your voice fingerprints are secured on-chain with cryptographic proof of ownership. Each profile includes tamper-proof metadata tracking creation, usage, and licensing terms.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">On-chain certification</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Cryptographic fingerprint</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Usage tracking</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Licensing proof</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Profile Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {voiceProfiles.map((profile) => (
                <Card key={profile.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{profile.voice_name}</CardTitle>
                        <VoiceCertifiedBadge size="sm" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.usage_terms && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.usage_terms}
                      </p>
                    )}
                    
                    {/* Blockchain Status */}
                    <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="font-medium">Blockchain Status</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>Certification:</span>
                          <span className="text-primary font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Fingerprint:</span>
                          <span className="text-primary font-mono text-[10px]">
                            {profile.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Price per ad:</span>
                      <span className="font-semibold text-primary">
                        ${profile.price_per_ad}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Stats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Create Voice Profile */}
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
                          Clone your voice with just 2 minutes of audio.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">2 minutes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cloneType === 'professional' ? 'border-primary border-2' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="professional" id="professional" className="mt-1" />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="professional" className="flex items-center gap-2 cursor-pointer font-semibold text-base">
                          <Star className="h-5 w-5 text-primary" />
                          Professional Voice Clone
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Most realistic digital replica. Requires 30 minutes.
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

            {/* Script Editor with Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recording Script</Label>
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
              <ScriptEditor 
                script={script}
                onScriptChange={setScript}
                cloneType={cloneType}
              />
            </div>

            <div className="space-y-4">
              {/* Recording Controls */}
              {!audioBlob && (
                <>
                  <Button
                    onClick={handleStartRecordingClick}
                    disabled={isRecording}
                    className="w-full"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {cloneType === 'instant' ? 'Start Recording (2 minutes)' : 'Start Recording (30 minutes)'}
                  </Button>

                  {isRecording && (
                    <div className="space-y-4">
                      <div>
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
                          Stop
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

              {/* Audio Preview */}
              {audioBlob && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Recording Complete!</p>
                  </div>
                  <audio 
                    controls 
                    src={URL.createObjectURL(audioBlob)} 
                    className="w-full"
                  />
                  <Button 
                    onClick={deleteRecording} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete & Re-record
                  </Button>
                </div>
              )}
            </div>

            {/* Monetization Options */}
            {audioBlob && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Ad Use</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="50.00"
                      value={pricePerAd}
                      onChange={(e) => setPricePerAd(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Usage Terms (Optional)</Label>
                  <Textarea
                    id="terms"
                    placeholder="Specify how advertisers can use your voice..."
                    value={usageTerms}
                    onChange={(e) => setUsageTerms(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={availableForAds}
                    onCheckedChange={setAvailableForAds}
                  />
                  <Label htmlFor="available" className="cursor-pointer">
                    Make available for advertisers
                  </Label>
                </div>

                <Button
                  onClick={() => cloneVoice.mutate()}
                  disabled={cloneVoice.isPending}
                  className="w-full"
                >
                  {cloneVoice.isPending ? "Creating..." : "Create Voice Profile"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Reading Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Recording Tips
            </CardTitle>
            <CardDescription>
              Get the best results from your voice cloning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                <h3 className="font-semibold mb-2">📍 Environment</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Record in a quiet space with minimal echo</li>
                  <li>Use a quality microphone if available</li>
                  <li>Avoid background noise and distractions</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                <h3 className="font-semibold mb-2">🎤 Voice Quality</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Speak naturally at your normal pace</li>
                  <li>Maintain consistent volume and energy</li>
                  <li>Vary your tone to capture emotional range</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                <h3 className="font-semibold mb-2">📝 Content Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Read diverse content (questions, statements, emotions)</li>
                  <li>Include pauses and natural breathing</li>
                  <li>Pronounce words clearly without over-enunciating</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                <h3 className="font-semibold mb-2">⏱️ Duration</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Instant:</strong> 2 min minimum - good for basic cloning</li>
                  <li><strong>Professional:</strong> 30 min - highest quality results</li>
                  <li>Longer recordings capture more nuances</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg">
                <h3 className="font-semibold mb-2 text-destructive">⚠️ Important</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Only clone your own voice or voices you have permission to use</li>
                  <li>Unauthorized voice cloning is illegal</li>
                  <li>You'll be asked to confirm ownership before recording</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Voice Ownership Confirmation
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4 text-left">
              <p className="font-semibold text-foreground">
                Before you begin recording, please confirm the following:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You are the legal owner of this voice</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You have full rights to use, license, and monetize this voice</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You are at least 18 years of age</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="min-w-[20px] text-primary font-bold">✓</div>
                  <p>You understand that your voice may be used in commercial advertisements</p>
                </div>
              </div>

              <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg">
                <p className="text-destructive font-semibold text-sm">
                  ⚠️ Important Legal Notice
                </p>
                <p className="text-xs mt-2">
                  Unauthorized voice cloning is illegal and may result in civil and criminal penalties. 
                  By proceeding, you certify under penalty of perjury that you have the legal right to 
                  clone and monetize this voice.
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm that I am the owner of this voice and have the legal right to use it
                </label>
              </div>
            </DialogDescription>
          </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowConsentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConsentConfirm}
                disabled={!consentChecked}
                className="bg-primary"
              >
                Continue
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
