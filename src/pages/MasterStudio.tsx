import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Video, User, Radio } from "lucide-react";

export default function MasterStudio() {
  const navigate = useNavigate();

  // Fetch user's podcasts for audio podcast routing
  const { data: podcasts } = useQuery({
    queryKey: ["user-podcasts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
  });

  const handleAudioPodcast = () => {
    if (!podcasts || podcasts.length === 0) {
      navigate("/podcasts");
      return;
    }
    
    if (podcasts.length === 1) {
      navigate(`/podcasts/${podcasts[0].id}?tab=studio`);
    } else {
      // Multiple podcasts - let user choose
      navigate("/podcasts");
    }
  };

  const creationOptions = [
    {
      title: "Audio Podcast Episode",
      description: "Record, edit, and publish audio-only podcast episodes",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
      action: handleAudioPodcast,
    },
    {
      title: "Video Podcast (Remote Guests)",
      description: "Record video podcasts with remote guests, multi-camera layouts",
      icon: Video,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/studio/video"),
    },
    {
      title: "Solo Video Recording",
      description: "Record yourself with professional video tools",
      icon: User,
      color: "from-green-500 to-green-600",
      action: () => navigate("/studio/video?mode=solo"),
    },
    {
      title: "Live Stream",
      description: "Go live to multiple platforms simultaneously",
      icon: Radio,
      color: "from-red-500 to-red-600",
      action: () => navigate("/studio/live"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            What do you want to create today?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your creation mode and start producing professional content with Seeksy's unified studio experience.
          </p>
        </div>

        {/* Creation Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {creationOptions.map((option, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              onClick={option.action}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <CardHeader className="relative">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {option.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {option.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative">
                <Button
                  variant="ghost"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All your creation tools in one place • Professional quality • Easy to use
          </p>
        </div>
      </div>
    </div>
  );
}
