import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface RSSMigrationTabProps {
  userId: string;
}

export const RSSMigrationTab = ({ userId }: RSSMigrationTabProps) => {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const [oldUrl, setOldUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: migrations, refetch } = useQuery({
    queryKey: ["rss-migrations", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      const { data, error } = await supabase
        .from("rss_migrations")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  const handleCreateMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPodcast || !oldUrl || !newUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("rss_migrations").insert({
        podcast_id: selectedPodcast,
        old_rss_url: oldUrl,
        new_rss_url: newUrl,
        migration_status: "pending",
      });

      if (error) throw error;

      toast.success("Migration plan created");
      refetch();
      setOldUrl("");
      setNewUrl("");
    } catch (error) {
      console.error("Error creating migration:", error);
      toast.error("Failed to create migration");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (migrationId: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("rss_migrations")
        .update({ [field]: value })
        .eq("id", migrationId);

      if (error) throw error;

      toast.success("Status updated");
      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>RSS Feed Migration Guide:</strong> When changing podcast hosting providers, you must:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Set up a 301 redirect from your old RSS URL to the new one on your old host</li>
            <li>Update the RSS URL directly in Apple Podcasts, Spotify, and other directories</li>
            <li>This ensures subscribers automatically follow to your new feed</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Select Podcast</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a podcast to migrate" />
            </SelectTrigger>
            <SelectContent>
              {podcasts?.map((podcast) => (
                <SelectItem key={podcast.id} value={podcast.id}>
                  {podcast.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPodcast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create New Migration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMigration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="old_url">Old RSS URL</Label>
                  <Input
                    id="old_url"
                    type="url"
                    value={oldUrl}
                    onChange={(e) => setOldUrl(e.target.value)}
                    placeholder="https://oldhost.com/podcast/feed.xml"
                    required
                  />
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_url">New RSS URL</Label>
                  <Input
                    id="new_url"
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://newhost.com/podcast/feed.xml"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Migration Plan"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {migrations && migrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Migration History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {migrations.map((migration) => (
                  <Card key={migration.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={migration.migration_status === "completed" ? "default" : "secondary"}>
                          {migration.migration_status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(migration.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Old:</span>
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {migration.old_rss_url}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">New:</span>
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {migration.new_rss_url}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={migration.redirect_setup}
                            onChange={(e) => handleUpdateStatus(migration.id, "redirect_setup", e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">301 Redirect Set Up</span>
                          {migration.redirect_setup && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
