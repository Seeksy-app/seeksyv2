import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IdentityStatusCard = () => {
  const navigate = useNavigate();

  const { data: identityAssets } = useQuery({
    queryKey: ['identity-assets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('identity_assets')
        .select('*')
        .eq('user_id', user.id);

      return data;
    },
  });

  const faceAsset = identityAssets?.find(a => a.type === 'face_identity');
  const voiceAsset = identityAssets?.find(a => a.type === 'voice_identity');

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
