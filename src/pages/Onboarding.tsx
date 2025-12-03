import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { PERSONA_OPTIONS, PersonaType, getPersonaConfig } from "@/config/personaConfig";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Trophy,
  Mic, Video, Users, Share2, MessageSquare, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AIWorkspaceRecommendation } from "@/components/onboarding/steps/AIWorkspaceRecommendation";
import confetti from "canvas-confetti";

const TOTAL_STEPS = 6; // Welcome + Persona + Questions + AI Recommendation + Preview + Complete

// Questions for Step 3
const GOALS = [
  { id: "grow-audience", label: "Grow my audience", icon: Users },
  { id: "create-content", label: "Create better content", icon: Video },
  { id: "monetize", label: "Monetize my work", icon: BarChart3 },
  { id: "book-meetings", label: "Book meetings & calls", icon: MessageSquare },
  { id: "host-events", label: "Host events", icon: Share2 },
  { id: "manage-contacts", label: "Manage contacts & CRM", icon: Users },
];

const CURRENT_TOOLS = [
  { id: "zoom", label: "Zoom / Google Meet" },
  { id: "calendly", label: "Calendly / Cal.com" },
  { id: "riverside", label: "Riverside / Streamyard" },
  { id: "mailchimp", label: "Mailchimp / ConvertKit" },
  { id: "hubspot", label: "HubSpot / Salesforce" },
  { id: "canva", label: "Canva / CapCut" },
  { id: "none", label: "None / Just starting" },
];

const PUBLISH_PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "spotify", label: "Spotify / Apple Podcasts" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X / Twitter" },
  { id: "website", label: "My own website" },
];

// Storage key for progress persistence
const ONBOARDING_STORAGE_KEY = "seeksy_onboarding_progress";

