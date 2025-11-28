import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Check, Sparkles, Lock } from "lucide-react";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const VoiceCertificationDashboard = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Cryptographic Voice Fingerprint",
      description: "We generate a unique, tamper-proof digital signature of your voice using AI audio embedding."
    },
    {
      icon: Check,
      title: "Trusted Verification",
      description: "Your voice sample is compared to your recorded fingerprint to confirm it's truly you."
    },
    {
      icon: Sparkles,
      title: "Protect Your Voice Everywhere",
      description: "Certification helps protect your identity across podcasts, videos, and AI systems."
    },
    {
      icon: Lock,
      title: "Permanent Voice Credential",
      description: "Receive a verified voice certificate stored on-chain for maximum trust and transparency."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <CertificationStepper 
          currentStep={1} 
          totalSteps={7} 
          stepLabel="Get Started"
        />

        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Voice Certification</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Certify Your Voice Identity
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a blockchain-verified voice credential that proves authenticity, protects your voice from misuse, and unlocks voice ownership across platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="p-6 border-2 hover:border-primary/30 transition-colors">
              <benefit.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/voice-certification/upload")}
            className="text-lg px-12 py-6 h-auto"
          >
            <Shield className="mr-2 h-5 w-5" />
            Start Certification Process
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCertificationDashboard;
