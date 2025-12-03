import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Upload, 
  Mic, 
  Video, 
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

const quickActions = [
  { 
    id: "meeting", 
    label: "Create Meeting", 
    icon: Calendar, 
    path: "/meetings/new",
    hoverBg: "hover:bg-[hsl(199,90%,97%)]",
    hoverBorder: "hover:border-[hsl(199,80%,80%)]",
    iconBg: "bg-[hsl(199,90%,95%)]",
    iconColor: "text-[hsl(199,80%,45%)]"
  },
  { 
    id: "upload", 
    label: "Upload → AI Edit", 
    icon: Upload, 
    path: "/media/library",
    hoverBg: "hover:bg-[hsl(270,80%,97%)]",
    hoverBorder: "hover:border-[hsl(270,70%,80%)]",
    iconBg: "bg-[hsl(270,80%,95%)]",
    iconColor: "text-[hsl(270,70%,50%)]"
  },
  { 
    id: "podcast", 
    label: "Create Episode", 
    icon: Mic, 
    path: "/podcasts/create",
    hoverBg: "hover:bg-[hsl(25,100%,97%)]",
    hoverBorder: "hover:border-[hsl(25,90%,80%)]",
    iconBg: "bg-[hsl(25,90%,95%)]",
    iconColor: "text-[hsl(25,90%,50%)]"
  },
  { 
    id: "studio", 
    label: "Launch Studio", 
    icon: Video, 
    path: "/studio",
    hoverBg: "hover:bg-[hsl(217,100%,97%)]",
    hoverBorder: "hover:border-[hsl(217,90%,80%)]",
    iconBg: "bg-[hsl(217,90%,95%)]",
    iconColor: "text-[hsl(217,90%,50%)]"
  },
  { 
    id: "spark", 
    label: "Ask Spark", 
    icon: Sparkles, 
    path: "#spark",
    hoverBg: "hover:bg-[hsl(45,100%,97%)]",
    hoverBorder: "hover:border-[hsl(45,90%,70%)]",
    iconBg: "bg-[hsl(45,90%,92%)]",
    iconColor: "text-[hsl(45,90%,40%)]"
  },
];

export function QuickActionsRow() {
  const navigate = useNavigate();

  const handleAction = (action: typeof quickActions[0]) => {
    if (action.id === "spark") {
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
              className={`group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-all shadow-sm hover:shadow-md ${action.hoverBg} ${action.hoverBorder}`}
            >
              <div className={`p-1 rounded-md mr-2 ${action.iconBg}`}>
                <action.icon className={`h-3.5 w-3.5 ${action.iconColor}`} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}