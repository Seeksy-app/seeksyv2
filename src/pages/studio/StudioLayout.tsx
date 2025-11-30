import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, Mic, Scissors, DollarSign, Users, 
  Settings, FolderOpen, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Simplified identity check
  const identityStatus = { voiceVerified: false, faceVerified: false };

  const isActive = (path: string) => {
    if (path === "/studio") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Navigation Rail */}
      <div className="w-64 border-r bg-card/30 backdrop-blur-sm flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Seeksy Studio</h2>
              <p className="text-xs text-muted-foreground">Flagship Experience</p>
            </div>
          </div>
        </div>

        {/* Identity Status */}
        {identityStatus && (
          <div className="px-4 py-3 border-b">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Identity & Trust</p>
              <div className="flex flex-wrap gap-1.5">
                {identityStatus.faceVerified ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Face ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Face</Badge>
                )}
                {identityStatus.voiceVerified ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Voice ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Voice</Badge>
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
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
