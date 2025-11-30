import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Clock, XCircle, Camera, Mic, ExternalLink, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface VoiceIdentityStatus {
  hasProfile: boolean;
  hasCertificate: boolean;
  isVerified: boolean;
  voiceFingerprint: string | null;
  certExplorerUrl: string | null;
  certifiedAt: string | null;
  voiceAssetId: string | null;
}

interface FaceIdentityStatus {
  hasAsset: boolean;
  isVerified: boolean;
  faceHash: string | null;
  certExplorerUrl: string | null;
  certifiedAt: string | null;
  assetId: string | null;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  created_at: string;
  identity_asset_id: string;
  identity_type: string;
  token_id?: string;
}

const IdentityRights = () => {
  const navigate = useNavigate();

  // Fetch voice identity status with proper joins
  const { data: voiceStatus } = useQuery({
    queryKey: ["voice-identity-status"],
    queryFn: async (): Promise<VoiceIdentityStatus> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check creator_voice_profiles for verified status
      const { data: profileData } = await (supabase as any)
        .from("creator_voice_profiles")
        .select("id, is_verified")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .maybeSingle();

      // Check voice_blockchain_certificates for minted certificate
      const { data: certData } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("certification_status, cert_explorer_url, created_at, voice_fingerprint_hash")
        .eq("creator_id", user.id)
        .eq("certification_status", "verified")
        .maybeSingle();

      // Check identity_assets for voice_identity
      const { data: assetData } = await (supabase as any)
        .from("identity_assets")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "voice_identity")
        .maybeSingle();

      const hasProfile = !!profileData;
      const hasCertificate = !!certData;
      const isVerified = hasProfile && hasCertificate;

      return {
        hasProfile,
        hasCertificate,
        isVerified,
        voiceFingerprint: certData?.voice_fingerprint_hash || null,
        certExplorerUrl: certData?.cert_explorer_url || null,
        certifiedAt: certData?.created_at || null,
        voiceAssetId: assetData?.id || null,
      };
    },
  });

  // Fetch face identity status
  const { data: faceStatus } = useQuery({
    queryKey: ["face-identity-status"],
    queryFn: async (): Promise<FaceIdentityStatus> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: assetData } = await (supabase as any)
        .from("identity_assets")
        .select("id, cert_status, face_hash, cert_explorer_url, created_at")
        .eq("user_id", user.id)
        .eq("type", "face_identity")
        .is("revoked_at", null)
        .maybeSingle();

      const hasAsset = !!assetData;
      const isVerified = hasAsset && assetData.cert_status === "minted";

      return {
        hasAsset,
        isVerified,
        faceHash: assetData?.face_hash || null,
        certExplorerUrl: assetData?.cert_explorer_url || null,
        certifiedAt: assetData?.created_at || null,
        assetId: assetData?.id || null,
      };
    },
  });

  // Fetch recent activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ["identity-activity-logs"],
    queryFn: async (): Promise<ActivityLogEntry[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("identity_access_logs")
        .select("id, action, created_at, identity_asset_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Determine identity type based on action names
      return (data || []).map((log: any) => ({
        ...log,
        identity_type: log.action.includes('face') ? 'face' : 
                      log.action.includes('voice') ? 'voice' : 'identity'
      }));
    },
  });

  const voiceVerified = voiceStatus?.isVerified || false;
  const faceVerified = faceStatus?.isVerified || false;
  
  // Overall identity status logic
  const overallStatus = voiceVerified && faceVerified ? "verified" :
                        voiceVerified || faceVerified ? "partially_verified" :
                        "not_set";

  const getOverallStatusDisplay = () => {
    if (overallStatus === "verified") {
      return { label: "Verified", icon: ShieldCheck, color: "text-green-600 bg-green-50 border-green-200" };
    } else if (overallStatus === "partially_verified") {
      return { label: "Partially Verified", icon: Shield, color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    } else {
      return { label: "Not Set", icon: XCircle, color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
  };

  const getVoiceStatusDisplay = () => {
    return voiceVerified 
      ? { label: "Verified", icon: ShieldCheck, color: "text-green-600 bg-green-50 border-green-200" }
      : { label: "Not Set", icon: XCircle, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

  const getFaceStatusDisplay = () => {
    return faceVerified
      ? { label: "Verified", icon: ShieldCheck, color: "text-green-600 bg-green-50 border-green-200" }
      : { label: "Not Set", icon: XCircle, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

  const overallDisplay = getOverallStatusDisplay();
  const voiceDisplay = getVoiceStatusDisplay();
  const faceDisplay = getFaceStatusDisplay();

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-7 w-7 text-primary" />
            Identity & Rights
          </h1>
          <p className="text-muted-foreground">
            Manage your verified face, voice, and how Seeksy is allowed to use them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/identity-dashboard")} variant="default">
            Open Identity Hub
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {faceStatus?.certExplorerUrl && (
                <DropdownMenuItem onClick={() => window.open(faceStatus.certExplorerUrl!, '_blank')}>
                  <Camera className="h-4 w-4 mr-2" />
                  Face on Polygon
                </DropdownMenuItem>
              )}
              {voiceStatus?.certExplorerUrl && (
                <DropdownMenuItem onClick={() => window.open(voiceStatus.certExplorerUrl!, '_blank')}>
                  <Mic className="h-4 w-4 mr-2" />
                  Voice on Polygon
                </DropdownMenuItem>
              )}
              {!faceStatus?.certExplorerUrl && !voiceStatus?.certExplorerUrl && (
                <DropdownMenuItem disabled>
                  No blockchain certificates yet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity Status Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Identity Status:</span>
              <Badge variant="outline" className={`flex items-center gap-1.5 ${overallDisplay.color}`}>
                <overallDisplay.icon className="h-3.5 w-3.5" />
                {overallDisplay.label}
              </Badge>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Face:</span>
              <Badge variant="outline" className={`flex items-center gap-1.5 ${faceDisplay.color}`}>
                <faceDisplay.icon className="h-3.5 w-3.5" />
                {faceDisplay.label}
              </Badge>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Voice:</span>
              <Badge variant="outline" className={`flex items-center gap-1.5 ${voiceDisplay.color}`}>
                <voiceDisplay.icon className="h-3.5 w-3.5" />
                {voiceDisplay.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice and Face Identity Cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Voice Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Identity
            </CardTitle>
            <CardDescription>
              {voiceVerified ? "Your voice is verified and secured on-chain" : "Verify your voice to protect your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${voiceDisplay.color}`}>
                <voiceDisplay.icon className="h-3 w-3 mr-1" />
                {voiceDisplay.label}
              </Badge>
            </div>

            {voiceVerified && voiceStatus?.voiceFingerprint && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Voice Fingerprint</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {voiceStatus.voiceFingerprint.slice(0, 16)}...
                </code>
              </div>
            )}

            {voiceVerified && voiceStatus?.certifiedAt && (
              <p className="text-xs text-muted-foreground">
                Certified {format(new Date(voiceStatus.certifiedAt), 'MMM d, yyyy')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {voiceVerified ? (
                <>
                  <Button onClick={() => navigate("/my-voice-identity")} variant="default" className="w-full">
                    Manage Voice Identity
                  </Button>
                  {voiceStatus?.voiceAssetId && (
                    <Button 
                      onClick={() => navigate(`/certificate/identity/${voiceStatus.voiceAssetId}`)} 
                      variant="outline"
                      className="w-full"
                    >
                      View Voice Certificate
                    </Button>
                  )}
                  {voiceStatus?.certExplorerUrl && (
                    <Button 
                      onClick={() => window.open(voiceStatus.certExplorerUrl!, '_blank')} 
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      View on Polygon
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => navigate("/voice-certification-flow")} variant="default" className="w-full">
                  Verify My Voice
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Face Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Face Identity
            </CardTitle>
            <CardDescription>
              {faceVerified ? "Your face is verified and secured on-chain" : "Verify your face to protect your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${faceDisplay.color}`}>
                <faceDisplay.icon className="h-3 w-3 mr-1" />
                {faceDisplay.label}
              </Badge>
            </div>

            {faceVerified && faceStatus?.faceHash && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Face Hash</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {faceStatus.faceHash.slice(0, 16)}...
                </code>
              </div>
            )}

            {faceVerified && faceStatus?.certifiedAt && (
              <p className="text-xs text-muted-foreground">
                Certified {format(new Date(faceStatus.certifiedAt), 'MMM d, yyyy')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {faceVerified ? (
                <>
                  <Button onClick={() => navigate("/identity-dashboard")} variant="default" className="w-full">
                    Manage Face Identity
                  </Button>
                  {faceStatus?.assetId && (
                    <Button 
                      onClick={() => navigate(`/certificate/identity/${faceStatus.assetId}`)} 
                      variant="outline"
                      className="w-full"
                    >
                      View Face Certificate
                    </Button>
                  )}
                  {faceStatus?.certExplorerUrl && (
                    <Button 
                      onClick={() => window.open(faceStatus.certExplorerUrl!, '_blank')} 
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      View on Polygon
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => navigate("/face-verification")} variant="default" className="w-full">
                  Verify My Face
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seeksy Identity Promise Banner */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Seeksy Identity Promise</h3>
              <p className="text-sm text-muted-foreground">
                Your likeness is yours. Seeksy will never sell, license, or use your face or voice without your explicit permission. 
                Every use of your identity — clips, AI generation, or advertising — is logged and recorded for transparency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Activity & Access Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Identity Activity & Access Log
            </span>
            <Button 
              onClick={() => navigate("/identity-dashboard")} 
              variant="ghost" 
              size="sm"
            >
              View Full Log
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity logged yet. Start by verifying your face or voice identity.
            </p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {log.identity_type === 'voice' ? (
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    ) : log.identity_type === 'face' ? (
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.identity_type === 'voice' ? 'Voice identity' : 
                         log.identity_type === 'face' ? 'Face identity' : 
                         'Identity'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentityRights;
