import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Video, Upload, Wand2, 
  Clock, Scissors, ArrowRight, 
  FolderOpen, FileText, Settings,
  History, Calendar, HardDrive
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StudioHubPremium() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["studio-hub-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { sessions: 0, clips: 0 };

      const [sessionsResult, clipsResult] = await Promise.all([
        supabase.from("studio_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("clips")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
      ]);

      return {
        sessions: sessionsResult.count || 0,
        clips: clipsResult.count || 0,
      };
    },
  });

  const { data: recentSessions } = useQuery({
    queryKey: ["studio-recent-sessions-hub"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  const quickActions = [
    { icon: Play, label: "Create New Studio", color: "bg-primary", path: "/studio/video" },
    { icon: Upload, label: "Upload Media", color: "bg-amber-500", path: "/studio/media?upload=true" },
    { icon: Wand2, label: "Generate Clips", color: "bg-pink-500", path: "/clips-studio" },
  ];

  const hubMenuItems = [
    { icon: History, label: "Past Streams", path: "/studio/past-streams", desc: "View recordings" },
    { icon: Calendar, label: "Scheduled Streams", path: "/studio/scheduled", desc: "Upcoming streams" },
    { icon: HardDrive, label: "Storage", path: "/studio/storage", desc: "All assets & files" },
    { icon: Scissors, label: "Clips & Highlights", path: "/clips-studio", desc: "AI-generated clips" },
    { icon: FolderOpen, label: "Media Library", path: "/studio/media", desc: "All your recordings" },
    { icon: FileText, label: "Templates", path: "/studio/templates", desc: "Scripts & ad reads" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Studio</h1>
            <p className="text-muted-foreground mt-1">Professional content creation suite</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{stats?.sessions || 0}</span> Sessions
              <span className="mx-2">•</span>
              <span className="font-medium">{stats?.clips || 0}</span> Auto Clips
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
          <div className="flex items-center gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`h-12 px-6 gap-2 ${action.color === 'bg-primary' ? 'bg-primary hover:bg-primary/90' : `${action.color} hover:opacity-90`} text-white`}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Sessions</h2>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/studio/recordings")}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="border border-border rounded-xl divide-y divide-border bg-card">
              {recentSessions && recentSessions.length > 0 ? (
                recentSessions.map((session: any) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/studio/session/${session.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{session.room_name || "Untitled Session"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs tabular-nums">
                        {session.duration_seconds 
                          ? `${Math.floor(session.duration_seconds / 60)}:${(session.duration_seconds % 60).toString().padStart(2, '0')}`
                          : "0:00"}
                      </Badge>
                      <Badge variant={session.status === 'ended' ? 'secondary' : 'default'} className="text-xs capitalize">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm mb-1">No sessions yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start your first studio session to see it here</p>
                  <Button size="sm" onClick={() => navigate("/studio/video")}>
                    <Play className="w-3 h-3 mr-1" /> Create New Studio
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Studio Hub Navigation */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Studio Hub Menu</h2>
            <div className="border border-border rounded-xl divide-y divide-border bg-card">
              {hubMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
