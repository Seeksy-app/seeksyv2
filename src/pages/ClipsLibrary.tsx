import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Video, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClipsLibrary() {
  const navigate = useNavigate();

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

    </div>
  );
}
