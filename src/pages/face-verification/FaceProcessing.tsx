import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FaceProcessing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const images = location.state?.images || [];

  useEffect(() => {
    if (images.length < 3) {
      navigate("/face-verification");
      return;
    }

    verifyFace();
  }, []);

  const verifyFace = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { images },
      });

      if (error) throw error;

      if (data.status === "verified") {
        navigate("/face-verification/success", { 
          state: { 
            assetId: data.assetId,
            explorerUrl: data.explorerUrl 
          } 
        });
      } else {
        toast.error("Verification failed", {
          description: data.message || "Please try again"
        });
        navigate("/face-verification");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      toast.error("Connection error", {
        description: "Please try again"
      });
      navigate("/face-verification");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full">
        <div className="text-center space-y-6">
          <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Analyzing your photos…</h1>
            <p className="text-sm text-muted-foreground">
              This usually takes less than a minute.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FaceProcessing;
