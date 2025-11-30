import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Clock, XCircle, Camera, Mic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IdentityPermissionsPanel } from "@/components/identity/IdentityPermissionsPanel";
import { IdentityAccessLog } from "@/components/identity/IdentityAccessLog";
import { FaceIdentitySection } from "@/components/identity/FaceIdentitySection";
import { VoiceIdentitySection } from "@/components/identity/VoiceIdentitySection";
import { Badge } from "@/components/ui/badge";

interface IdentityAsset {
  id: string;
  type: string;
  cert_status: string;
  cert_tx_hash: string | null;
  cert_explorer_url: string | null;
  revoked_at: string | null;
  face_hash: string | null;
  face_metadata_uri: string | null;
  permissions: {
    clip_use: boolean;
    ai_generation: boolean;
    advertiser_access: boolean;
    anonymous_training: boolean;
  };
}

const IdentityRights = () => {
  const navigate = useNavigate();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["identity-assets"],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from("identity_assets")
        .select("*")
        .eq("creator_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  // Type cast the data properly
  const identityAssets: IdentityAsset[] = ((rawData || []) as any[]).map((asset: any) => ({
    id: asset.id,
    type: asset.type,
    cert_status: asset.cert_status,
    cert_tx_hash: asset.cert_tx_hash,
    cert_explorer_url: asset.cert_explorer_url,
    revoked_at: asset.revoked_at,
    face_hash: asset.face_hash,
    face_metadata_uri: asset.face_metadata_uri,
    permissions: asset.permissions as {
      clip_use: boolean;
      ai_generation: boolean;
      advertiser_access: boolean;
      anonymous_training: boolean;
    }
  }));

  // Get individual identity statuses
  const voiceAsset = identityAssets.find(a => a.type === "voice_identity");
  const faceAsset = identityAssets.find(a => a.type === "face_identity");

  const getAssetStatus = (asset: typeof voiceAsset) => {
    if (!asset) return "not_set";
    if (asset.revoked_at) return "revoked";
    return asset.cert_status;
  };

  const voiceStatus = getAssetStatus(voiceAsset);
  const faceStatus = getAssetStatus(faceAsset);

  // Determine overall identity status (prioritize best status)
  const getOverallStatus = () => {
    if (voiceStatus === "minted" || faceStatus === "minted") return "verified";
    if (voiceStatus === "minting" || faceStatus === "minting") return "minting";
    if (voiceStatus === "pending" || faceStatus === "pending") return "pending";
    if (voiceStatus === "revoked" && faceStatus === "revoked") return "revoked";
    if (voiceStatus === "failed" || faceStatus === "failed") return "failed";
    return "not_set";
  };

  const status = getOverallStatus();

  const statusConfig = {
    verified: {
      icon: ShieldCheck,
      label: "Verified",
      description: "Your identity is certified on-chain.",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    pending: {
      icon: Clock,
      label: "Pending",
      description: "We're processing your identity. This usually takes a few minutes.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-900",
    },
    minting: {
      icon: Clock,
      label: "Processing",
      description: "Your identity is being certified on-chain. This will complete shortly.",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    not_set: {
      icon: Shield,
      label: "Not Set",
      description: "You haven't verified your identity yet.",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted",
    },
    revoked: {
      icon: XCircle,
      label: "Revoked",
      description: "Your identity is revoked. No AI or advertiser usage is allowed.",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-900",
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;


  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Identity & Rights</h1>
        <p className="text-muted-foreground">
          Manage your verified identity assets and control how they're used across Seeksy.
        </p>
      </div>

      {/* Identity Overview Card */}
      <Card className={`border-2 ${currentStatus.borderColor}`}>
        <CardContent className={`pt-6 ${currentStatus.bgColor}`}>
          <div className="flex items-start gap-4">
            <StatusIcon className={`h-12 w-12 ${currentStatus.color}`} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">Identity Status</h3>
                  <Badge variant="outline" className={currentStatus.color}>
                    {currentStatus.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
              </div>
              
              {/* Voice & Face Status Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Voice:</span>
                  <Badge variant="outline" className={
                    voiceStatus === "minted" ? "bg-green-500/10 text-green-600" :
                    voiceStatus === "pending" || voiceStatus === "minting" ? "bg-yellow-500/10 text-yellow-600" :
                    voiceStatus === "failed" ? "bg-red-500/10 text-red-600" :
                    "bg-muted text-muted-foreground"
                  }>
                    {voiceStatus === "minted" ? "✓ Verified" : 
                     voiceStatus === "pending" ? "⏳ Pending" :
                     voiceStatus === "minting" ? "⏳ Minting" :
                     voiceStatus === "failed" ? "✗ Failed" :
                     "⚪ Not set"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Face:</span>
                  <Badge variant="outline" className={
                    faceStatus === "minted" ? "bg-green-500/10 text-green-600" :
                    faceStatus === "pending" || faceStatus === "minting" ? "bg-yellow-500/10 text-yellow-600" :
                    faceStatus === "failed" ? "bg-red-500/10 text-red-600" :
                    "bg-muted text-muted-foreground"
                  }>
                    {faceStatus === "minted" ? "✓ Verified" : 
                     faceStatus === "pending" ? "⏳ Pending" :
                     faceStatus === "minting" ? "⏳ Minting" :
                     faceStatus === "failed" ? "✗ Failed" :
                     "⚪ Not set"}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-1">
                Control how your real voice and likeness can be used on Seeksy.
              </p>
              
              {/* Certificate Links */}
              {status === "verified" && identityAssets.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {identityAssets.map((asset) => (
                    asset.cert_explorer_url && (
                      <Button
                        key={asset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View {asset.type === "voice_identity" ? "Voice" : "Face"} on Chain
                      </Button>
                    )
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/certificate/${identityAssets[0].id}`)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification CTAs */}
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>
            Create blockchain-verified identity credentials for your voice and face.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Voice Verification */}
            <VoiceIdentitySection asset={voiceAsset} />

            {/* Face Verification */}
            <FaceIdentitySection asset={faceAsset} />
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      {identityAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>How Seeksy Can Use Your Identity</CardTitle>
            <CardDescription>
              Control how your verified identity is used across the platform. All settings are opt-in and can be changed anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IdentityPermissionsPanel assets={identityAssets} />
          </CardContent>
        </Card>
      )}

      {/* Identity Promise */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Our Identity Promise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="text-sm">
              We never sell a creator's identity or likeness data.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="text-sm">
              Brands can't use a creator's face or voice without explicit approval.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="text-sm">
              Creators can revoke permissions at any time, and the identity record reflects it.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="text-sm">
              Everything here is opt-in, not buried in fine print.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Access Log */}
      {identityAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Advertiser Access Log</CardTitle>
            <CardDescription>
              View all identity-related events and access grants for transparency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IdentityAccessLog assetIds={identityAssets.map(a => a.id)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IdentityRights;
