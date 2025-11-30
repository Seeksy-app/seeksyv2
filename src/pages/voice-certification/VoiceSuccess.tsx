import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

const VoiceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const assetId = location.state?.assetId;
  const tokenId = location.state?.tokenId || "N/A";
  const explorerUrl = location.state?.explorerUrl;
  const transactionHash = location.state?.transactionHash;

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['hsl(var(--primary))', 'hsl(var(--accent))']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['hsl(var(--primary))', 'hsl(var(--accent))']
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Identity
        </Button>

        <Card className="p-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-4">
              <CheckCircle className="h-14 w-14 text-green-500" />
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-3">Voice Verified</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your voice identity has been confirmed and stored on-chain.
              </p>
            </div>

            {/* Certificate Details */}
            <Card className="bg-primary/5 border-primary/20 p-6 text-left">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VoiceHash:</span>
                  <span className="font-mono text-xs">{transactionHash?.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-xs">{transactionHash?.slice(0, 10)}...{transactionHash?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono">{tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium">Polygon</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {assetId && (
                <Button 
                  onClick={() => navigate(`/certificate/identity/${assetId}`)}
                  className="w-full"
                >
                  View Certificate
                </Button>
              )}
              
              {explorerUrl && (
                <Button 
                  onClick={() => window.open(explorerUrl, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Blockchain
                </Button>
              )}

              <Button 
                onClick={() => navigate("/identity")}
                variant="ghost"
                className="w-full"
              >
                Return to Identity Hub
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceSuccess;
