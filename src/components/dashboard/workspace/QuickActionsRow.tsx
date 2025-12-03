import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Upload, 
  Mic, 
  Video, 
  Sparkles,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

const quickActions = [
  { 
    id: "meeting", 
    label: "Create Meeting", 
    icon: Calendar, 
    path: "/meetings/new",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "upload", 
    label: "Upload → AI Edit", 
    icon: Upload, 
    path: "/media/library",
    color: "from-purple-500 to-pink-500"
  },
  { 
    id: "podcast", 
    label: "Create Episode", 
    icon: Mic, 
    path: "/podcasts/create",
    color: "from-amber-500 to-orange-500"
  },
  { 
    id: "studio", 
    label: "Launch Studio", 
    icon: Video, 
    path: "/studio",
    color: "from-emerald-500 to-teal-500"
  },
  { 
    id: "spark", 
    label: "Ask Spark", 
    icon: Sparkles, 
    path: "#spark",
    color: "from-violet-500 to-purple-500"
  },
];

export function QuickActionsRow() {
  const navigate = useNavigate();

  const handleAction = (action: typeof quickActions[0]) => {
    if (action.id === "spark") {
      // Open Spark AI assistant
      document.dispatchEvent(new CustomEvent("open-spark-assistant"));
    } else {
      navigate(action.path);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(action)}
              className="group relative overflow-hidden border-border/50 hover:border-border bg-card/50 hover:bg-card transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <action.icon className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
