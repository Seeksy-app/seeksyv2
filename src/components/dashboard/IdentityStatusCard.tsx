import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IdentityStatusCard = () => {
  const navigate = useNavigate();

  const { data: identityStatus } = useQuery({
    queryKey: ['identity-assets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Face identity from identity_assets
      const { data: faceAssets } = await supabase
        .from('identity_assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'face_identity');

      // Voice identity from creator_voice_profiles + blockchain certificates (active and verified)
      const { data: voiceProfile } = await (supabase as any)
        .from('creator_voice_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      const { data: voiceCert } = await (supabase as any)
        .from('voice_blockchain_certificates')
        .select('certification_status, is_active')
        .eq('creator_id', user.id)
        .eq('certification_status', 'verified')
        .eq('is_active', true)
        .maybeSingle();

      return {
        faceAsset: faceAssets?.[0] || null,
        voiceVerified: !!(voiceProfile && voiceCert),
      };
    },
  });

  const faceAsset = identityStatus?.faceAsset;
  const voiceVerified = identityStatus?.voiceVerified;

  const voiceAsset = voiceVerified ? { cert_status: 'minted' } : null;

  const getStatusBadge = (asset: any) => {
    if (!asset) return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Not Setup</Badge>;
    
    switch (asset?.cert_status) {
      case 'minted':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Verified</Badge>;
      case 'pending':
      case 'minting':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Not Setup</Badge>;
    }
  };

  const isComplete = faceAsset?.cert_status === 'minted' && voiceAsset?.cert_status === 'minted';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Identity Status</CardTitle>
          </div>
          {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
        <CardDescription>Your verified identity assets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Face Identity</span>
            {getStatusBadge(faceAsset)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Identity</span>
            {getStatusBadge(voiceAsset)}
          </div>
        </div>

        <Button 
          onClick={() => navigate("/identity")}
          className="w-full"
          variant={isComplete ? "outline" : "default"}
        >
          {isComplete ? "Manage Identity" : "Complete Identity"}
        </Button>
      </CardContent>
    </Card>
  );
};
