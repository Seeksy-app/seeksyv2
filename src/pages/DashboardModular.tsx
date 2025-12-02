import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { ModularWidgetGrid } from "@/components/dashboard/ModularWidgetGrid";
import { WidgetModal, WidgetDefinition, defaultWidgetDefinitions } from "@/components/dashboard/WidgetModal";
import { NavCustomizationModal } from "@/components/dashboard/NavCustomizationModal";
import { toast } from "sonner";

interface DashboardStats {
  clips: number;
  mediaFiles: number;
  episodes: number;
  followers: number;
  valuation?: { min: number; max: number };
  identity?: { voice: boolean; face: boolean };
}

export default function DashboardModular() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [accountType, setAccountType] = useState("creator");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    clips: 0,
    mediaFiles: 0,
    episodes: 0,
    followers: 0,
  });
  
  // Widget state
  const [widgets, setWidgets] = useState<WidgetDefinition[]>(() => {
    const saved = localStorage.getItem("dashboard-widgets-v2");
    return saved ? JSON.parse(saved) : defaultWidgetDefinitions;
  });
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);

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
      loadStats();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_full_name, account_type")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      const nameParts = profile.account_full_name.split(" ");
      setFirstName(nameParts[0]);
    }

    if (profile?.account_type) {
      setAccountType(profile.account_type);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load clips count
      const { count: clipsCount } = await supabase
        .from("clips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load media files count
      const { count: mediaCount } = await supabase
        .from("media_files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load episodes count
      const { data: podcasts } = await supabase
        .from("podcasts")
        .select("id")
        .eq("user_id", user.id);
      
      let episodesCount = 0;
      if (podcasts?.length) {
        const { count } = await supabase
          .from("episodes")
          .select("*", { count: "exact", head: true })
          .in("podcast_id", podcasts.map(p => p.id));
        episodesCount = count || 0;
      }

      // Simplified stats - just get counts for now
      let totalFollowers = 0;
      let valuationData: { min: number; max: number } | undefined;

      // Load identity verification status
      let voiceVerified = false;
      let faceVerified = false;
      
      try {
        const { data: voiceProfile } = await supabase
          .from("creator_voice_profiles")
          .select("is_verified")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        voiceVerified = voiceProfile?.is_verified === true;
      } catch (e) {
        // No voice profile
      }

      try {
        const { data: identityAssets } = await supabase
          .from("identity_assets")
          .select("cert_status")
          .eq("user_id", user.id)
          .limit(1);
        faceVerified = identityAssets?.[0]?.cert_status === "minted";
      } catch (e) {
        // No face identity
      }

      setStats({
        clips: clipsCount || 0,
        mediaFiles: mediaCount || 0,
        episodes: episodesCount,
        followers: totalFollowers,
        valuation: valuationData,
        identity: {
          voice: voiceVerified,
          face: faceVerified,
        },
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetsSave = (newWidgets: WidgetDefinition[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("dashboard-widgets-v2", JSON.stringify(newWidgets));
    toast.success("Dashboard updated");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <DashboardHero
          firstName={firstName}
          onCustomizeDashboard={() => setWidgetModalOpen(true)}
          onCustomizeNav={() => setNavModalOpen(true)}
        />

        {/* Setup Checklist */}
        <SetupChecklist userId={user.id} accountType={accountType} />

        {/* Widget Grid */}
        <ModularWidgetGrid widgets={widgets} stats={stats} />

        {/* Modals */}
        <WidgetModal
          open={widgetModalOpen}
          onOpenChange={setWidgetModalOpen}
          widgets={widgets}
          onSave={handleWidgetsSave}
        />
        <NavCustomizationModal
          open={navModalOpen}
          onOpenChange={setNavModalOpen}
        />
      </div>
    </div>
  );
}
