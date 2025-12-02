import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { generateStarterStack, RecommendedModule } from "@/components/onboarding/moduleRegistry";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Mic, Building2, Calendar,
  Users, Star, Instagram, Youtube, Music, Facebook, Globe, Rocket,
  BookOpen, Gamepad2, Heart, Briefcase, Headphones, Video, CalendarDays,
  Building, DollarSign, ShoppingBag, Trophy, UsersRound, Zap
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_STEPS = 6; // 5 questions + 1 results

// Step 1: User Type Options
const userTypeOptions = [
  { id: "creator", label: "Creator", description: "Influencer / Podcaster / Content Creator", icon: <Star className="h-5 w-5" /> },
  { id: "business", label: "Business or Brand", description: "Company or brand presence", icon: <Building2 className="h-5 w-5" /> },
  { id: "event_host", label: "Event Host / Venue", description: "Host events and bookings", icon: <Calendar className="h-5 w-5" /> },
  { id: "agency", label: "Agency / Manager", description: "Manage creators or clients", icon: <Users className="h-5 w-5" /> },
  { id: "podcaster", label: "Podcaster", description: "Focused on podcasting", icon: <Mic className="h-5 w-5" /> },
];

// Step 2: Goals Options
const goalOptions = [
  { id: "social_analytics", label: "Connect & analyze my social media", icon: <Instagram className="h-4 w-4" /> },
  { id: "grow_audience", label: "Grow my audience", icon: <Rocket className="h-4 w-4" /> },
  { id: "scheduling", label: "Schedule meetings & events", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "marketing", label: "Manage email/SMS marketing", icon: <Zap className="h-4 w-4" /> },
  { id: "podcasting", label: "Host/record podcasts or videos", icon: <Mic className="h-4 w-4" /> },
  { id: "public_page", label: "Build a personal/public page", icon: <Globe className="h-4 w-4" /> },
  { id: "monetization", label: "Monetize my influence", icon: <DollarSign className="h-4 w-4" /> },
  { id: "manage_clients", label: "Manage clients or creator teams", icon: <UsersRound className="h-4 w-4" /> },
];

