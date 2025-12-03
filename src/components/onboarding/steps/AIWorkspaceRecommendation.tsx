import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles, Video, Scissors, Mic, Rss, Calendar,
  Users, MessageSquare, DollarSign, BarChart3, Link2,
  Trophy, Ticket, Shield, Info
} from "lucide-react";
import { PersonaType } from "@/config/personaConfig";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  recommended?: boolean;
}

const ALL_MODULES: Module[] = [
  { id: "media-studio", name: "Media AI Studio", description: "Record & edit video with AI", icon: Video, gradient: "from-blue-500 to-cyan-500" },
  { id: "ai-clips", name: "AI Clips Generator", description: "Auto-generate viral clips", icon: Scissors, gradient: "from-purple-500 to-pink-500" },
  { id: "podcast-hosting", name: "Podcast Hosting & RSS", description: "Distribute your podcast everywhere", icon: Rss, gradient: "from-amber-500 to-orange-500" },
  { id: "my-page", name: "My Page (Link-in-bio)", description: "Turn your links into revenue", icon: Link2, gradient: "from-violet-500 to-purple-500" },
  { id: "meetings", name: "Meetings & Scheduling", description: "Book calls & appointments", icon: Calendar, gradient: "from-emerald-500 to-teal-500" },
  { id: "events", name: "Events & Ticketing", description: "Sell tickets to your events", icon: Ticket, gradient: "from-rose-500 to-pink-500" },
  { id: "crm", name: "CRM Lite", description: "Manage contacts & sponsors", icon: Users, gradient: "from-sky-500 to-blue-500" },
  { id: "communications", name: "Email & SMS", description: "Reach your audience directly", icon: MessageSquare, gradient: "from-indigo-500 to-violet-500" },
  { id: "monetization", name: "Monetization Hub", description: "Track revenue & deals", icon: DollarSign, gradient: "from-amber-500 to-yellow-500" },
  { id: "analytics", name: "Analytics Dashboard", description: "Track your growth metrics", icon: BarChart3, gradient: "from-green-500 to-emerald-500" },
  { id: "awards", name: "Awards & Competitions", description: "Run contests & voting", icon: Trophy, gradient: "from-orange-500 to-red-500" },
  { id: "identity", name: "Identity Verification", description: "Voice & face protection", icon: Shield, gradient: "from-slate-500 to-gray-600" },
];

// Map persona labels for display
const PERSONA_LABELS: Record<string, string> = {
  podcaster: "Podcaster",
  influencer: "Content Creator",
  speaker: "Speaker",
  eventHost: "Event Host",
  entrepreneur: "Entrepreneur",
  brand: "Brand",
  agency: "Agency",
};

// Map goals to readable labels
const GOAL_LABELS: Record<string, string> = {
  "grow-audience": "Grow my audience",
  "create-content": "Create better content",
  "monetize": "Monetize my work",
  "book-meetings": "Book meetings & calls",
  "host-events": "Host events",
  "manage-contacts": "Manage contacts & CRM",
};

// Map platforms to readable labels
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  spotify: "Spotify / Apple Podcasts",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  website: "My own website",
};

// Generate "why recommended" explanation based on context
function getRecommendationReason(
  moduleId: string,
  persona: PersonaType | null,
  goals: string[],
  platforms: string[]
): string | null {
  // Check persona-based recommendations first
  const personaReasons: Record<string, string[]> = {
    podcaster: ["media-studio", "podcast-hosting", "ai-clips", "analytics"],
    influencer: ["my-page", "ai-clips", "analytics", "monetization"],
    speaker: ["events", "meetings", "my-page", "crm"],
    eventHost: ["events", "meetings", "my-page", "crm"],
    entrepreneur: ["crm", "communications", "meetings", "analytics"],
    brand: ["crm", "communications", "meetings", "analytics"],
    agency: ["crm", "analytics", "communications", "monetization"],
  };

  if (persona && personaReasons[persona]?.includes(moduleId)) {
    return `Recommended because you chose ${PERSONA_LABELS[persona] || persona} as your focus.`;
  }

  // Check goal-based recommendations
  const goalModules: Record<string, string[]> = {
    "grow-audience": ["my-page", "analytics"],
    "create-content": ["media-studio", "ai-clips"],
    "monetize": ["monetization", "identity"],
    "book-meetings": ["meetings", "crm"],
    "host-events": ["events"],
    "manage-contacts": ["crm", "communications"],
  };

  for (const goal of goals) {
    if (goalModules[goal]?.includes(moduleId)) {
      return `Recommended because you want to "${GOAL_LABELS[goal] || goal}".`;
    }
  }

  // Check platform-based recommendations
  if ((platforms.includes("spotify") || platforms.includes("youtube")) && moduleId === "podcast-hosting") {
    return `Recommended because you publish to ${platforms.includes("spotify") ? "Spotify" : "YouTube"}.`;
  }
  if ((platforms.includes("tiktok") || platforms.includes("instagram")) && moduleId === "ai-clips") {
    const platformNames = [];
    if (platforms.includes("tiktok")) platformNames.push("TikTok");
    if (platforms.includes("instagram")) platformNames.push("Instagram");
    return `Recommended because you publish to ${platformNames.join(" & ")}.`;
  }

  return null;
}

