import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Video, Radio, Play, Scissors, DollarSign, 
  Clock, Users, TrendingUp, Sparkles 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StudioHome() {
  const navigate = useNavigate();

  // Fetch recent recordings
  const { data: recentRecordings } = useQuery({
    queryKey: ["studio-recent-recordings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("studio_recordings")
        .select(`
          *,
          session:studio_sessions(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Simplified identity check  
  const identityStatus = { voiceVerified: false, faceVerified: false };

  const quickActions = [
    {
      title: "Start Recording",
      description: "Begin a new audio or video session",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/studio/recording/new"),
    },
    {
      title: "Start Live Session",
      description: "Broadcast live to multiple platforms",
      icon: Radio,
      color: "from-red-500 to-red-600",
      action: () => navigate("/studio/live/new"),
    },
    {
      title: "Open Clips & Highlights",
      description: "View and manage your clips",
      icon: Scissors,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/studio/clips"),
    },
    {
      title: "Set up Ads & Monetization",
      description: "Configure ad slots and revenue",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      action: () => navigate("/studio/ads"),
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto p-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Welcome to Studio
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Professional content creation, simplified
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-purple-500"
              onClick={() => navigate("/studio/recording/new")}
            >
              <Play className="w-5 h-5" />
              Start Creating
            </Button>
          </div>
        </div>

        {/* Identity Status Card */}
        {identityStatus && (!identityStatus.voiceVerified || !identityStatus.faceVerified) && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Complete Your Identity Verification
              </CardTitle>
              <CardDescription>
                Unlock premium features and build trust with your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {!identityStatus.faceVerified && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/identity")}
                  >
                    Verify Face
                  </Button>
                )}
                {!identityStatus.voiceVerified && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/my-voice-identity")}
                  >
                    Verify Voice
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
                onClick={action.action}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Recordings */}
        {recentRecordings && recentRecordings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recent Recordings</h2>
              <Button variant="ghost" onClick={() => navigate("/studio/recordings")}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentRecordings.map((recording) => (
                <Card key={recording.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {(recording.session as any)?.room_name || "Untitled Recording"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {recording.duration_seconds 
                            ? `${Math.floor(recording.duration_seconds / 60)}:${(recording.duration_seconds % 60).toString().padStart(2, '0')}`
                            : "N/A"}
                        </Badge>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Studio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clips Generated</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                0
                <TrendingUp className="w-4 h-4 text-green-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Guests</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                0
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Help & Resources */}
        <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
          <CardHeader>
            <CardTitle>Studio Resources</CardTitle>
            <CardDescription>
              Learn how to get the most out of Seeksy Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/help")}>
              View Tutorials
            </Button>
            <Button variant="outline" size="sm">
              Best Practices
            </Button>
            <Button variant="outline" size="sm">
              Community
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
