import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Grid3x3,
  Calendar,
  CalendarDays,
  Users,
  Mic,
  Trophy,
  Clapperboard,
  Building2,
  Target,
  MessageSquare,
  ClipboardList,
  BarChart3,
  QrCode,
  Mail,
  Smartphone,
  Pin,
  PinOff,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Module {
  key: string;
  label: string;
  icon: any;
  route: string;
  enabledKey: string;
}

const ALL_MODULES: Module[] = [
  { key: "meetings", label: "Meetings", icon: Calendar, route: "/meetings", enabledKey: "meetings" },
  { key: "events", label: "Events", icon: CalendarDays, route: "/events", enabledKey: "module_events_enabled" },
  { key: "signup_sheets", label: "Sign-up Sheets", icon: ClipboardList, route: "/signup-sheets", enabledKey: "module_signup_sheets_enabled" },
  { key: "polls", label: "Polls", icon: BarChart3, route: "/polls", enabledKey: "module_polls_enabled" },
  { key: "qr_codes", label: "QR Codes", icon: QrCode, route: "/qr-codes", enabledKey: "module_qr_codes_enabled" },
  { key: "contacts", label: "Contacts", icon: Users, route: "/contacts", enabledKey: "contacts" },
  { key: "podcasts", label: "Podcasts", icon: Mic, route: "/podcasts", enabledKey: "podcasts" },
  { key: "awards", label: "Awards", icon: Trophy, route: "/awards", enabledKey: "module_awards_enabled" },
  { key: "media", label: "Media Library", icon: Clapperboard, route: "/media-library", enabledKey: "module_media_enabled" },
  { key: "civic", label: "Civic Tools", icon: Building2, route: "/civic-blog", enabledKey: "module_civic_enabled" },
  { key: "advertiser", label: "Advertiser", icon: Target, route: "/advertiser/dashboard", enabledKey: "module_advertiser_enabled" },
  { key: "team_chat", label: "Team Chat", icon: MessageSquare, route: "/team-chat", enabledKey: "module_team_chat_enabled" },
  { key: "marketing", label: "Marketing", icon: Mail, route: "/crm", enabledKey: "module_marketing_enabled" },
  { key: "sms", label: "SMS", icon: Smartphone, route: "/sms", enabledKey: "module_sms_enabled" },
];

export const ModuleLauncher = ({ open, onOpenChange }: ModuleLauncherProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [pinnedModules, setPinnedModules] = useState<string[]>(["meetings"]);
  const [showTooltips, setShowTooltips] = useState(false);

  useEffect(() => {
    if (open) {
      loadModulePreferences();
      // Check if user has seen tooltips before
      const hasSeenTooltips = localStorage.getItem("hasSeenModuleLauncherTooltips");
      if (!hasSeenTooltips) {
        setShowTooltips(true);
        localStorage.setItem("hasSeenModuleLauncherTooltips", "true");
      }
    }
  }, [open]);

  const loadModulePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const enabled: string[] = ["meetings", "contacts", "podcasts"]; // Always enabled
      
      if (data.module_events_enabled) enabled.push("events");
      if (data.module_signup_sheets_enabled) enabled.push("signup_sheets");
      if (data.module_polls_enabled) enabled.push("polls");
      if (data.module_qr_codes_enabled) enabled.push("qr_codes");
      if (data.module_awards_enabled) enabled.push("awards");
      if (data.module_media_enabled) enabled.push("media");
      if (data.module_civic_enabled) enabled.push("civic");
      if (data.module_advertiser_enabled) enabled.push("advertiser");
      if (data.module_team_chat_enabled) enabled.push("team_chat");
      if (data.module_marketing_enabled) enabled.push("marketing");
      if (data.module_sms_enabled) enabled.push("sms");

      setEnabledModules(enabled);
      
      // Parse pinned_modules safely
      const pinned = Array.isArray(data.pinned_modules) 
        ? data.pinned_modules 
        : ["meetings"];
      setPinnedModules(pinned as string[]);
    }
  };

  const togglePin = async (moduleKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPinned = pinnedModules.includes(moduleKey)
      ? pinnedModules.filter(k => k !== moduleKey)
      : [...pinnedModules, moduleKey];

    const { error } = await supabase
      .from("user_preferences")
      .update({ pinned_modules: newPinned })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update pinned modules",
        variant: "destructive",
      });
      return;
    }

    setPinnedModules(newPinned);
    toast({
      title: pinnedModules.includes(moduleKey) ? "Unpinned" : "Pinned",
      description: `Module ${pinnedModules.includes(moduleKey) ? "removed from" : "added to"} sidebar`,
    });

    // Trigger sidebar refresh
    window.dispatchEvent(new Event("pinnedModulesChanged"));
  };

  const handleModuleClick = (route: string) => {
    navigate(route);
    onOpenChange(false);
  };

  const availableModules = ALL_MODULES.filter(m => enabledModules.includes(m.key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Module Launcher</DialogTitle>
          <DialogDescription>
            Click a module to open it. Right-click or use the pin icon to add/remove from sidebar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {availableModules.map((module) => {
            const Icon = module.icon;
            const isPinned = pinnedModules.includes(module.key);

            return (
              <TooltipProvider key={module.key}>
                <Tooltip open={showTooltips && module.key === "meetings"}>
                  <TooltipTrigger asChild>
                    <Card
                      className="relative p-6 cursor-pointer hover:bg-accent/50 transition-colors group"
                      onClick={() => handleModuleClick(module.route)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        togglePin(module.key);
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-center">{module.label}</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(module.key);
                        }}
                      >
                        {isPinned ? (
                          <PinOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Pin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      
                      {isPinned && (
                        <div className="absolute top-2 left-2">
                          <Pin className="h-4 w-4 text-primary fill-primary" />
                        </div>
                      )}
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold mb-1">💡 Pro Tip</p>
                    <p>Click to open • Right-click or use pin icon to add to sidebar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {showTooltips && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Grid3x3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Keep Your Sidebar Clean! 🎯</h4>
                <p className="text-sm text-muted-foreground">
                  Only pin the modules you use most often to keep your sidebar uncluttered. 
                  All your modules are always accessible here in the launcher.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTooltips(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};