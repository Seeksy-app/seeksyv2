import { Button } from "@/components/ui/button";
import { Calendar, Upload, Mic, MonitorPlay, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMemo } from "react";

// Map action to required modules
const ACTION_MODULE_MAP: Record<string, string[]> = {
  meeting: ["meetings"],
  upload: ["media-library", "studio", "media"],
  episode: ["podcasts", "podcast-hosting"],
  studio: ["studio", "podcasts"],
  spark: [], // Always available
};

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  route: string;
}

const ALL_ACTIONS: QuickAction[] = [
  { 
    id: "meeting", 
    label: "Create Meeting", 
    icon: Calendar, 
    color: "text-[hsl(217,90%,50%)]", 
    bgColor: "bg-[hsl(217,90%,95%)]", 
    route: "/meetings/create" 
  },
  { 
    id: "upload", 
    label: "Upload → AI Edit", 
    icon: Upload, 
    color: "text-[hsl(142,70%,40%)]", 
    bgColor: "bg-[hsl(142,70%,95%)]", 
    route: "/media/library" 
  },
  { 
    id: "episode", 
    label: "Create Episode", 
    icon: Mic, 
    color: "text-[hsl(330,70%,50%)]", 
    bgColor: "bg-[hsl(330,80%,95%)]", 
    route: "/podcasts" 
  },
  { 
    id: "studio", 
    label: "Launch Studio", 
    icon: MonitorPlay, 
    color: "text-[hsl(270,70%,50%)]", 
    bgColor: "bg-[hsl(270,80%,95%)]", 
    route: "/studio" 
  },
  { 
    id: "spark", 
    label: "Ask Spark", 
    icon: Sparkles, 
    color: "text-[hsl(45,90%,45%)]", 
    bgColor: "bg-[hsl(45,90%,95%)]", 
    route: "" // Opens Spark panel
  },
];

export const QuickActionsRow = () => {
  const navigate = useNavigate();
  const { currentWorkspace, workspaceModules } = useWorkspace();

  // Get active module IDs from workspace
  const activeModuleIds = useMemo(() => {
    const moduleIds = new Set<string>();
    workspaceModules.forEach(wm => moduleIds.add(wm.module_id.toLowerCase()));
    currentWorkspace?.modules?.forEach(m => moduleIds.add(m.toLowerCase()));
    return moduleIds;
  }, [workspaceModules, currentWorkspace]);

  // Check if an action should be visible based on active modules
  const isActionVisible = (actionId: string): boolean => {
    const requiredModules = ACTION_MODULE_MAP[actionId] || [];
    if (requiredModules.length === 0) return true;
    return requiredModules.some(modId => 
      activeModuleIds.has(modId) || 
      Array.from(activeModuleIds).some(activeId => 
        activeId.includes(modId) || modId.includes(activeId)
      )
    );
  };

  const visibleActions = ALL_ACTIONS.filter(action => isActionVisible(action.id));

  const handleAction = (action: QuickAction) => {
    if (action.id === "spark") {
      // Dispatch custom event to open Spark panel
      window.dispatchEvent(new CustomEvent("open-spark-panel"));
    } else {
      navigate(action.route);
    }
  };

  if (visibleActions.length === 0) return null;

  return (
    <div className="w-full mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            onClick={() => handleAction(action)}
            className="flex items-center gap-2 px-4 py-2 h-auto"
          >
            <div className={`p-1.5 rounded-full ${action.bgColor}`}>
              <action.icon className={`h-4 w-4 ${action.color}`} />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};