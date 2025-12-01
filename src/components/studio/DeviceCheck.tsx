import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Video, CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

interface DeviceCheckProps {
  audioLevel: number;
  onContinue: () => void;
  onBack: () => void;
  error?: string | null;
}

export function DeviceCheck({ audioLevel, onContinue, onBack, error }: DeviceCheckProps) {
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);

  // Simplified identity status (avoiding type recursion)
  const identityStatus = { voiceVerified: false, faceVerified: false };

  useEffect(() => {
    // Get available microphones
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const mics = devices.filter(device => device.kind === "audioinput");
      setAvailableMics(mics);
      if (mics.length > 0 && !selectedMic) {
        setSelectedMic(mics[0].deviceId);
      }
    });
  }, [selectedMic]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 p-6">
      <Card className="max-w-2xl w-full p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Check your setup</h1>
          <p className="text-muted-foreground">
            We'll quickly test your mic before you start recording
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Microphone Access Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Microphone Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Microphone</label>
          <Select value={selectedMic} onValueChange={setSelectedMic}>
            <SelectTrigger>
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {availableMics.map(mic => (
                <SelectItem key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mic Level Meter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Mic Level</label>
            <span className="text-xs text-muted-foreground">
              {audioLevel > 0 ? "Detecting audio..." : "Speak to test"}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>

        {/* Identity Status */}
        {identityStatus && (
          <Card className="bg-muted/30 border-muted p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Identity Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {identityStatus.faceVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  Face: {identityStatus.faceVerified ? "Verified" : "Not verified"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {identityStatus.voiceVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  Voice: {identityStatus.voiceVerified ? "Verified" : "Not verified"}
                </span>
              </div>
            </div>
            {(!identityStatus.faceVerified || !identityStatus.voiceVerified) && (
              <p className="text-xs text-muted-foreground mt-3">
                💡 Tip: Verify your identity to unlock better trust with advertisers
              </p>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back to Studio
          </Button>
          <Button 
            size="lg" 
            onClick={onContinue}
            disabled={!!error || audioLevel === 0}
            className="gap-2"
          >
            Continue to Studio
            {audioLevel > 0 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
