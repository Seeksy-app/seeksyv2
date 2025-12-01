import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scissors, Video } from "lucide-react";

export default function StudioClips() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clips & Highlights</h1>
            <p className="text-muted-foreground mt-1">
              Manage and create clips from your recordings
            </p>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Scissors className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Clips & Highlights</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  AI-powered clip generation from your recordings is coming soon. 
                  Create shareable highlights automatically.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" disabled>
                  <Video className="w-4 h-4 mr-2" />
                  Create Clip
                </Button>
                <Button variant="outline" disabled>
                  View Library
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>What's coming to Clips & Highlights</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                AI-powered clip detection and generation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Automatic highlight identification
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Social media-ready formatting (9:16, square, 16:9)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Custom branding and captions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                One-click export to social platforms
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
