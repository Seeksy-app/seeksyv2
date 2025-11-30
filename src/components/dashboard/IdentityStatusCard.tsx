import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";

export const IdentityStatusCard = () => {
  const navigate = useNavigate();
  const { data: identityStatus } = useIdentityStatus();

  const faceVerified = identityStatus?.faceVerified || false;
  const voiceVerified = identityStatus?.voiceVerified || false;
  const isComplete = faceVerified && voiceVerified;

  const getStatusBadge = (verified: boolean) => {
    if (verified) {
      return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Verified</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Not Setup</Badge>;
  };

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
            {getStatusBadge(faceVerified)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Identity</span>
            {getStatusBadge(voiceVerified)}
          </div>
        </div>

        {/* View on Polygon buttons */}
        {isComplete && (identityStatus?.faceExplorerUrl || identityStatus?.voiceExplorerUrl) && (
          <div className="space-y-2 pt-2">
            {identityStatus?.faceExplorerUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => window.open(identityStatus.faceExplorerUrl!, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Face on Polygon
              </Button>
            )}
            {identityStatus?.voiceExplorerUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => window.open(identityStatus.voiceExplorerUrl!, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Voice on Polygon
              </Button>
            )}
          </div>
        )}

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