// Step 3: Platform Options
const platformOptions = [
  { id: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
  { id: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
  { id: "tiktok", label: "TikTok", icon: <Video className="h-4 w-4" /> },
  { id: "facebook", label: "Facebook Page", icon: <Facebook className="h-4 w-4" /> },
  { id: "spotify_podcast", label: "Spotify Podcast", icon: <Music className="h-4 w-4" /> },
  { id: "apple_podcast", label: "Apple Podcast", icon: <Headphones className="h-4 w-4" /> },
  { id: "website", label: "Website", icon: <Globe className="h-4 w-4" /> },
  { id: "starting_fresh", label: "I'm starting from scratch", icon: <Sparkles className="h-4 w-4" /> },
];

// Step 4: Content Focus Options
const contentFocusOptions = [
  { id: "educational", label: "Educational", description: "Tutorials, courses, how-tos", icon: <BookOpen className="h-4 w-4" /> },
  { id: "entertainment", label: "Entertainment", description: "Fun, engaging content", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "lifestyle", label: "Lifestyle / Personal", description: "Day-to-day, vlogs", icon: <Heart className="h-4 w-4" /> },
  { id: "business", label: "Business / Professional", description: "B2B, corporate content", icon: <Briefcase className="h-4 w-4" /> },
  { id: "podcasting", label: "Podcasting", description: "Audio-first content", icon: <Headphones className="h-4 w-4" /> },
  { id: "video", label: "Video-first creator", description: "YouTube, streaming", icon: <Video className="h-4 w-4" /> },
  { id: "events", label: "Events / Workshops", description: "Live sessions, webinars", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "brand", label: "Brand or Corporate", description: "Company communications", icon: <Building className="h-4 w-4" /> },
];

// Step 5: Monetization Options
const monetizationOptions = [
  { id: "brand_partnerships", label: "Brand partnerships", description: "Sponsorships and collaborations", icon: <Star className="h-4 w-4" /> },
  { id: "digital_products", label: "Sell digital products", description: "Courses, downloads, merch", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "podcast_sponsorship", label: "Podcast audience & sponsorship", description: "Grow and monetize podcast", icon: <Mic className="h-4 w-4" /> },
  { id: "ticket_sales", label: "Sell tickets/events", description: "Paid events and workshops", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "subscribers", label: "Build subscribers/fans", description: "Memberships, subscriptions", icon: <UsersRound className="h-4 w-4" /> },
  { id: "not_monetizing", label: "Not monetizing yet", description: "Just getting started", icon: <Rocket className="h-4 w-4" /> },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  // Form state
  const [userType, setUserType] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [contentFocus, setContentFocus] = useState<string[]>([]);
  const [monetization, setMonetization] = useState<string>("");

  // Generated recommendations
  const [starterStack, setStarterStack] = useState<RecommendedModule[]>([]);

  const progress = (step / TOTAL_STEPS) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return !!userType;
      case 2: return goals.length > 0;
      case 3: return platforms.length > 0;
      case 4: return contentFocus.length > 0;
      case 5: return !!monetization;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 5) {
      // Generate starter stack
      const stack = generateStarterStack(userType, goals, platforms, contentFocus, monetization);
      setStarterStack(stack);
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

      // Save onboarding data
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        onboarding_completed: true,
        user_type: userType,
        my_page_enabled: true,
        pinned_modules: starterStack.filter(m => m.priority === "core").map(m => m.id),
      }, { onConflict: "user_id" });

      localStorage.setItem("show_welcome_spin", "true");
      localStorage.setItem("activated_modules", JSON.stringify(starterStack.map(m => m.id)));

      toast.success("Your workspace is ready! 🎉");

      // Route based on user type
      const routes: Record<string, string> = {
        creator: "/dashboard",
        business: "/dashboard",
        event_host: "/events",
        agency: "/agency",
        podcaster: "/podcasts",
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingQuestion
            question="What best describes you?"
            description="This helps us personalize your Seeksy experience"
            options={userTypeOptions}
            selected={userType}
            onChange={(v) => setUserType(v as string)}
            columns={2}
          />
        );
      case 2:
        return (
          <OnboardingQuestion
            question="What do you want to do on Seeksy?"
            description="Select everything that applies to you"
            options={goalOptions}
            selected={goals}
            onChange={(v) => setGoals(v as string[])}
            multiSelect
            columns={2}
          />
        );
      case 3:
        return (
          <OnboardingQuestion
            question="Which platforms do you use?"
            description="We'll help you connect and analyze"
            options={platformOptions}
            selected={platforms}
            onChange={(v) => setPlatforms(v as string[])}
            multiSelect
            columns={2}
          />
        );
      case 4:
        return (
          <OnboardingQuestion
            question="What's your content focus?"
            description="Choose 1-2 primary areas"
            options={contentFocusOptions}
            selected={contentFocus}
            onChange={(v) => setContentFocus(v as string[])}
            multiSelect
            columns={2}
          />
        );
      case 5:
        return (
          <OnboardingQuestion
            question="What are your monetization goals?"
            description="We'll recommend the right tools"
            options={monetizationOptions}
            selected={monetization}
            onChange={(v) => setMonetization(v as string)}
            columns={2}
          />
        );
      case 6:
        return renderStarterStack();
      default:
        return null;
    }
  };

  const renderStarterStack = () => {
    const coreModules = starterStack.filter((m) => m.priority === "core");
    const recommendedModules = starterStack.filter((m) => m.priority === "recommended");
    const optionalModules = starterStack.filter((m) => m.priority === "optional");

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <Trophy className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Your Starter Stack is Ready!</h2>
          <p className="text-muted-foreground">
            Based on your answers, we've selected {starterStack.length} modules for you
          </p>
        </div>

        {/* Core Modules */}
        {coreModules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Core
              </Badge>
              <span className="text-sm text-muted-foreground">Essential for your workflow</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {coreModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                >
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Modules */}
        {recommendedModules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                Recommended
              </Badge>
              <span className="text-sm text-muted-foreground">Boost your productivity</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendedModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                >
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Modules */}
        {optionalModules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <span className="text-sm text-muted-foreground">Explore when you're ready</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {optionalModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 mb-2"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary">Seeksy</span>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

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
                {step > 1 ? (
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip for now
                  </Button>
                )}
              </div>

              <div>
                {step < TOTAL_STEPS ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
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
