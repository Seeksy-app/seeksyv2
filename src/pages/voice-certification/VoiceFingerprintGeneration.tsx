import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const VoiceFingerprintGeneration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Simulate fingerprint generation, then proceed to minting
    const timer = setTimeout(() => {
      navigate("/voice-certification/minting", { state: location.state });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full">
        <div className="text-center space-y-6">
          <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Analyzing your recording…</h1>
            <p className="text-sm text-muted-foreground">
              This may take 10–20 seconds.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceFingerprintGeneration;
