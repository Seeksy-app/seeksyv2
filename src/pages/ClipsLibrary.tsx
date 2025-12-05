import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Clock, Flame, Video, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClipsLibrary() {
  const navigate = useNavigate();
  
  // Placeholder clips for demo
  const clips = [
    { id: 1, title: "Growth Hack Tips", duration: "0:45", score: 92, status: "ready" },
    { id: 2, title: "Startup Secrets", duration: "0:32", score: 88, status: "processing" },
    { id: 3, title: "Marketing 101", duration: "0:58", score: 85, status: "ready" },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Clips
          </h1>
          <p className="text-muted-foreground mt-1">
            Create viral-ready clips with AI-powered detection and editing
          </p>
        </div>
        <Button 
          onClick={() => navigate('/clips-studio')}
          className="gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Create New Clip
        </Button>
      </div>

      {/* Hero CTA Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <h2 className="text-2xl font-bold">Transform long videos into viral clips</h2>
              <p className="text-muted-foreground max-w-lg">
                Our AI analyzes your content to find the most engaging moments, 
                adds captions, and optimizes for each platform automatically.
              </p>
              <Button 
                onClick={() => navigate('/clips-studio')}
                size="lg"
                className="mt-4 gap-2"
              >
                Open Clips Studio
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden lg:block">
              <div className="w-64 h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                <Video className="h-16 w-16 text-primary/50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Clips */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Clips</h2>
        
        {clips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                No clips yet. Create your first clip to get started!
              </p>
              <Button 
                onClick={() => navigate('/clips-studio')}
                className="mt-4"
                variant="outline"
              >
                Create First Clip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip) => (
              <Card key={clip.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <Video className="h-8 w-8 text-muted-foreground/50" />
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={clip.status === 'ready' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {clip.status === 'ready' ? 'Ready' : 'Processing...'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {clip.duration}
                    </div>
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {clip.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>Virality Score: {clip.score}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
