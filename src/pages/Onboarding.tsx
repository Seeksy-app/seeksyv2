import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Calendar, TrendingUp, Megaphone, Users, Building2, Sparkles, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const userTypes = [
  {
    id: "creator",
    title: "Creator / Podcaster",
    description: "Create and share audio/video content",
    icon: Mic,
    color: "from-purple-500 to-pink-500",
    integrations: ["my-page", "spotify", "youtube", "meta", "cloudflare-stream"],
    features: ["Podcasting tools", "AI editing", "Social media sync", "My Page profile"],
  },
  {
    id: "business",
    title: "Business / CFO",
    description: "Financial modeling and analytics",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    integrations: [],
    features: ["Pro forma tools", "Revenue forecasting", "Financial dashboards", "Team management"],
  },
  {
    id: "event-planner",
    title: "Event Planner",
    description: "Organize meetings and events",
    icon: Calendar,
    color: "from-green-500 to-emerald-500",
    integrations: ["google-calendar", "microsoft-teams", "zoom"],
    features: ["Event management", "Booking system", "Calendar sync", "Registration tools"],
  },
  {
    id: "advertiser",
    title: "Advertiser / Agency",
    description: "Run campaigns and reach audiences",
    icon: Megaphone,
    color: "from-orange-500 to-red-500",
    integrations: ["stripe"],
    features: ["Campaign management", "Ad library", "Analytics dashboard", "Budget tracking"],
  },
  {
    id: "political",
    title: "Political Campaign",
    description: "Engage constituents and voters",
    icon: Users,
    color: "from-indigo-500 to-purple-500",
    integrations: ["my-page", "meta", "livestream"],
    features: ["Livestream events", "Constituent tools", "Campaign page", "Event hosting"],
  },
  {
    id: "industry-creator",
    title: "Conference / Industry Creator",
    description: "Share expertise and content",
    icon: Building2,
    color: "from-teal-500 to-blue-500",
    integrations: ["my-page", "linkedin", "youtube"],
    features: ["Professional content", "Industry page", "Speaking tools", "Event integration"],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  const selectedUserType = userTypes.find(t => t.id === selectedType);

  const handleComplete = async () => {
    if (!selectedType) return;

    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For now, just navigate - we'll add proper storage later via migration
      // The user type preference can be inferred from their usage patterns
      
      toast.success("Welcome to Seeksy! 🎉");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding");
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 mb-4"
              >
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Welcome to Seeksy!</h1>
              </motion.div>
              <p className="text-lg text-muted-foreground">
                Let's personalize your experience. What best describes you?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {userTypes.map((type, index) => {
                const IconComponent = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        isSelected ? "ring-2 ring-primary shadow-lg" : ""
                      }`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-lg bg-gradient-to-br ${type.color}`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                            >
                              <Check className="h-5 w-5 text-primary" />
                            </motion.div>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-3">{type.title}</CardTitle>
                        <CardDescription className="text-sm">{type.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                size="lg"
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {selectedUserType && (
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${selectedUserType.color}`}>
                      <selectedUserType.icon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl">Perfect! Here's what we recommend</CardTitle>
                    <CardDescription>
                      Based on your selection: <strong>{selectedUserType?.title}</strong>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features Section */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Your Features
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUserType?.features.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommended Integrations */}
                {selectedUserType?.integrations && selectedUserType.integrations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recommended Integrations</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      We'll help you set these up later in your Integrations page
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUserType.integrations.map((integration, index) => (
                        <motion.div
                          key={integration}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <Badge variant="secondary" className="capitalize">
                            {integration.replace(/-/g, " ")}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {completing ? (
                      "Setting up..."
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
