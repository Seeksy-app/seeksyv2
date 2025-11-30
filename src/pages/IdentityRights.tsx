import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Clock, XCircle, Camera, Mic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IdentityPermissionsPanel } from "@/components/identity/IdentityPermissionsPanel";
import { IdentityAccessLog } from "@/components/identity/IdentityAccessLog";
import { Badge } from "@/components/ui/badge";

interface IdentityAsset {
  id: string;
  type: string;
  cert_status: string;
  cert_tx_hash: string | null;
  cert_explorer_url: string | null;
  revoked_at: string | null;
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
    permissions: asset.permissions as {
      clip_use: boolean;
      ai_generation: boolean;
      advertiser_access: boolean;
      anonymous_training: boolean;
    }
  }));

  // Determine overall identity status
  const getIdentityStatus = () => {
    if (!identityAssets.length) return "not_set";
    
    const hasRevoked = identityAssets.some(a => a.revoked_at);
    if (hasRevoked) return "revoked";
    
    const hasMinted = identityAssets.some(a => a.cert_status === "minted");
    const hasMinting = identityAssets.some(a => a.cert_status === "minting");
    const hasPending = identityAssets.some(a => a.cert_status === "pending");
    
    if (hasMinted) return "verified";
    if (hasMinting) return "minting";
    if (hasPending) return "pending";
    
    return "not_set";
  };

  const status = getIdentityStatus();

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

  const voiceAsset = identityAssets.find(a => a.type === "voice_identity");
  const faceAsset = identityAssets.find(a => a.type === "face_identity");

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Identity & Rights</h1>
        <p className="text-muted-foreground">
          Manage your verified identity assets and control how they're used across Seeksy.
        </p>
      </div>

      {/* Identity Status Card */}
      <Card className={`border-2 ${currentStatus.borderColor}`}>
        <CardContent className={`pt-6 ${currentStatus.bgColor}`}>
          <div className="flex items-start gap-4">
            <StatusIcon className={`h-12 w-12 ${currentStatus.color}`} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Identity Status</h3>
                <Badge variant="outline" className={currentStatus.color}>
                  {currentStatus.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
              
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
            Record your face and voice samples to create verified identity credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Voice Verification */}
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Voice Identity</h4>
                    {voiceAsset ? (
                      <Badge variant="outline" className="text-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not verified</p>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant={voiceAsset ? "outline" : "default"}
                  onClick={() => navigate("/voice-certification")}
                >
                  {voiceAsset ? "View Voice Certificate" : "Record Voice Sample"}
                </Button>
              </CardContent>
            </Card>

            {/* Face Verification */}
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Face Identity</h4>
                    {faceAsset ? (
                      <Badge variant="outline" className="text-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not verified</p>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant={faceAsset ? "outline" : "default"}
                  disabled={!faceAsset}
                  onClick={() => {
                    // Future: navigate to face verification flow
                  }}
                >
                  {faceAsset ? "View Face Certificate" : "Coming Soon"}
                </Button>
              </CardContent>
            </Card>
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
