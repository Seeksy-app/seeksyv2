import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Radio, Scissors, DollarSign, 
  Clock, TrendingUp, Sparkles, Play,
  CheckCircle2, XCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StudioHome() {
  const navigate = useNavigate();

  // Fetch recent sessions
  const { data: recentSessions, refetch } = useQuery({
    queryKey: ["studio-recent-sessions"],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // @ts-ignore
      const { data, error } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching sessions:", error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch identity status
  const { data: identityStatus } = useQuery({
    queryKey: ["identity-status-home"],
    queryFn: async (): Promise<{ voiceVerified: boolean; faceVerified: boolean }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { voiceVerified: false, faceVerified: false };

      // @ts-ignore
      const faceResult = await supabase.from("identity_assets")
        .select("id")
        .eq("user_id", user.id)
        .eq("asset_type", "FACE_IDENTITY")
        .eq("cert_status", "minted")
        .limit(1);
      
      // @ts-ignore
      const voiceResult = await supabase.from("creator_voice_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .limit(1);

      return {
        faceVerified: !!(faceResult.data && faceResult.data.length > 0),
        voiceVerified: !!(voiceResult.data && voiceResult.data.length > 0),
      };
    },
  });

  // Fetch studio stats
  const { data: stats } = useQuery({
    queryKey: ["studio-stats"],
    queryFn: async (): Promise<{ totalSessions: number; totalClips: number }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalSessions: 0, totalClips: 0 };

      // @ts-ignore
      const [sessionsResult, clipsResult] = await Promise.all([
        supabase.from("studio_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("clip_markers")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
      ]);

      return {
        totalSessions: sessionsResult.count || 0,
        totalClips: clipsResult.count || 0,
      };
    },
  });

  const quickActions = [
    {
      title: "Start Recording",
      description: "Begin a new audio session",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/studio/recording/new"),
      available: true,
    },
    {
      title: "Start Live Broadcast",
      description: "Stream live to multiple platforms",
      icon: Radio,
      color: "from-red-500 to-red-600",
      action: () => navigate("/studio/live/new"),
      available: false,
    },
    {
      title: "View Clips & Highlights",
      description: "Manage your clip library",
      icon: Scissors,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/studio/clips"),
      available: false,
    },
    {
      title: "Ad Slots & Monetization",
      description: "Configure revenue opportunities",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      action: () => navigate("/studio/ads"),
      available: false,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container max-w-7xl mx-auto p-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Seeksy Studio
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Professional content creation, simplified
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-xl h-14 px-8"
              onClick={() => navigate("/studio/recording/new")}
            >
              <Play className="w-5 h-5" />
              Start Recording
            </Button>
          </div>
        </div>

        {/* Identity Status Card */}
        {identityStatus && (!identityStatus.voiceVerified || !identityStatus.faceVerified) && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 shadow-xl animate-in fade-in slide-in-from-top-5 duration-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Complete Your Identity Verification
              </CardTitle>
              <CardDescription>
                Unlock premium features and build trust with advertisers
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
                    <XCircle className="w-4 h-4" />
                    Verify Face
                  </Button>
                )}
                {identityStatus.faceVerified && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Face Verified
                  </div>
                )}
                {!identityStatus.voiceVerified && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/my-voice-identity")}
                  >
                    <XCircle className="w-4 h-4" />
                    Verify Voice
                  </Button>
                )}
                {identityStatus.voiceVerified && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Voice Verified
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Studio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Card className="border-2 hover:border-primary/30 transition-colors shadow-lg">
            <CardHeader>
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-4xl">{stats?.totalSessions || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-primary/30 transition-colors shadow-lg">
            <CardHeader>
              <CardDescription>Clip Markers</CardDescription>
              <CardTitle className="text-4xl flex items-center gap-2">
                {stats?.totalClips || 0}
                <TrendingUp className="w-5 h-5 text-green-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-primary/30 transition-colors shadow-lg">
            <CardHeader>
              <CardDescription>Total Guests</CardDescription>
              <CardTitle className="text-4xl">0</CardTitle>
              <Badge variant="outline" className="w-fit text-xs mt-2">Phase 2</Badge>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-7 duration-700">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className={`group transition-all duration-300 border-2 overflow-hidden ${
                  action.available 
                    ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 hover:border-primary/50' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={action.available ? action.action : undefined}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 ${action.available ? 'group-hover:opacity-5' : ''} transition-opacity`} />
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 ${action.available ? 'group-hover:scale-110' : ''} transition-transform shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardTitle className={`${action.available ? 'group-hover:text-primary' : ''} transition-colors`}>
                      {action.title}
                    </CardTitle>
                    {!action.available && (
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    )}
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Recordings */}
        {recentSessions && recentSessions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Recordings</h2>
              <Button variant="ghost" onClick={() => navigate("/studio/recordings")}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="hover:shadow-lg transition-all hover:border-primary/30 border-2 cursor-pointer"
                  onClick={() => navigate(`/studio/post-session/${session.id}`)}
                >
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shadow-md">
                          <Mic className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">
                              {session.room_name || "Untitled Recording"}
                            </CardTitle>
                            {session.identity_verified && (
                              <Badge variant="outline" className="gap-1 text-xs">
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
          </div>
        )}

        {/* Empty State */}
        {recentSessions && recentSessions.length === 0 && (
          <Card className="border-2 border-dashed bg-muted/20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Mic className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">No recordings yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start your first recording session and build your content library
                  </p>
                </div>
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-purple-500"
                  onClick={() => navigate("/studio/recording/new")}
                >
                  <Play className="w-5 h-5" />
                  Create Your First Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help & Resources */}
        <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-2 shadow-lg animate-in fade-in slide-in-from-bottom-9 duration-700">
          <CardHeader>
            <CardTitle>Studio Resources</CardTitle>
            <CardDescription>
              Learn how to get the most out of Seeksy Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" size="sm">
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
