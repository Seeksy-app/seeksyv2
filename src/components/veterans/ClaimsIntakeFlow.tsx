import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Eye } from "lucide-react";

interface IntakeData {
  status: string;
  branch: string;
  goal: string;
}

interface ClaimsIntakeFlowProps {
  onComplete: (data: IntakeData) => void;
  onShowSample?: () => void;
}

const STATUS_OPTIONS = [
  { value: "veteran", label: "Veteran" },
  { value: "active_duty", label: "Active Duty (Pre-Separation)" },
  { value: "guard_reserve", label: "National Guard / Reserve" },
  { value: "spouse", label: "Military Spouse" },
  { value: "dependent", label: "Dependent / Caregiver" },
];

const BRANCH_OPTIONS = [
  { value: "army", label: "Army" },
  { value: "marine_corps", label: "Marine Corps" },
  { value: "navy", label: "Navy" },
  { value: "air_force", label: "Air Force" },
  { value: "space_force", label: "Space Force" },
  { value: "coast_guard", label: "Coast Guard" },
];

const GOAL_OPTIONS = [
  { value: "intent_to_file", label: "File an Intent to File" },
  { value: "first_claim", label: "File my first VA claim" },
  { value: "increase", label: "File for an increase" },
  { value: "secondary", label: "File for a secondary condition" },
  { value: "appeal", label: "Appeal a decision" },
  { value: "unsure", label: "I'm not sure — I need help" },
];

export function ClaimsIntakeFlow({ onComplete, onShowSample }: ClaimsIntakeFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeData>({
    status: "",
    branch: "",
    goal: "",
  });

  const handleStatusSelect = (status: string) => {
    setData(prev => ({ ...prev, status }));
    setStep(2);
  };

  const handleBranchSelect = (branch: string) => {
    setData(prev => ({ ...prev, branch }));
    setStep(3);
  };

  const handleGoalSelect = (goal: string) => {
    const finalData = { ...data, goal };
    setData(finalData);
    onComplete(finalData);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step > s 
                ? "bg-green-500 text-white" 
                : step === s 
                  ? "bg-orange-500 text-white" 
                  : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 mx-1 rounded ${step > s ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === 1 && "Before we get started, which best describes you?"}
            {step === 2 && "What branch did you serve in?"}
            {step === 3 && "What are you looking to do today?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {step === 1 && STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.status === option.value ? "default" : "outline"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleStatusSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
            
            {step === 2 && BRANCH_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.branch === option.value ? "default" : "outline"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleBranchSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
            
            {step === 3 && GOAL_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={data.goal === option.value ? "default" : "outline"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => handleGoalSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* View Sample Button */}
          {onShowSample && (
            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={onShowSample}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Sample Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