// Map persona + goals to recommended modules
function getRecommendedModules(
  persona: PersonaType | null,
  goals: string[],
  platforms: string[]
): string[] {
  const recommended = new Set<string>();
  
  // Base recommendations by persona
  switch (persona) {
    case "podcaster":
      recommended.add("media-studio");
      recommended.add("podcast-hosting");
      recommended.add("ai-clips");
      recommended.add("analytics");
      break;
    case "influencer":
      recommended.add("my-page");
      recommended.add("ai-clips");
      recommended.add("analytics");
      recommended.add("monetization");
      break;
    case "speaker":
    case "eventHost":
      recommended.add("events");
      recommended.add("meetings");
      recommended.add("my-page");
      recommended.add("crm");
      break;
    case "entrepreneur":
    case "brand":
      recommended.add("crm");
      recommended.add("communications");
      recommended.add("meetings");
      recommended.add("analytics");
      break;
    case "agency":
      recommended.add("crm");
      recommended.add("analytics");
      recommended.add("communications");
      recommended.add("monetization");
      break;
    default:
      recommended.add("media-studio");
      recommended.add("my-page");
      recommended.add("analytics");
  }
  
  // Add based on goals
  if (goals.includes("grow-audience")) {
    recommended.add("my-page");
    recommended.add("analytics");
  }
  if (goals.includes("create-content")) {
    recommended.add("media-studio");
    recommended.add("ai-clips");
  }
  if (goals.includes("monetize")) {
    recommended.add("monetization");
    recommended.add("identity");
  }
  if (goals.includes("book-meetings")) {
    recommended.add("meetings");
    recommended.add("crm");
  }
  if (goals.includes("host-events")) {
    recommended.add("events");
  }
  if (goals.includes("manage-contacts")) {
    recommended.add("crm");
    recommended.add("communications");
  }
  
  // Add based on platforms
  if (platforms.includes("spotify") || platforms.includes("youtube")) {
    recommended.add("podcast-hosting");
  }
  if (platforms.includes("tiktok") || platforms.includes("instagram")) {
    recommended.add("ai-clips");
  }
  
  return Array.from(recommended);
}

interface AIWorkspaceRecommendationProps {
  persona: PersonaType | null;
  goals: string[];
  tools: string[];
  platforms: string[];
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
}

export function AIWorkspaceRecommendation({
  persona,
  goals,
  tools,
  platforms,
  selectedModules,
  onModulesChange,
}: AIWorkspaceRecommendationProps) {
  const recommendedIds = getRecommendedModules(persona, goals, platforms);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Initialize with recommendations if nothing selected yet
  useEffect(() => {
    if (selectedModules.length === 0) {
      onModulesChange(recommendedIds);
    }
    // Stop AI animation after 3 seconds
    const timer = setTimeout(() => setHasAnimated(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      onModulesChange(selectedModules.filter(m => m !== id));
    } else {
      onModulesChange([...selectedModules, id]);
    }
  };

  const acceptRecommendation = () => {
    onModulesChange(recommendedIds);
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Gradient header */}
        <div className="relative text-center mb-8">
          <div className="absolute inset-0 -mx-8 -mt-8 h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-t-3xl" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-5"
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Seeksy AI Built Your Workspace</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              We analyzed your goals, persona, and platforms to build a personalized Seeksy workspace. 
              You can turn modules on or off — recommendations update automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Summary of choices */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-foreground">Your Selections</h3>
              <div className="space-y-5">
                {persona && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Focus</p>
                    <Badge variant="secondary" className="capitalize text-sm px-3 py-1">{PERSONA_LABELS[persona] || persona}</Badge>
                  </div>
                )}
                {goals.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {goals.map(g => (
                        <Badge key={g} variant="outline" className="text-sm px-3 py-1 rounded-full">
                          {GOAL_LABELS[g] || g.replace(/-/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {platforms.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map(p => (
                        <Badge key={p} variant="outline" className="text-sm px-3 py-1 rounded-full">{PLATFORM_LABELS[p] || p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Module toggles */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Recommended Modules</h3>
              <Button variant="ghost" size="sm" onClick={acceptRecommendation} className="text-primary hover:text-primary">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Reset to AI picks
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[450px] overflow-y-auto pr-1">
              {ALL_MODULES.map((module, index) => {
                const isSelected = selectedModules.includes(module.id);
                const isRecommended = recommendedIds.includes(module.id);
                const reason = isRecommended ? getRecommendationReason(module.id, persona, goals, platforms) : null;
                const Icon = module.icon;
                
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer relative min-h-[80px]",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-border hover:bg-muted/30",
                        // Subtle AI glow animation for recommended modules
                        isRecommended && !hasAnimated && "animate-pulse"
                      )}
                      onClick={() => toggleModule(module.id)}
                      style={isRecommended && !hasAnimated ? {
                        boxShadow: "0 0 16px 3px hsl(var(--primary) / 0.15)"
                      } : undefined}
                    >
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br text-white shrink-0 shadow-md",
                        module.gradient
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{module.name}</p>
                          {isRecommended && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 rounded-full",
                                  !hasAnimated && "animate-pulse"
                                )}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                              {reason && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Info className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                      </div>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleModule(module.id)}
                        className="shrink-0"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center pt-6">
          <p className="text-base text-muted-foreground font-medium">
            {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
