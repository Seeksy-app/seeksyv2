import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportRSSButtonProps {
  onImportComplete?: (podcastId: string) => void;
}

interface ImportResult {
  podcast: {
    title: string;
    description: string;
    author: string;
    imageUrl: string;
  };
  episodes: Array<{
    title: string;
    description: string;
    audioUrl: string;
    pubDate: string;
    duration: number;
    guid: string;
  }>;
}

export function ImportRSSButton({ onImportComplete }: ImportRSSButtonProps) {
  const [open, setOpen] = useState(false);
  const [rssUrl, setRssUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleImport = async () => {
    if (!rssUrl.trim()) {
      toast({
        title: "RSS URL required",
        description: "Please enter a valid RSS feed URL",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStatus("idle");
    setErrorMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call edge function to import RSS
      const { data, error } = await supabase.functions.invoke("import-rss-feed", {
        body: { rssUrl: rssUrl.trim() },
      });

      if (error) throw error;

      if (!data || !data.podcast) {
        throw new Error("Failed to parse RSS feed");
      }

      setImportResult(data);

      // Create podcast in database
      const { data: podcastData, error: podcastError } = await supabase
        .from("podcasts")
        .insert({
          user_id: user.id,
          owner_id: user.id,
          title: data.podcast.title,
          description: data.podcast.description || "",
          cover_image_url: data.podcast.imageUrl || null,
          author: data.podcast.author || "",
          author_email: data.podcast.authorEmail || null,
          website_url: data.podcast.websiteUrl || null,
          category: data.podcast.category || null,
          is_explicit: data.podcast.isExplicit || false,
          language: data.podcast.language || "en",
          source: "rss",
          source_url: rssUrl.trim(),
          rss_feed_url: rssUrl.trim(),
          is_published: true,
        })
        .select()
        .single();

      if (podcastError) throw podcastError;

      // Create episodes with upsert to prevent duplicates on re-import
      if (data.episodes && data.episodes.length > 0) {
        // Filter out episodes without audio URLs
        const validEpisodes = data.episodes.filter((ep: any) => 
          ep.audioUrl && ep.audioUrl.trim() !== ''
        );

        if (validEpisodes.length === 0) {
          throw new Error("No valid episodes with audio URLs found in RSS feed");
        }

        const episodeInserts = validEpisodes.map((ep: any) => ({
          podcast_id: podcastData.id,
          title: ep.title,
          description: ep.description || "",
          audio_url: ep.audioUrl,
          publish_date: ep.pubDate || new Date().toISOString(),
          duration_seconds: ep.durationSeconds || null,
          file_size_bytes: ep.fileSizeBytes || null,
          episode_number: ep.episodeNumber || null,
          season_number: ep.seasonNumber || null,
          source: "rss",
          source_url: rssUrl.trim(),
          guid: ep.guid || null,
          is_published: true,
        }));

        const { error: episodesError } = await supabase
          .from("episodes")
          .upsert(episodeInserts, { 
            onConflict: 'guid',
            ignoreDuplicates: false 
          });

        if (episodesError) {
          console.error("Error inserting episodes:", episodesError);
          throw episodesError;
        }
      }

      setImportStatus("success");
      toast({
        title: "Import successful!",
        description: `Imported "${data.podcast.title}" with ${data.episodes?.length || 0} episodes`,
      });

      console.log("Imported podcast ID:", podcastData.id);
      
      setTimeout(() => {
        setOpen(false);
        setRssUrl("");
        setImportStatus("idle");
        setImportResult(null);
        // Set the active tab to RSS Migration before navigating
        localStorage.setItem("podcast-detail-tab", "rss-migration");
        // Navigate directly to the podcast with RSS Migration tab
        if (onImportComplete) {
          setTimeout(() => onImportComplete(podcastData.id), 300);
        }
      }, 1500);
    } catch (error: any) {
      console.error("RSS Import error:", error);
      setImportStatus("error");
      setErrorMessage(error.message || "Failed to import RSS feed");
      toast({
        title: "Import failed",
        description: error.message || "Unable to import RSS feed. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Import from RSS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import Podcast from RSS Feed</DialogTitle>
          <DialogDescription>
            Paste your podcast RSS feed URL (from Buzzsprout, Anchor, Libsyn, etc.) to import existing episodes into Seeksy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rss-url">RSS Feed URL</Label>
            <Input
              id="rss-url"
              placeholder="https://feeds.buzzsprout.com/..."
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              disabled={isImporting || importStatus === "success"}
            />
            <p className="text-xs text-muted-foreground">
              Enter the full RSS feed URL of your podcast
            </p>
          </div>

          {importStatus === "success" && importResult && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Successfully imported "{importResult.podcast.title}" with{" "}
                {importResult.episodes?.length || 0} episodes!
              </AlertDescription>
            </Alert>
          )}

          {importStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !rssUrl.trim() || importStatus === "success"}
          >
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {importStatus === "success" ? "Imported!" : "Import Podcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
