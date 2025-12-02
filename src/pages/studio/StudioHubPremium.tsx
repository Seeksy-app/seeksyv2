import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Mic, Video, Upload, Wand2, 
  Clock, Scissors, ArrowRight, 
  FolderOpen, FileText, Settings,
  History, Calendar, HardDrive, Radio
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RecordingTypeSelector } from "@/components/studio/hub/RecordingTypeSelector";

export default function StudioHubPremium() {
  const navigate = useNavigate();
  const [showRecordingSelector, setShowRecordingSelector] = useState(false);

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
    { icon: Mic, label: "Audio Recording", color: "bg-violet-500", path: "/studio/audio" },
    { icon: Video, label: "Video Recording", color: "bg-blue-500", path: "/studio/video" },
    { icon: Upload, label: "Upload Media", color: "bg-amber-500", path: "/studio/media?upload=true" },
    { icon: Wand2, label: "Generate Clips", color: "bg-pink-500", path: "/studio/clips" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RecordingTypeSelector 
        open={showRecordingSelector} 
        onOpenChange={setShowRecordingSelector} 
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Studio</h1>
            <p className="text-muted-foreground mt-1">Professional content creation suite</p>
          </div>
          <Button 
            size="lg" 
            className="gap-2 h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => setShowRecordingSelector(true)}
          >
            <Play className="w-4 h-4" />
            Start Recording
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-8 mb-10 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Mic className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{stats?.sessions || 0}</p>
              <p className="text-muted-foreground text-xs">Sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Scissors className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{stats?.clips || 0}</p>
              <p className="text-muted-foreground text-xs">Auto Clips</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group"
              >
                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </button>
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
                        <Mic className="w-5 h-5 text-primary" />
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
                    <Mic className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm mb-1">No recordings yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start your first session to see it here</p>
                  <Button size="sm" onClick={() => setShowRecordingSelector(true)}>
                    <Play className="w-3 h-3 mr-1" /> Start Recording
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Studio Hub Navigation */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Studio Hub</h2>
            <div className="border border-border rounded-xl divide-y divide-border bg-card">
              {[
                { icon: History, label: "Past Streams", path: "/studio/past-streams", desc: "View recordings" },
                { icon: Calendar, label: "Scheduled", path: "/studio/scheduled", desc: "Upcoming streams" },
                { icon: HardDrive, label: "Storage", path: "/studio/storage", desc: "All assets & files" },
                { icon: Scissors, label: "Clips & Highlights", path: "/studio/clips", desc: "AI-generated clips" },
                { icon: FolderOpen, label: "Media Library", path: "/studio/media", desc: "All your recordings" },
                { icon: FileText, label: "Templates", path: "/studio/templates", desc: "Scripts & ad reads" },
                { icon: Settings, label: "Studio Settings", path: "/studio/settings", desc: "Preferences" },
              ].map((item) => (
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
