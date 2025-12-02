import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Sparkles, ArrowRight, ArrowLeft, Check, Mic, Building2, Calendar,
  Users, Star, Instagram, Youtube, Music, Facebook, Globe, Rocket,
  Headphones, Video, DollarSign, ShoppingBag, Trophy, Ticket, Eye
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_STEPS = 8; // Welcome + 5 questions + Recommendations + Dashboard Preview

// Step 2: User Type Options (kept for backward compat, use new config)
const userTypeOptions = creatorTypeOptions;

// Step 3: Goals Options
const goalOptions = [
  { id: "social_analytics", label: "Connect social media & analytics", icon: <Instagram className="h-4 w-4" /> },
  { id: "grow_audience", label: "Grow my audience", icon: <Rocket className="h-4 w-4" /> },
  { id: "podcasting", label: "Host podcasts/videos", icon: <Mic className="h-4 w-4" /> },
  { id: "marketing", label: "Manage marketing (email/SMS)", icon: <Sparkles className="h-4 w-4" /> },
  { id: "scheduling", label: "Run events & scheduling", icon: <Calendar className="h-4 w-4" /> },
  { id: "monetization", label: "Monetize my influence", icon: <DollarSign className="h-4 w-4" /> },
];

// Step 4: Platform Options
const platformOptions = [
  { id: "instagram", label: "IG", icon: <Instagram className="h-4 w-4" /> },
  { id: "youtube", label: "YT", icon: <Youtube className="h-4 w-4" /> },
  { id: "tiktok", label: "TikTok", icon: <Video className="h-4 w-4" /> },
  { id: "facebook", label: "FB", icon: <Facebook className="h-4 w-4" /> },
  { id: "spotify_podcast", label: "Spotify", icon: <Music className="h-4 w-4" /> },
  { id: "apple_podcast", label: "Apple Podcasts", icon: <Headphones className="h-4 w-4" /> },
  { id: "website", label: "Website", icon: <Globe className="h-4 w-4" /> },
  { id: "starting_fresh", label: "None yet", icon: <Sparkles className="h-4 w-4" /> },
];

// Step 5: Content Type Options
const contentTypeOptions = [
  { id: "podcasting", label: "Podcast", icon: <Headphones className="h-4 w-4" /> },
  { id: "video", label: "Video", icon: <Video className="h-4 w-4" /> },
  { id: "lifestyle", label: "Creator/Lifestyle", icon: <Star className="h-4 w-4" /> },
  { id: "educational", label: "Education", icon: <Sparkles className="h-4 w-4" /> },
  { id: "brand", label: "Brand/Corporate", icon: <Building2 className="h-4 w-4" /> },
];

// Step 6: Monetization Options
const monetizationOptions = [
  { id: "brand_partnerships", label: "Brand deals", icon: <Star className="h-4 w-4" /> },
  { id: "podcast_sponsorship", label: "Sponsorship (Podcast/Video)", icon: <Mic className="h-4 w-4" /> },
  { id: "digital_products", label: "Digital products", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "ticket_sales", label: "Events/Tickets", icon: <Ticket className="h-4 w-4" /> },
  { id: "not_monetizing", label: "Growing audience only", icon: <Rocket className="h-4 w-4" /> },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  // Form state
  const [userType, setUserType] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [contentType, setContentType] = useState<string>("");
  const [monetization, setMonetization] = useState<string>("");

  // Generated recommendations
  const [recommendations, setRecommendations] = useState<RecommendedModuleBundle | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Welcome screen
      case 2: return !!userType;
      case 3: return goals.length > 0;
      case 4: return platforms.length > 0;
      case 5: return !!contentType;
      case 6: return !!monetization;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 6) {
      // Generate recommendations using new engine
      const answers: OnboardingAnswers = {
        creatorType: userType,
        primaryGoal: goals[0] || "",
        tools: [], // Will be auto-determined
        experience: "intermediate",
        monetization: monetization,
      };
      const recs = generateRecommendations(answers);
      setRecommendations(recs);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const moduleIds = recommendations?.modules.map(m => m.id) || [];

      // Save onboarding data
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: userType,
        my_page_enabled: true,
        pinned_modules: recommendations?.modules.filter(m => m.priority === "core").map(m => m.id) || [],
      }, { onConflict: "user_id" });

      localStorage.setItem("show_welcome_spin", "true");
      localStorage.setItem("activated_modules", JSON.stringify(moduleIds));

      toast.success("Your workspace is ready!");

      // Route based on user type
      const routes: Record<string, string> = {
        creator: "/dashboard",
        influencer: "/dashboard",
        business: "/dashboard",
        entrepreneur: "/dashboard",
        event_host: "/events",
        agency: "/agency",
        podcaster: "/podcasts",
        speaker: "/dashboard",
        brand: "/dashboard",
      };
      navigate(routes[userType] || "/dashboard");
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcomeScreen();
      case 2:
        return (
          <OnboardingQuestion
            question="Which best describes you?"
            options={userTypeOptions}
            selected={userType}
            onChange={(v) => setUserType(v as string)}
            columns={1}
          />
        );
      case 3:
        return (
          <OnboardingQuestion
            question="Choose your goals:"
            description="Select all that apply"
            options={goalOptions}
            selected={goals}
            onChange={(v) => setGoals(v as string[])}
            multiSelect
            columns={1}
          />
        );
      case 4:
        return (
          <OnboardingQuestion
            question="Which platforms do you use?"
            options={platformOptions}
            selected={platforms}
            onChange={(v) => setPlatforms(v as string[])}
            multiSelect
            columns={2}
          />
        );
      case 5:
        return (
          <OnboardingQuestion
            question="Your content is mainly:"
            options={contentTypeOptions}
            selected={contentType}
            onChange={(v) => setContentType(v as string)}
            columns={1}
          />
        );
      case 6:
        return (
          <OnboardingQuestion
            question="How do you want to make money?"
            options={monetizationOptions}
            selected={monetization}
            onChange={(v) => setMonetization(v as string)}
            columns={1}
          />
        );
      case 7:
        return renderStarterStack();
      default:
        return null;
    }
  };

  const renderStarterStack = () => {
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
          <h2 className="text-2xl font-bold mb-2">Your personalized Seeksy setup is ready!</h2>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-3">Recommended Tools:</p>
          <div className="space-y-2">
            {(recommendations?.modules || []).map((module, i) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{module.name}</p>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                {module.priority === "core" && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    Core
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Progress Bar - hide on welcome screen */}
        {step > 1 && (
          <div className="mb-6">
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
                        Activate My Tools
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
