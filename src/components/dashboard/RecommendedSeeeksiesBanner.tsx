import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface RecommendedModule {
  id: string;
  name: string;
  description: string;
}

const RECOMMENDED_MODULES: RecommendedModule[] = [
  { id: "podcasts", name: "Podcasting", description: "Host and distribute your podcast" },
  { id: "meetings", name: "Meetings", description: "Schedule and manage appointments" },
  { id: "events", name: "Events", description: "Create and sell event tickets" },
  { id: "identity-verification", name: "Identity Verification", description: "Verify your face and voice" },
  { id: "social-analytics", name: "Social Analytics", description: "Track your social media growth" },
  { id: "email", name: "Email Suite", description: "Manage your email communications" },
];

export const RecommendedSeeksiesBanner = () => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("recommended-seeksies-dismissed") === "true";
  });
  const { currentWorkspace, workspaceModules } = useWorkspace();

  // Get active module IDs from workspace
  const activeModuleIds = useMemo(() => {
    const moduleIds = new Set<string>();
    workspaceModules.forEach(wm => moduleIds.add(wm.module_id.toLowerCase()));
    currentWorkspace?.modules?.forEach(m => moduleIds.add(m.toLowerCase()));
    return moduleIds;
  }, [workspaceModules, currentWorkspace]);

  // Find modules that are NOT activated
  const recommendedModules = useMemo(() => {
    return RECOMMENDED_MODULES.filter(mod => {
      return !activeModuleIds.has(mod.id) && 
        !Array.from(activeModuleIds).some(activeId => 
          activeId.includes(mod.id) || mod.id.includes(activeId)
        );
    }).slice(0, 3); // Show max 3 recommendations
  }, [activeModuleIds]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("recommended-seeksies-dismissed", "true");
  };

  // Don't show if dismissed or no recommendations
  if (isDismissed || recommendedModules.length === 0) return null;

  return (
    <div className="w-full mb-6 relative">
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Recommended Seeksies</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add these modules to unlock more features for your workspace
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendedModules.map((mod) => (
                  <Button
                    key={mod.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-background/80"
                    onClick={() => navigate("/apps-and-tools")}
                  >
                    {mod.name}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};