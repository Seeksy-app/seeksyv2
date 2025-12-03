import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { DashboardHeader } from "@/components/dashboard/universal/DashboardHeader";
import { UniversalDashboardGrid } from "@/components/dashboard/universal/UniversalDashboardGrid";
import { AddWidgetsDrawer } from "@/components/dashboard/universal/AddWidgetsDrawer";
import { DashboardWidget } from "@/components/dashboard/universal/types";
import { defaultWidgets, allAvailableWidgets } from "@/components/dashboard/universal/defaultWidgets";

const STORAGE_KEY = "seeksy-dashboard-widgets-v3";

export default function UniversalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [addWidgetsOpen, setAddWidgetsOpen] = useState(false);

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

  // Data for widgets
  const [dashboardData, setDashboardData] = useState({
    meetings: [] as any[],
    recordings: [] as any[],
    stats: {
      recordingsThisWeek: 0,
      clipsGenerated: 0,
      scheduledMeetings: 0,
      newContacts: 0,
    },
    connectedAccounts: [] as string[],
    completedSteps: [] as string[],
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
      loadDashboardData();
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
    setLoading(false);
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load recent media files
      const { data: mediaFiles } = await supabase
        .from("media_files")
        .select("id, file_name, duration_seconds, created_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3);

      // Load clips count
      const { count: clipsCount } = await supabase
        .from("clips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load media count for this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: recordingsThisWeek } = await supabase
        .from("media_files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("created_at", weekAgo.toISOString());

      // Load social media profiles
      const { data: socialProfiles } = await supabase
        .from("social_media_profiles")
        .select("platform")
        .eq("user_id", user.id);

      // Load meetings (may not exist yet)
      let meetings: any[] = [];
      try {
        const { data } = await supabase
          .from("meetings")
          .select("id, title, start_time")
          .eq("user_id", user.id)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(3);
        meetings = data || [];
      } catch {
        // Meetings table may not exist
      }

      const recordings = (mediaFiles || []).map(file => ({
        id: file.id,
        title: file.file_name || "Untitled Recording",
        thumbnail: undefined,
        duration: formatDuration(file.duration_seconds),
        createdAt: formatDate(file.created_at),
      }));

      const formattedMeetings = (meetings || []).map(m => ({
        id: m.id,
        title: m.title,
        date: formatDate(m.start_time),
        time: formatTime(m.start_time),
      }));

      setDashboardData({
        meetings: formattedMeetings,
        recordings,
        stats: {
          recordingsThisWeek: recordingsThisWeek || 0,
          clipsGenerated: clipsCount || 0,
          scheduledMeetings: meetings?.length || 0,
          newContacts: 0,
        },
        connectedAccounts: socialProfiles?.map(p => p.platform.toLowerCase()) || [],
        completedSteps: [],
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const handleWidgetsChange = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
  };

  const handleToggleWidget = (widgetId: string) => {
    const existingWidget = widgets.find(w => w.id === widgetId);
    
    if (existingWidget) {
      // Toggle existing widget
      handleWidgetsChange(
        widgets.map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
      );
    } else {
      // Add new widget from available widgets
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <DashboardHeader
          firstName={firstName}
          onAddWidgets={() => setAddWidgetsOpen(true)}
        />

        <UniversalDashboardGrid
          widgets={widgets}
          onWidgetsChange={handleWidgetsChange}
          data={dashboardData}
        />

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

// Helper functions
function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
