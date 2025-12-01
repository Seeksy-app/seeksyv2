import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, FileText, Radio, Monitor, Globe, DollarSign, BarChart3, List, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { OverviewTab } from "@/components/podcast/OverviewTab";
import { EpisodesTab } from "@/components/podcast/EpisodesTab";
import { PodcastStudioTab } from "@/components/podcast/PodcastStudioTab";
import { PlayersTab } from "@/components/podcast/PlayersTab";
import { WebsiteTab } from "@/components/podcast/WebsiteTab";
import { MonetizationTab } from "@/components/podcast/MonetizationTab";
import { StatsTab } from "@/components/podcast/StatsTab";
import { DirectoriesTab } from "@/components/podcast/DirectoriesTab";
import { RSSMigrationTab } from "@/components/podcast/RSSMigrationTab";

const PodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Persist tab selection in localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("podcast-detail-tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("podcast-detail-tab", activeTab);
  }, [activeTab]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Podcast not found</p>
          <Button onClick={() => navigate("/podcasts")}>Back to Podcasts</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/podcasts")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {podcast.cover_image_url && (
              <img
                src={podcast.cover_image_url}
                alt={podcast.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{podcast.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded text-xs font-medium text-white">
                  Hosted by Seeksy
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">My Podcasts</span>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Resources</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger
              value="studio"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Studio
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger
              value="website"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Website
            </TabsTrigger>
            <TabsTrigger
              value="monetization"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Monetization
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="directories"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Directories
            </TabsTrigger>
            <TabsTrigger
              value="rss-migration"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              RSS Migration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 p-6">
            <OverviewTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="episodes" className="mt-0 p-6">
            <EpisodesTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="studio" className="mt-0 p-6">
            <PodcastStudioTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="players" className="mt-0 p-6">
            <PlayersTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="website" className="mt-0 p-6">
            <WebsiteTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="monetization" className="mt-0 p-6">
            <MonetizationTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="stats" className="mt-0 p-6">
            <StatsTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="directories" className="mt-0 p-6">
            <DirectoriesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="rss-migration" className="mt-0 p-6">
            <RSSMigrationTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PodcastDetail;
