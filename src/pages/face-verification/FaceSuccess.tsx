import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const FaceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const assetId = location.state?.assetId;

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full">
        <div className="text-center space-y-6">
          <CheckCircle className="h-24 w-24 mx-auto text-green-500" />
          <div>
            <h1 className="text-3xl font-bold mb-3">Face Verified</h1>
            <p className="text-muted-foreground">
              Your face identity has been confirmed and stored on-chain.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {assetId && (
              <Button 
                onClick={() => navigate(`/certificate/identity/${assetId}`)}
                size="lg"
                className="w-full"
              >
                View Certificate
              </Button>
            )}
            <Button 
              onClick={() => navigate("/identity")}
              variant="outline"
              className="w-full"
            >
              Back to Identity
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FaceSuccess;
