import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Clock, CheckCircle2, Play, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StudioRecordings() {
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["studio-all-sessions"],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        return [];
      }
      return data || [];
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recordings</h1>
            <p className="text-muted-foreground mt-1">
              All your recording sessions
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate("/studio/recording/new")}
          >
            <Play className="w-4 h-4" />
            New Recording
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading recordings...
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <FolderOpen className="w-16 h-16 text-muted-foreground/50 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No recordings yet</h3>
                  <p className="text-muted-foreground">
                    Start your first recording to see it here
                  </p>
                </div>
                <Button onClick={() => navigate("/studio/recording/new")}>
                  Create Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && sessions.length > 0 && (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card 
                key={session.id}
                className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer"
                onClick={() => navigate(`/studio/post-session/${session.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {session.room_name || "Untitled Recording"}
                          </CardTitle>
                          {session.identity_verified && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="tabular-nums">
                        {session.duration_seconds 
                          ? `${Math.floor(session.duration_seconds / 60)}:${(session.duration_seconds % 60).toString().padStart(2, '0')}`
                          : "0:00"}
                      </Badge>
                      <Badge 
                        variant={session.status === 'ended' ? 'outline' : 'default'}
                        className="capitalize"
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
