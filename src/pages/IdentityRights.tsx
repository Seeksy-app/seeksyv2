import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, XCircle, Camera, Mic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IdentityPromiseBanner } from "@/components/identity/IdentityPromiseBanner";
import { IdentityActivityLog } from "@/components/identity/IdentityActivityLog";

const IdentityRights = () => {
  const navigate = useNavigate();

  const { data: voiceStatus } = useQuery({
    queryKey: ["voice-identity-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check voice profile is_verified status
      const { data: profileData } = await (supabase as any)
        .from("creator_voice_profiles")
        .select("id, is_verified")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .maybeSingle();

      // Check blockchain certificate (must be active and verified)
      const { data: certData } = await (supabase as any)
        .from("voice_blockchain_certificates")
        .select("id, certification_status, cert_explorer_url, voice_profile_id, is_active")
        .eq("creator_id", user.id)
        .eq("certification_status", "verified")
        .eq("is_active", true)
        .maybeSingle();

      return {
        isVerified: !!profileData && !!certData,
        certExplorerUrl: certData?.cert_explorer_url || null,
        voiceProfileId: profileData?.id || null,
      };
    },
  });

  const { data: faceStatus } = useQuery({
    queryKey: ["face-identity-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: assetData } = await (supabase as any)
        .from("identity_assets")
        .select("id, cert_status, cert_explorer_url")
        .eq("user_id", user.id)
        .eq("type", "face_identity")
        .is("revoked_at", null)
        .maybeSingle();

      return {
        isVerified: assetData?.cert_status === "minted",
        certExplorerUrl: assetData?.cert_explorer_url || null,
        assetId: assetData?.id || null,
      };
    },
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["identity-activity-logs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await (supabase as any)
        .from("identity_access_logs")
        .select("id, action, created_at, details")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      return data || [];
    },
  });

  const voiceVerified = voiceStatus?.isVerified || false;
  const faceVerified = faceStatus?.isVerified || false;

  const getOverallStatus = () => {
    if (voiceVerified && faceVerified) return { label: "Verified", icon: ShieldCheck, color: "text-green-600" };
    if (voiceVerified || faceVerified) return { label: "Partial", icon: Shield, color: "text-yellow-600" };
    return { label: "No", icon: XCircle, color: "text-muted-foreground" };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1080px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Identity & Rights</h1>
          <p className="text-muted-foreground">
            Manage your verified face, voice, and permissions.
          </p>
        </div>

        {/* Status Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">FACE</p>
                <div className="flex items-center justify-center gap-2">
                  {faceVerified ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={faceVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    {faceVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">VOICE</p>
                <div className="flex items-center justify-center gap-2">
                  {voiceVerified ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={voiceVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    {voiceVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">OVERALL</p>
                <div className="flex items-center justify-center gap-2">
                  <overallStatus.icon className={`h-5 w-5 ${overallStatus.color}`} />
                  <span className={`${overallStatus.color} font-medium`}>
                    {overallStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Complete both face and voice verification to secure your identity.
        </div>

        {/* Identity Cards Side by Side */}
        <div className="grid grid-cols-2 gap-6">
          {/* Face Identity Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">FACE IDENTITY</h3>
                  <Badge variant="outline" className={faceVerified ? "border-green-500 text-green-600" : ""}>
                    {faceVerified ? "Verified" : "Not verified"}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {faceVerified 
                  ? "Your face is verified and secured on-chain"
                  : "Upload 3–5 clear photos to verify your face identity"
                }
              </p>

              <div className="space-y-2">
                {faceVerified ? (
                  <>
                    <Button 
                      onClick={() => navigate(`/certificate/identity/${faceStatus?.assetId}`)}
                      variant="default"
                      className="w-full"
                    >
                      View Certificate
                    </Button>
                    {faceStatus?.certExplorerUrl && (
                      <Button 
                        onClick={() => window.open(faceStatus.certExplorerUrl!, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate("/face-verification")}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Reverify
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/face-verification")}
                    className="w-full"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Identity Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mic className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">VOICE IDENTITY</h3>
                  <Badge variant="outline" className={voiceVerified ? "border-green-500 text-green-600" : ""}>
                    {voiceVerified ? "Verified" : "Not verified"}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {voiceVerified 
                  ? "Your voice is verified and secured on-chain"
                  : "Record at least 10 seconds to verify your voice identity"
                }
              </p>

              <div className="space-y-2">
                {voiceVerified ? (
                  <>
                    <Button 
                      onClick={() => navigate(`/certificate/identity/${voiceStatus?.voiceProfileId}`)}
                      variant="default"
                      className="w-full"
                    >
                      View Certificate
                    </Button>
                    {voiceStatus?.certExplorerUrl && (
                      <Button 
                        onClick={() => window.open(voiceStatus.certExplorerUrl!, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate("/identity/voice/verify")}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Reset Voice Identity
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/identity/voice/verify")}
                    className="w-full"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seeksy Identity Promise */}
        <IdentityPromiseBanner />

        {/* Activity Log */}
        <IdentityActivityLog logs={activityLogs} />
      </div>
    </div>
  );
};

export default IdentityRights;
