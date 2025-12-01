import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Home, Mic, Scissors, DollarSign, Users, 
  Settings, FolderOpen, Sparkles, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStudioTheme } from "@/hooks/useStudioTheme";

const navigation = [
  { name: "Studio Home", href: "/studio", icon: Home },
  { name: "Recordings", href: "/studio/recordings", icon: FolderOpen },
  { name: "Clips & Highlights", href: "/studio/clips", icon: Scissors },
  { name: "Ads & Monetization", href: "/studio/ads", icon: DollarSign },
  { name: "Guests", href: "/studio/guests", icon: Users },
  { name: "Settings", href: "/studio/settings", icon: Settings },
];

export default function StudioLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { studioTheme, toggleStudioTheme } = useStudioTheme();
  
  // TODO: Identity status temporarily simplified to avoid TypeScript type inference issues
  // Will be re-enabled once Supabase types are regenerated
  const [identityStatus] = useState<{ voiceVerified: boolean; faceVerified: boolean }>({ 
    voiceVerified: false, 
    faceVerified: false 
  });

  const isActive = (path: string) => {
    if (path === "/studio") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "flex h-screen transition-colors duration-300",
      studioTheme === "dark" ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
    )}>
      {/* Left Navigation Rail */}
      <div className={cn(
        "w-64 border-r flex flex-col transition-colors duration-300",
        studioTheme === "dark" 
          ? "bg-zinc-900 border-zinc-800" 
          : "bg-zinc-50 border-zinc-200"
      )}>
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Seeksy Studio</h2>
                <p className={cn(
                  "text-xs",
                  studioTheme === "dark" ? "text-zinc-400" : "text-zinc-600"
                )}>Flagship Experience</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleStudioTheme}
              className="h-8 w-8"
            >
              {studioTheme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Identity Status */}
        {identityStatus && (
          <div className={cn(
            "px-4 py-3 border-b cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors",
            studioTheme === "dark" ? "border-zinc-800" : "border-zinc-200"
          )}
            onClick={() => navigate("/identity")}
          >
            <div className="space-y-1.5">
              <p className={cn(
                "text-xs font-medium",
                studioTheme === "dark" ? "text-zinc-400" : "text-zinc-600"
              )}>Identity & Trust</p>
              <div className="flex flex-wrap gap-1.5">
                {identityStatus.faceVerified ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Face ✓
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/face-verification");
                    }}
                  >
                    Verify Face
                  </Button>
                )}
                {identityStatus.voiceVerified ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Voice ✓
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/my-voice-identity");
                    }}
                  >
                    Verify Voice
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive(item.href) && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Button>
          ))}
        </nav>

        <Separator />

        {/* Footer Actions */}
        <div className="p-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => navigate("/help")}
          >
            Help & Tutorials
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 overflow-hidden",
        studioTheme === "dark" ? "bg-zinc-950" : "bg-white"
      )}>
        <Outlet />
      </div>
    </div>
  );
}
