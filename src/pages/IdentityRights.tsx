import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Clock, XCircle, Camera, Mic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdentityPermissionsPanel } from "@/components/identity/IdentityPermissionsPanel";
import { IdentityAccessLog } from "@/components/identity/IdentityAccessLog";
import { FaceIdentitySection } from "@/components/identity/FaceIdentitySection";
import { VoiceIdentitySection } from "@/components/identity/VoiceIdentitySection";
import { AdvertiserAccessTab } from "@/components/identity/AdvertiserAccessTab";
import { Badge } from "@/components/ui/badge";
import { IdentityErrorBoundary } from "@/components/identity/IdentityErrorBoundary";

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
  const [activeTab, setActiveTab] = useState("overview");

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["identity-assets"],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from("identity_assets")
        .select("*")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Type cast the data properly with null safety
  const identityAssets: IdentityAsset[] = Array.isArray(rawData)
    ? rawData.map((asset: any) => ({
        id: asset?.id || '',
        type: asset?.type || '',
        cert_status: asset?.cert_status || 'not_set',
        cert_tx_hash: asset?.cert_tx_hash || null,
        cert_explorer_url: asset?.cert_explorer_url || null,
        revoked_at: asset?.revoked_at || null,
        face_hash: asset?.face_hash || null,
        face_metadata_uri: asset?.face_metadata_uri || null,
        permissions: {
          clip_use: asset?.permissions?.clip_use || false,
          ai_generation: asset?.permissions?.ai_generation || false,
          advertiser_access: asset?.permissions?.advertiser_access || false,
          anonymous_training: asset?.permissions?.anonymous_training || false,
        }
      }))
    : [];

  // Debug logging for identity data
  console.log("[Identity] Raw data:", rawData);
  console.log("[Identity] Identity assets:", identityAssets);
  console.log("[Identity] Query error:", error);

  // Safely get individual identity statuses with null guards
  const voiceAsset = Array.isArray(identityAssets) 
    ? identityAssets.find(a => a?.type === "voice_identity") 
    : undefined;
  const faceAsset = Array.isArray(identityAssets) 
    ? identityAssets.find(a => a?.type === "face_identity") 
    : undefined;
  
  console.log("[Identity] Voice asset:", voiceAsset);
  console.log("[Identity] Face asset:", faceAsset);

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
    failed: {
      icon: XCircle,
      label: "Failed",
      description: "Identity verification failed. Please retry.",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-900",
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_set;
  const StatusIcon = currentStatus.icon;

  if (error) {
    console.error("[Identity] Failed to load identity assets:", error);
    return (
      <div className="container max-w-6xl py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Failed to Load Identity Data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : "An unexpected error occurred"}
                </p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading identity data...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <IdentityErrorBoundary>
      <div className="container max-w-6xl py-8 space-y-8">
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
              {status === "verified" && Array.isArray(identityAssets) && identityAssets.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {identityAssets
                    .filter(asset => asset?.cert_explorer_url && asset?.id)
                    .map((asset) => (
                      <Button
                        key={asset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.cert_explorer_url!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View {asset.type === "voice_identity" ? "Voice" : "Face"} on Chain
                      </Button>
                    ))}
                  {(() => {
                    const firstAsset = identityAssets.find(a => a?.id);
                    return firstAsset?.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/certificate/identity/${firstAsset.id}`)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions & Rights</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="advertiser-access">Advertiser Access</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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

          {/* Seeksy Identity Promise */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Seeksy Identity Promise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base font-semibold">Your likeness is yours.</p>
              <p className="text-sm text-muted-foreground">
                Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission.
              </p>
              <p className="text-sm text-muted-foreground">
                Every use of your identity — whether in clips, AI generation, or advertising — requires your consent, recorded on-chain for transparency and security.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions & Rights Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {Array.isArray(identityAssets) && identityAssets.length > 0 ? (
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
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No identity assets to manage</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete face or voice verification first
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          {!Array.isArray(identityAssets) || identityAssets.filter(a => a?.cert_status === "minted").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No certificates yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete face or voice verification to generate certificates
                </p>
                {Array.isArray(identityAssets) && identityAssets.some(a => a?.cert_status === "failed") && (
                  <p className="text-xs text-red-600 mt-2">
                    Some verifications failed. Please retry from the Overview tab.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {identityAssets
                .filter(a => a?.cert_status === "minted" && a?.id)
                .map((asset) => (
                <Card key={asset.id} className="border-2 border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {asset.type === "face_identity" ? (
                          <Camera className="h-5 w-5 text-primary" />
                        ) : (
                          <Mic className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {asset.type === "face_identity" ? "Face Identity" : "Voice Identity"}
                        </CardTitle>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 mt-1">
                          <Shield className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/certificate/identity/${asset.id}`)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                    {asset.cert_explorer_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Advertiser Access Tab */}
        <TabsContent value="advertiser-access" className="space-y-6">
          <AdvertiserAccessTab assets={identityAssets} username={profile?.username || ""} />
        </TabsContent>
      </Tabs>

      {/* Access Log - Always visible below tabs */}
      {Array.isArray(identityAssets) && identityAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Advertiser Access Log</CardTitle>
            <CardDescription>
              View all identity-related events and access grants for transparency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IdentityAccessLog assetIds={identityAssets.filter(a => a?.id).map(a => a.id)} />
          </CardContent>
        </Card>
      )}
    </div>
    </IdentityErrorBoundary>
  );
};

export default IdentityRights;
