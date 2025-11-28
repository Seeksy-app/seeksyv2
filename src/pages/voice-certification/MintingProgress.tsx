import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check, Loader2, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

interface MintingStep {
  label: string;
  status: "pending" | "active" | "complete";
  progress: number;
}

const MintingProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [steps, setSteps] = useState<MintingStep[]>([
    { label: "Preparing", status: "active", progress: 0 },
    { label: "Signing", status: "pending", progress: 0 },
    { label: "Minting", status: "pending", progress: 0 },
    { label: "Finalizing", status: "pending", progress: 0 },
  ]);

  useEffect(() => {
    // Simulate minting process
    const stepDuration = 2000; // 2 seconds per step
    let currentStep = 0;

    const timer = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        
        if (currentStep < newSteps.length) {
          // Complete current step
          if (newSteps[currentStep].progress < 100) {
            newSteps[currentStep].progress += 10;
          } else {
            newSteps[currentStep].status = "complete";
            currentStep++;
            
            // Activate next step
            if (currentStep < newSteps.length) {
              newSteps[currentStep].status = "active";
            }
          }
        }

        return newSteps;
      });

      // Navigate to success screen when all steps complete
      if (currentStep >= 4) {
        clearInterval(timer);
        setTimeout(() => {
          navigate("/voice-certification/success", {
            state: {
              ...location.state,
              tokenId: "34523001",
              blockchain: "Polygon"
            }
          });
        }, 500);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [navigate, location.state]);

  const overallProgress = (steps.filter(s => s.status === "complete").length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={6} 
          totalSteps={7} 
          stepLabel="Minting in Progress"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold">Minting Your Voice Credential</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Creating your blockchain-verified voice NFT on Polygon network...
            </p>
          </div>

          <Progress value={overallProgress} className="w-full h-3 mb-8" />

          <div className="space-y-6 max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.label} className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step.status === "complete" 
                      ? "bg-primary text-primary-foreground" 
                      : step.status === "active"
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step.status === "complete" ? (
                      <Check className="h-6 w-6" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <span className="text-lg font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-lg font-semibold ${
                        step.status === "active" ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                      {step.status !== "pending" && (
                        <span className="text-sm text-muted-foreground">{step.progress}%</span>
                      )}
                    </div>
                    {step.status !== "pending" && (
                      <Progress value={step.progress} className="h-2" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-12 mt-12 border-t">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Gasless transaction covered by Seeksy
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MintingProgress;
