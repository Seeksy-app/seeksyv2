import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Shield, Award, ExternalLink, Download, Share2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";
import { useToast } from "@/hooks/use-toast";
import { exportCardAsImage } from "@/lib/utils/exportCardAsImage";
import { supabase } from "@/integrations/supabase/client";

const VerifiedVoiceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [username, setUsername] = useState<string>("");
  
  const fingerprintData = location.state?.fingerprintData || {
    voiceName: "Christy Louis"
  };
  const tokenId = location.state?.tokenId || "34523001";
  const blockchain = location.state?.blockchain || "Polygon";

  useEffect(() => {
    // Fetch current user's username
    fetchUsername();
    
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

  const fetchUsername = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile?.username) {
          setUsername(profile.username);
        }
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !username) {
      toast({
        title: "Download unavailable",
        description: "Please wait while we prepare your certificate.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await exportCardAsImage(cardRef.current, username);
      toast({
        title: "Certificate downloaded",
        description: "Your voice certification has been saved as an image.",
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Download failed",
        description: "Could not download the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!username) {
      toast({
        title: "Share unavailable",
        description: "Please wait while we prepare your sharing link.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/v/${username}/voice-credential`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Verified Voice Credential',
          text: 'Check out my blockchain-verified voice identity on Seeksy!',
          url: shareUrl,
        });
        
        toast({
          title: "Shared successfully",
          description: "Your voice credential has been shared.",
        });
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied to clipboard",
          description: "Share your voice credential link with anyone.",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Copy failed",
          description: "Could not copy link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Your Voice Is Now Verified</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                You've created a permanent, blockchain-protected voice identity. This credential helps prove authenticity, prevents impersonation, and enables future voice-tracking features.
              </p>
            </div>
          </div>

          {/* Voice Credential Card */}
          <Card 
            ref={cardRef}
            className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-8 mb-12"
          >
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
                <p className="text-xs text-muted-foreground mb-1">Blockchain Network</p>
                <p className="font-semibold text-sm">{blockchain}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Issued On</p>
                <p className="font-semibold text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <Button
              size="lg"
              onClick={() => navigate("/voice-credentials")}
              className="h-auto py-6"
            >
              <Shield className="mr-2 h-5 w-5" />
              View My Voice Credential
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleDownload}
              className="h-auto py-6"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Certificate
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleShare}
              className="h-auto py-6"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share My Certification
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
