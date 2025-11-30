import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Wand2, Scissors, FileText, Share2,
  Clock, Users, Mic, ArrowRight, Sparkles
} from "lucide-react";

export default function StudioPostSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ["studio-session", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");

      const { data, error } = await supabase
        .from("studio_sessions")
        .select(`
          *,
          recordings:studio_recordings(*)
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  const nextActions = [
    {
      title: "Run AI Post-Production",
      description: "Clean audio, remove filler words, enhance quality",
      icon: Wand2,
      color: "from-purple-500 to-purple-600",
      action: () => navigate(`/studio/ai-cleanup/${sessionId}`),
    },
    {
      title: "Generate Clips",
      description: "Auto-create social-ready clips from markers",
      icon: Scissors,
      color: "from-blue-500 to-blue-600",
      action: () => navigate(`/studio/clips?session=${sessionId}`),
    },
    {
      title: "Prepare Episode for Publishing",
      description: "Add metadata and publish to RSS",
      icon: FileText,
      color: "from-green-500 to-green-600",
      action: () => navigate(`/podcasts/new?session=${sessionId}`),
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto p-8 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Recording Complete!</h1>
            <p className="text-lg text-muted-foreground">
              Your session has been saved successfully
            </p>
          </div>
        </div>

        {/* Session Summary */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Session Summary
            </CardTitle>
            <CardDescription>
              {session?.room_name || "Untitled Recording"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <div className="text-2xl font-bold">
                  {session?.duration_seconds ? formatTime(session.duration_seconds) : "N/A"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Tracks</span>
                </div>
                <div className="text-2xl font-bold">
                  {session?.recordings?.length || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <div className="text-2xl font-bold">1</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Generated Summary (Stub) */}
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Summary
            </CardTitle>
            <CardDescription>Auto-generated insights from your session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge variant="outline" className="bg-white/50">
                Feature coming soon
              </Badge>
              <p className="text-sm text-muted-foreground">
                AI-powered summaries, key moments, and highlights will appear here once processing is complete.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextActions.map((action, index) => (
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
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate("/studio")}
          >
            Back to Studio Home
          </Button>
          <Button className="gap-2" onClick={() => navigate(`/studio/clips?session=${sessionId}`)}>
            <Share2 className="w-4 h-4" />
            Share Recording
          </Button>
        </div>
      </div>
    </div>
  );
}
