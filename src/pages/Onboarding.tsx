import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PERSONA_OPTIONS, PersonaType, getPersonaConfig } from "@/config/personaConfig";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Trophy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 4; // Welcome + Persona Selection + Recommendations + Confirmation

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;
  const personaConfig = selectedPersona ? getPersonaConfig(selectedPersona) : null;

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!selectedPersona;
      case 3: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleComplete = async () => {
    if (!selectedPersona) return;
    
    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const config = getPersonaConfig(selectedPersona);

      // Save to user_preferences
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: selectedPersona,
        my_page_enabled: true,
        pinned_modules: config.defaultWidgets,
      }, { onConflict: "user_id" });

      // Update profile with onboarding data
      await supabase.from("profiles").update({
        onboarding_completed: true,
        onboarding_data: {
          personaType: selectedPersona,
          completedAt: new Date().toISOString(),
          checklistStatus: {},
        }
      }).eq("id", user.id);

      localStorage.setItem("show_welcome_spin", "true");
      toast.success("Your workspace is ready!");

      // Route to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
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

  const renderPersonaSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">What brings you to Seeksy?</h2>
        <p className="text-muted-foreground">Select your primary focus — you can always change this later.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PERSONA_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedPersona === option.id;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <button
                type="button"
                onClick={() => setSelectedPersona(option.id as PersonaType)}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                  "hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/30"
                )}
              >
                {/* Selected checkmark badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-primary shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </motion.div>
                )}
                
                <div className="flex flex-col items-start gap-3">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br text-white shadow-md",
                    option.gradient
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{option.label}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{option.description}</p>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderRecommendations = () => {
    if (!personaConfig) return null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br text-white mb-4",
              personaConfig.gradient
            )}
          >
            <personaConfig.icon className="h-8 w-8" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Your {personaConfig.label} Setup</h2>
          <p className="text-muted-foreground">Here's what we'll set up for you</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Dashboard Widgets</p>
            <div className="flex flex-wrap gap-2">
              {personaConfig.defaultWidgets.slice(0, 5).map((widgetId) => (
                <Badge key={widgetId} variant="secondary" className="capitalize">
                  {widgetId.replace(/-/g, " ")}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Quick Navigation</p>
            <div className="grid grid-cols-2 gap-2">
              {personaConfig.navHighlights.slice(0, 4).map((nav, i) => {
                const NavIcon = nav.icon;
                return (
                  <motion.div
                    key={nav.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <NavIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{nav.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Setup Checklist</p>
            <div className="space-y-2">
              {personaConfig.checklist.slice(0, 3).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className="p-1 rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </motion.div>
              ))}
              {personaConfig.checklist.length > 3 && (
                <p className="text-xs text-muted-foreground pl-8">
                  +{personaConfig.checklist.length - 3} more tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    if (!personaConfig) return null;

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
          <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
          <p className="text-muted-foreground">
            Your {personaConfig.label} workspace is ready to go.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                You can customize your dashboard anytime by clicking the "Customize" button.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcomeScreen();
      case 2:
        return renderPersonaSelection();
      case 3:
        return renderRecommendations();
      case 4:
        return renderConfirmation();
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
        {/* Progress indicator with step label */}
        {step > 1 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-primary font-medium">
                {step === 2 ? "Select your focus" : step === 3 ? "Review setup" : "Get started"}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Card className="border-border/50 shadow-xl">
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

            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div>
                {step > 1 && step < TOTAL_STEPS ? (
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : step === 1 ? (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip for now
                  </Button>
                ) : null}
              </div>

              <div>
                {step === 1 ? (
                  <Button onClick={handleNext} size="lg">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : step < TOTAL_STEPS ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
                    size="lg"
                    className="gap-2"
                  >
                    {completing ? (
                      "Activating..."
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Go to Dashboard
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
