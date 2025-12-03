import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Scissors, Mic, Rss, Radio, Users, 
  MessageSquare, Calendar, Link2, DollarSign,
  BarChart3, Shield, ArrowRight, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { PersonaType } from "@/config/personaConfig";

interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  badge?: string;
}

const widgetsByRole: Record<string, WidgetConfig[]> = {
  creator: [
    { id: "media", title: "Media Hub", description: "Upload and manage your content", icon: Video, path: "/media/library", color: "from-blue-500 to-cyan-500" },
    { id: "clips", title: "AI Clips", description: "Generate viral clips automatically", icon: Scissors, path: "/studio/clips", color: "from-purple-500 to-pink-500", badge: "AI" },
    { id: "studio", title: "Studio", description: "Record videos & podcasts", icon: Mic, path: "/studio", color: "from-amber-500 to-orange-500" },
    { id: "analytics", title: "Analytics", description: "Track your growth", icon: BarChart3, path: "/social-analytics", color: "from-emerald-500 to-teal-500" },
  ],
  influencer: [
    { id: "social", title: "Social Hub", description: "Connect & sync your accounts", icon: Link2, path: "/social-analytics", color: "from-pink-500 to-rose-500" },
    { id: "links", title: "My Page", description: "Your link-in-bio", icon: Users, path: "/my-page", color: "from-violet-500 to-purple-500" },
    { id: "monetize", title: "Monetization", description: "Earn from your content", icon: DollarSign, path: "/monetization", color: "from-amber-500 to-yellow-500" },
    { id: "clips", title: "AI Clips", description: "Auto-generate content", icon: Scissors, path: "/studio/clips", color: "from-blue-500 to-cyan-500", badge: "AI" },
  ],
  podcaster: [
    { id: "studio", title: "Podcast Studio", description: "Record your show", icon: Mic, path: "/studio/audio", color: "from-amber-500 to-orange-500" },
    { id: "rss", title: "RSS & Distribution", description: "Manage your feed", icon: Rss, path: "/podcasts", color: "from-emerald-500 to-green-500" },
    { id: "episodes", title: "Episodes", description: "Publish & manage", icon: Radio, path: "/podcasts", color: "from-purple-500 to-violet-500" },
    { id: "clips", title: "AI Clips", description: "Create audiograms", icon: Scissors, path: "/studio/clips", color: "from-blue-500 to-cyan-500", badge: "AI" },
  ],
  business: [
    { id: "meetings", title: "Meetings", description: "Schedule & host calls", icon: Calendar, path: "/meetings", color: "from-blue-500 to-indigo-500" },
    { id: "crm", title: "CRM Lite", description: "Manage your contacts", icon: Users, path: "/contacts", color: "from-emerald-500 to-teal-500" },
    { id: "automations", title: "Automations", description: "Workflows & triggers", icon: Sparkles, path: "/automations", color: "from-purple-500 to-pink-500", badge: "Pro" },
    { id: "communications", title: "Email & SMS", description: "Reach your audience", icon: MessageSquare, path: "/communications", color: "from-amber-500 to-orange-500" },
  ],
  default: [
    { id: "studio", title: "Studio", description: "Record content", icon: Video, path: "/studio", color: "from-amber-500 to-orange-500" },
    { id: "media", title: "Media Library", description: "Your files", icon: Video, path: "/media/library", color: "from-blue-500 to-cyan-500" },
    { id: "clips", title: "AI Clips", description: "Generate clips", icon: Scissors, path: "/studio/clips", color: "from-purple-500 to-pink-500", badge: "AI" },
    { id: "identity", title: "Identity", description: "Voice & face verification", icon: Shield, path: "/identity", color: "from-emerald-500 to-teal-500" },
  ],
};

interface RoleBasedWidgetsProps {
  personaType?: PersonaType | null;
  showDemoWidgets?: boolean;
}

export function RoleBasedWidgets({ personaType, showDemoWidgets = false }: RoleBasedWidgetsProps) {
  const navigate = useNavigate();
  
  // Map persona type to widget role
  const roleKey = personaType === "influencer" ? "influencer" 
    : personaType === "podcaster" ? "podcaster"
    : personaType === "entrepreneur" ? "business"
    : personaType === "agency" ? "business"
    : personaType === "brand" ? "business"
    : personaType === "speaker" ? "creator"
    : personaType === "eventHost" ? "business"
    : "default";
  
  const widgets = widgetsByRole[roleKey] || widgetsByRole.default;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border overflow-hidden h-full"
            onClick={() => navigate(widget.path)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} bg-opacity-10`}>
                  <widget.icon className="h-5 w-5 text-foreground" />
                </div>
                {widget.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    {widget.badge}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm mb-1">{widget.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{widget.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {showDemoWidgets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-dashed border-2 border-border/30 bg-card/30 h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <Badge variant="outline" className="text-[10px] mb-2">Example</Badge>
              <p className="text-xs text-muted-foreground">More widgets available in settings</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
