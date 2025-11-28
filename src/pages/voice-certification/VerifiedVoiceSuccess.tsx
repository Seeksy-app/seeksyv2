import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Shield, Award, ExternalLink, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const VerifiedVoiceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const fingerprintData = location.state?.fingerprintData || {
    voiceName: "Christy Louis"
  };
  const tokenId = location.state?.tokenId || "34523001";
  const blockchain = location.state?.blockchain || "Polygon";

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
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
        colors: ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700', '#FF6B9D']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700', '#FF6B9D']
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 relative overflow-hidden">
      {/* Confetti background effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse"></div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <CertificationStepper 
          currentStep={7} 
          totalSteps={7} 
          stepLabel="Certification Complete"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-4 animate-scale-in">
              <CheckCircle className="h-14 w-14 text-green-500" />
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Certification Complete!</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your voice has been successfully verified and minted as a blockchain credential
              </p>
            </div>
          </div>

          {/* Voice Credential Card */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-8 mb-12">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
                <Shield className="h-10 w-10 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{fingerprintData.voiceName}</h2>
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Verified Voice Credential
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Waveform Visualization */}
            <div className="h-20 flex items-center justify-center gap-1 px-4 mb-6 bg-background/50 rounded-lg">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/40 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Token ID</p>
                <p className="font-mono font-semibold text-sm">{tokenId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Blockchain</p>
                <p className="font-semibold text-sm">{blockchain}</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <Button
              size="lg"
              onClick={() => navigate("/voice-credentials")}
              className="h-auto py-6"
            >
              <Shield className="mr-2 h-5 w-5" />
              View Voice Credentials
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/voice-certification-flow")}
              className="h-auto py-6"
            >
              <Award className="mr-2 h-5 w-5" />
              Return to Dashboard
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/studio")}
              className="h-auto py-6"
            >
              <FileText className="mr-2 h-5 w-5" />
              Create Ad Script
            </Button>
          </div>

          {/* Info Banner */}
          <div className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Your voice credential is now stored on-chain and can be used to verify your identity across platforms.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <a href="#" className="hover:text-foreground transition-colors">
                View transaction on Polygonscan
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifiedVoiceSuccess;
