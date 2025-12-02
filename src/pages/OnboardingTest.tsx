// Onboarding Test Mode - Internal Testing Route
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { DashboardPreview } from "@/components/onboarding/DashboardPreview";
import { 
  ONBOARDING_QUESTIONS, 
  OnboardingAnswers,
  creatorTypeOptions,
  primaryGoalOptions,
  toolsOptions,
  experienceLevelOptions,
  monetizationStatusOptions
} from "@/config/onboardingQuestions";
import { generateRecommendations, getDashboardPreview, RecommendedModuleBundle } from "@/lib/onboardingRecommendations";
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, Trophy, 
  RefreshCw, FlaskConical, Eye, Settings, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_STEPS = 7; // Welcome + 5 questions + Recommendations + Preview

export default function OnboardingTest() {
  const [step, setStep] = useState(1);
  const [testMode] = useState(true); // Always true for this route
  
  // Form state
  const [creatorType, setCreatorType] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [tools, setTools] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");
  const [monetization, setMonetization] = useState<string>("");
  
  // Generated data
  const [recommendations, setRecommendations] = useState<RecommendedModuleBundle | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Welcome
      case 2: return !!creatorType;
      case 3: return !!primaryGoal;
      case 4: return tools.length > 0;
      case 5: return !!experience;
      case 6: return !!monetization;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 6) {
      // Generate recommendations
      const answers: OnboardingAnswers = {
        creatorType,
        primaryGoal,
        tools,
        experience,
        monetization,
      };
      const recs = generateRecommendations(answers);
      setRecommendations(recs);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleRestart = () => {
    setStep(1);
    setCreatorType("");
    setPrimaryGoal("");
    setTools([]);
    setExperience("");
    setMonetization("");
    setRecommendations(null);
  };

  const renderWelcomeScreen = () => (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold mb-3"
      >
        Welcome to Seeksy!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-lg"
      >
        Let's personalize your workspace.
      </motion.p>
    </div>
  );

  const renderRecommendations = () => {
    if (!recommendations) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <Trophy className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Your Recommended Setup</h2>
          <p className="text-muted-foreground text-sm">{recommendations.summary}</p>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {recommendations.modules.map((module, i) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{module.name}</p>
                <p className="text-xs text-muted-foreground">{module.description}</p>
              </div>
              <Badge 
                className={`text-xs ${
                  module.priority === "core" 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : module.priority === "recommended"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {module.priority}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboardPreview = () => {
    if (!recommendations) return null;
    const previewConfig = getDashboardPreview(recommendations.dashboardType);
    
    return (
      <DashboardPreview 
        config={previewConfig} 
        activatedModules={recommendations.modules.map(m => m.id)} 
      />
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcomeScreen();
      case 2:
        return (
          <OnboardingQuestion
            question="What type of creator are you?"
            description="This helps us customize your experience"
            options={creatorTypeOptions}
            selected={creatorType}
            onChange={(v) => setCreatorType(v as string)}
            columns={1}
          />
        );
      case 3:
        return (
          <OnboardingQuestion
            question="What do you want to do first?"
            description="Choose your top priority"
            options={primaryGoalOptions}
            selected={primaryGoal}
            onChange={(v) => setPrimaryGoal(v as string)}
            columns={1}
          />
        );
      case 4:
        return (
          <OnboardingQuestion
            question="What tools are you interested in using?"
            description="Select all that apply"
            options={toolsOptions}
            selected={tools}
            onChange={(v) => setTools(v as string[])}
            multiSelect
            columns={2}
          />
        );
      case 5:
        return (
          <OnboardingQuestion
            question="What is your experience level?"
            options={experienceLevelOptions}
            selected={experience}
            onChange={(v) => setExperience(v as string)}
            columns={1}
          />
        );
      case 6:
        return (
          <OnboardingQuestion
            question="Are you monetizing today?"
            options={monetizationStatusOptions}
            selected={monetization}
            onChange={(v) => setMonetization(v as string)}
            columns={1}
          />
        );
      case 7:
        return renderRecommendations();
      case 8:
        return renderDashboardPreview();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Test Mode Banner */}
        {testMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
          >
            <FlaskConical className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-600 text-sm">Test Mode – No data saved</p>
              <p className="text-xs text-amber-600/70">Simulate any onboarding path without creating accounts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1 text-amber-600">
              <RefreshCw className="h-3 w-3" />
              Reset
            </Button>
          </motion.div>
        )}

        {/* Progress Bar */}
        {step > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step - 1} of {TOTAL_STEPS - 1}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Main Card */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div>
                {step > 1 && (
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {step === 1 ? (
                  <Button onClick={handleNext} size="lg">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : step < 7 ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : step === 7 ? (
                  <Button onClick={() => setStep(8)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview Dashboard
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRestart} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Restart Onboarding
                    </Button>
                    <Button className="gap-2" disabled>
                      <Sparkles className="h-4 w-4" />
                      Create My Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Info Panel */}
        {testMode && step > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50"
          >
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Current Selections
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Type:</span> {creatorType || "—"}</div>
              <div><span className="text-muted-foreground">Goal:</span> {primaryGoal || "—"}</div>
              <div><span className="text-muted-foreground">Tools:</span> {tools.length > 0 ? tools.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Level:</span> {experience || "—"}</div>
              <div><span className="text-muted-foreground">Monetizing:</span> {monetization || "—"}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