interface OnboardingProgress {
  step: number;
  selectedPersona: PersonaType | null;
  selectedGoals: string[];
  selectedTools: string[];
  selectedPlatforms: string[];
  selectedModules: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  
  // Load saved progress from localStorage
  const loadSavedProgress = (): OnboardingProgress => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load onboarding progress:", e);
    }
    return {
      step: 1,
      selectedPersona: null,
      selectedGoals: [],
      selectedTools: [],
      selectedPlatforms: [],
      selectedModules: [],
    };
  };

  const savedProgress = loadSavedProgress();
  const [step, setStep] = useState(savedProgress.step);
  const [completing, setCompleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(savedProgress.selectedPersona);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(savedProgress.selectedGoals);
  const [selectedTools, setSelectedTools] = useState<string[]>(savedProgress.selectedTools);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(savedProgress.selectedPlatforms);
  const [selectedModules, setSelectedModules] = useState<string[]>(savedProgress.selectedModules);

  const progress = (step / TOTAL_STEPS) * 100;
  const personaConfig = selectedPersona ? getPersonaConfig(selectedPersona) : null;

  // Save progress whenever state changes
  useEffect(() => {
    const progressData: OnboardingProgress = {
      step,
      selectedPersona,
      selectedGoals,
      selectedTools,
      selectedPlatforms,
      selectedModules,
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progressData));
  }, [step, selectedPersona, selectedGoals, selectedTools, selectedPlatforms, selectedModules]);

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!selectedPersona;
      case 3: return selectedGoals.length > 0;
      case 4: return true; // AI recommendation step
      case 5: return true; // Preview step
      default: return true;
    }
  };

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleTool = (id: string) => {
    setSelectedTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleModulesSelected = (modules: string[]) => {
    setSelectedModules(modules);
    handleNext();
  };

  const handleComplete = async (isRetry = false) => {
    if (!selectedPersona) return;
    
    if (isRetry) {
      setRetrying(true);
    } else {
      setCompleting(true);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const config = getPersonaConfig(selectedPersona);

      // Save to user_preferences
      const { error: prefsError } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: selectedPersona,
        my_page_enabled: true,
        pinned_modules: selectedModules.length > 0 ? selectedModules : config.defaultWidgets,
      }, { onConflict: "user_id" });

      if (prefsError) {
        console.error("Preferences error:", prefsError);
        throw prefsError;
      }

      // Update profile with onboarding data
      const { error: profileError } = await supabase.from("profiles").update({
        onboarding_completed: true,
        onboarding_data: {
          personaType: selectedPersona,
          goals: selectedGoals,
          currentTools: selectedTools,
          publishPlatforms: selectedPlatforms,
          selectedModules: selectedModules,
          completedAt: new Date().toISOString(),
          checklistStatus: {},
        }
      }).eq("id", user.id);

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      // Clear saved progress
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      localStorage.setItem("show_welcome_spin", "true");
      
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success("Your workspace is ready!");

      // Brief delay for celebration, then navigate
      setTimeout(() => {
        navigate("/onboarding/complete");
      }, 1200);
      
    } catch (error) {
      console.error("Error completing onboarding:", error);
      
      if (!isRetry) {
        // First failure - show retry toast
        toast.error("We couldn't finish setting up your workspace. Retrying now...", {
          duration: 3000,
        });
        
        // Auto-retry once
        setTimeout(() => {
          handleComplete(true);
        }, 1500);
      } else {
        // Second failure - show final error
        toast.error("Failed to complete setup. Please try again.", {
          action: {
            label: "Retry",
            onClick: () => handleComplete(false),
          },
        });
      }
    } finally {
      setCompleting(false);
      setRetrying(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
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
        Let's personalize your workspace in just a few steps.
      </motion.p>
    </div>
  );

  const renderPersonaSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">What brings you to Seeksy?</h2>
        <p className="text-muted-foreground">Select your primary focus — you can always change this later.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PERSONA_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedPersona === option.id;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                type="button"
                onClick={() => setSelectedPersona(option.id as PersonaType)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden group h-[130px] flex flex-col items-center justify-center",
                  "hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/30"
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-primary shadow-sm"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </motion.div>
                )}
                
                <div className={cn(
                  "p-2.5 rounded-xl bg-gradient-to-br text-white shadow-md mb-2",
                  option.gradient
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 px-1">{option.description}</p>
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

  // NEW: Questions step (Step 3)
  const renderQuestions = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Help us personalize your experience</h2>
        <p className="text-muted-foreground">Answer a few quick questions so we can tailor Seeksy to your needs.</p>
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">What are you trying to achieve?</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GOALS.map((goal, i) => {
            const Icon = goal.icon;
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{goal.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Current Tools */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">What tools do you use today?</h3>
        <div className="flex flex-wrap gap-2">
          {CURRENT_TOOLS.map((tool) => {
            const isSelected = selectedTools.includes(tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => toggleTool(tool.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10 text-foreground" 
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Publish Platforms */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Where will you publish content?</h3>
        <div className="flex flex-wrap gap-2">
          {PUBLISH_PLATFORMS.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10 text-foreground" 
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

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

  const renderAIRecommendation = () => (
    <AIWorkspaceRecommendation
      persona={selectedPersona}
      goals={selectedGoals}
      tools={selectedTools}
      platforms={selectedPlatforms}
      selectedModules={selectedModules}
      onModulesChange={setSelectedModules}
    />
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcomeScreen();
      case 2:
        return renderPersonaSelection();
      case 3:
        return renderQuestions();
      case 4:
        return renderAIRecommendation();
      case 5:
        return renderRecommendations();
      case 6:
        return renderConfirmation();
      default:
        return null;
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 2: return "Select your focus";
      case 3: return "Tell us more";
      case 4: return "AI Workspace";
      case 5: return "Review setup";
      case 6: return "Get started";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Progress indicator with step label */}
        {step > 1 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-primary font-medium">{getStepLabel()}</span>
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
                    onClick={() => handleComplete()}
                    disabled={completing || retrying}
                    size="lg"
                    className="gap-2"
                  >
                    {completing || retrying ? (
                      retrying ? "Retrying..." : "Activating..."
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
