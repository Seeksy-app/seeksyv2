import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { DirectoriesTab } from "@/components/podcast/DirectoriesTab";
import { RSSMigrationTab } from "@/components/podcast/RSSMigrationTab";
import { AutoPublishTab } from "@/components/podcast/AutoPublishTab";

export default function PodcastDistribution() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Podcast Distribution</h1>
          <p className="text-muted-foreground">Manage podcast directories, RSS feeds, and auto-publishing</p>
        </div>

        <Tabs defaultValue="directories" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="directories">Directories</TabsTrigger>
            <TabsTrigger value="rss">RSS Migration</TabsTrigger>
            <TabsTrigger value="autopublish">Auto-Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="directories">
            <DirectoriesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="rss">
            <RSSMigrationTab userId={user.id} />
          </TabsContent>

          <TabsContent value="autopublish">
            <AutoPublishTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
