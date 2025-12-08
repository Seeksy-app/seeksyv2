import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Tv, Image, Video, Check, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TVContentSeeder() {
  const [generateThumbnails, setGenerateThumbnails] = useState(true);
  const queryClient = useQueryClient();

  // Fetch current TV stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["tv-seeder-stats"],
    queryFn: async () => {
      const [channelsRes, contentRes] = await Promise.all([
        supabase.from("tv_channels").select("id, name, category", { count: "exact" }),
        supabase.from("tv_content").select("id, title, content_type, thumbnail_url", { count: "exact" }),
      ]);
      
      const contentWithThumbnails = contentRes.data?.filter(c => c.thumbnail_url) || [];
      const contentByType = contentRes.data?.reduce((acc, c) => {
        acc[c.content_type || "unknown"] = (acc[c.content_type || "unknown"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        channels: channelsRes.count || 0,
        content: contentRes.count || 0,
        withThumbnails: contentWithThumbnails.length,
        byType: contentByType,
      };
    },
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.functions.invoke("seed-tv-content", {
        body: { action, generateThumbnails },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Content seeded successfully!");
      queryClient.invalidateQueries({ queryKey: ["tv-seeder-stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Seeding failed: ${error.message}`);
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tv className="h-8 w-8 text-amber-500" />
          Seeksy TV Content Seeder
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate AI thumbnails, metadata, and seed demo content for Seeksy TV
        </p>
      </div>

      {/* Current Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Current TV Content</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{stats?.channels || 0}</div>
                <div className="text-sm text-muted-foreground">Channels</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{stats?.content || 0}</div>
                <div className="text-sm text-muted-foreground">Total Content</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats?.withThumbnails || 0}</div>
                <div className="text-sm text-muted-foreground">With Thumbnails</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap gap-1 justify-center">
                  {Object.entries(stats?.byType || {}).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count as number}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">By Type</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Seeding Options</CardTitle>
          <CardDescription>Configure how content should be generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="generate-thumbnails" className="text-base">Generate AI Thumbnails</Label>
              <p className="text-sm text-muted-foreground">
                Use Lovable AI to generate unique thumbnails for each content item (slower but better quality)
              </p>
            </div>
            <Switch
              id="generate-thumbnails"
              checked={generateThumbnails}
              onCheckedChange={setGenerateThumbnails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Seed All Content
            </CardTitle>
            <CardDescription>
              Creates channels + all content types with AI thumbnails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => seedMutation.mutate("seed_all")}
              disabled={seedMutation.isPending}
              className="w-full"
            >
              {seedMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Seeding...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Seed Everything
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tv className="h-5 w-5 text-blue-500" />
              Channels Only
            </CardTitle>
            <CardDescription>
              Creates channels with AI-generated avatars and covers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate("channels")}
              disabled={seedMutation.isPending}
              className="w-full"
            >
              {seedMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Tv className="h-4 w-4 mr-2" />
                  Create Channels
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-green-500" />
              Content Only
            </CardTitle>
            <CardDescription>
              Creates episodes, clips, spotlights with thumbnails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate("content")}
              disabled={seedMutation.isPending}
              className="w-full"
            >
              {seedMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Create Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      {seedMutation.isSuccess && seedMutation.data && (
        <Card className="mt-6 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              Seeding Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">{seedMutation.data.message}</p>
            {seedMutation.data.results && (
              <div className="mt-2 text-sm text-green-600">
                <p>Created {seedMutation.data.results.channels?.length || 0} channels</p>
                <p>Created {seedMutation.data.results.content?.length || 0} content items</p>
                <p>Generated {seedMutation.data.results.thumbnails?.filter((t: string) => t !== "failed").length || 0} thumbnails</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">What Gets Created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Channels (8):</strong> Tech Insider Daily, The Wellness Hour, Business Unplugged, Creative Studio, True Crime Weekly, Startup Stories, AI Frontiers, Mindful Living
          </div>
          <div>
            <strong className="text-foreground">Podcast Episodes (10):</strong> Full-length episodes across Technology, Business, Health, Design, and True Crime categories
          </div>
          <div>
            <strong className="text-foreground">AI Clips (8):</strong> Short-form vertical content styled like TikTok/YouTube Shorts
          </div>
          <div>
            <strong className="text-foreground">Creator Spotlights (4):</strong> Behind-the-scenes and creator journey content
          </div>
          <div>
            <strong className="text-foreground">AI Thumbnails:</strong> Each content item gets a unique AI-generated thumbnail using Lovable AI
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
