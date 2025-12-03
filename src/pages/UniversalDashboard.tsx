import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import { WorkspaceHeader } from "@/components/dashboard/workspace/WorkspaceHeader";
import { QuickActionsRow } from "@/components/dashboard/workspace/QuickActionsRow";
import { RoleBasedWidgets } from "@/components/dashboard/workspace/RoleBasedWidgets";
import { IdentityWidget } from "@/components/dashboard/workspace/IdentityWidget";
import { AddWidgetsDrawer } from "@/components/dashboard/universal/AddWidgetsDrawer";
import { DashboardWidget } from "@/components/dashboard/universal/types";
import { defaultWidgets, allAvailableWidgets } from "@/components/dashboard/universal/defaultWidgets";
import { PersonaType } from "@/config/personaConfig";

const STORAGE_KEY = "seeksy-dashboard-widgets-v3";

export default function UniversalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [personaType, setPersonaType] = useState<PersonaType | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addWidgetsOpen, setAddWidgetsOpen] = useState(false);
  
  // Identity verification status
  const [faceVerified, setFaceVerified] = useState(false);
  const [voiceVerified, setVoiceVerified] = useState(false);

  // Widget state
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultWidgets;
      }
    }
    return defaultWidgets;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadIdentityStatus();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_full_name")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      const nameParts = profile.account_full_name.split(" ");
      setFirstName(nameParts[0]);
    }

    // Load persona type and selected modules from user_preferences
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("user_type, pinned_modules")
      .eq("user_id", user.id)
      .maybeSingle();

    if (prefs?.user_type) {
      const typeMapping: Record<string, PersonaType> = {
        creator: "influencer",
        influencer: "influencer",
        podcaster: "podcaster",
        speaker: "speaker",
        event_host: "eventHost",
        eventHost: "eventHost",
        entrepreneur: "entrepreneur",
        business: "entrepreneur",
        agency: "agency",
        brand: "brand",
      };
      setPersonaType(typeMapping[prefs.user_type] || null);
    }

    // Load selected modules from onboarding
    if (prefs?.pinned_modules && Array.isArray(prefs.pinned_modules)) {
      setSelectedModules(prefs.pinned_modules as string[]);
    }

    setLoading(false);
  };

  const loadIdentityStatus = async () => {
    if (!user) return;

    try {
      // Check face verification
      const { data: faceAssets } = await supabase
        .from("identity_assets")
        .select("cert_status")
        .eq("user_id", user.id);
      
      const faceAsset = faceAssets?.find((a: any) => a.cert_status === "minted");
      setFaceVerified(!!faceAsset);

      // Check voice verification
      const { data: voiceProfile } = await supabase
        .from("creator_voice_profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setVoiceVerified(voiceProfile?.is_verified === true);
    } catch (error) {
      console.error("Error loading identity status:", error);
    }
  };

  const handleWidgetsChange = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
  };

  const handleToggleWidget = (widgetId: string) => {
    const existingWidget = widgets.find(w => w.id === widgetId);
    
    if (existingWidget) {
      handleWidgetsChange(
        widgets.map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
      );
    } else {
      const widgetToAdd = allAvailableWidgets.find(w => w.id === widgetId);
      if (widgetToAdd) {
        handleWidgetsChange([...widgets, { ...widgetToAdd, enabled: true, order: widgets.length }]);
      }
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Workspace Header */}
        <WorkspaceHeader
          firstName={firstName}
          personaType={personaType}
          onCustomize={() => setAddWidgetsOpen(true)}
        />

        {/* Quick Actions */}
        <QuickActionsRow />

        {/* Role-Based Widgets */}
        <RoleBasedWidgets personaType={personaType} selectedModules={selectedModules} />

        {/* Identity & Additional Widgets */}
        <div className="grid md:grid-cols-3 gap-5 mt-6">
          <IdentityWidget 
            faceVerified={faceVerified} 
            voiceVerified={voiceVerified} 
          />
          
          {/* Recent Activity Card */}
          <div className="md:col-span-2 rounded-2xl border-2 border-border/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 shadow-md hover:shadow-lg transition-all duration-300 p-5 sm:p-6">
            <h3 className="font-bold text-base mb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                <div className="w-4 h-4 rounded-full bg-white/90" />
              </div>
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/80 border-2 border-emerald-100">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-sm font-medium text-foreground">Welcome to your Seeksy Workspace!</span>
              </div>
              <p className="text-sm text-muted-foreground text-center py-6">
                Your activity will appear here as you use the platform
              </p>
            </div>
          </div>
        </div>

        <AddWidgetsDrawer
          open={addWidgetsOpen}
          onOpenChange={setAddWidgetsOpen}
          widgets={widgets}
          onToggleWidget={handleToggleWidget}
        />
      </div>
    </div>
  );
}
