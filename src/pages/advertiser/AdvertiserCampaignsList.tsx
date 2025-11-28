import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone, Radio, Users } from "lucide-react";

const AdvertiserCampaignsList = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: advertiser } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("advertisers")
        .select("*")
        .eq("owner_profile_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["ad-campaigns", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // For each active campaign, check if any creators are live with this campaign
      const campaignsWithLiveStatus = await Promise.all(
        (data || []).map(async (campaign) => {
          if (campaign.status !== 'active') {
            return { ...campaign, liveCreatorCount: 0, liveCreators: [] };
          }

          // Check for creators who are currently live streaming
          const { data: liveCreators, error: liveError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('is_live_on_profile', true)
            .limit(5);

          if (liveError || !liveCreators) {
            return { ...campaign, liveCreatorCount: 0, liveCreators: [] };
          }

          return {
            ...campaign,
            liveCreatorCount: liveCreators.length,
            liveCreators: liveCreators,
          };
        })
      );

      return campaignsWithLiveStatus;
    },
    enabled: !!advertiser,
    refetchInterval: 30000, // Refresh every 30 seconds to update live status
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "pending":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your advertising campaigns
          </p>
        </div>
        <Button onClick={() => navigate("/advertiser/campaigns/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </Card>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card className="p-8 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Create ads first, then launch campaigns to reach your audience
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => navigate("/advertiser/campaigns/create-type")}
              variant="outline"
            >
              Create Ad First
            </Button>
            <Button onClick={() => navigate("/advertiser/campaigns/create")}>
              Create Campaign
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
            >
              <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      {campaign.status === 'active' && (campaign as any).liveCreatorCount > 0 && (
                        <Badge className="bg-red-500 animate-pulse">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE on {(campaign as any).liveCreatorCount} {(campaign as any).liveCreatorCount === 1 ? 'stream' : 'streams'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {campaign.total_budget && (
                        <span>Budget: ${campaign.total_budget.toLocaleString()}</span>
                      )}
                      {campaign.cpm_bid && (
                        <span>CPM: ${campaign.cpm_bid}</span>
                      )}
                      {campaign.start_date && (
                        <span>
                          Start: {new Date(campaign.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {campaign.end_date && (
                        <span>
                          End: {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {campaign.total_impressions !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">
                          {campaign.total_impressions?.toLocaleString() || 0}
                        </span>{" "}
                        impressions
                      </div>
                    )}
                    {(campaign as any).liveCreators && (campaign as any).liveCreators.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Currently streaming:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(campaign as any).liveCreators.map((creator: any) => (
                            <Badge key={creator.id} variant="secondary" className="gap-1">
                              {creator.avatar_url && (
                                <img src={creator.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              {creator.full_name || creator.username}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/advertiser/campaigns/${campaign.id}`);
                  }}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvertiserCampaignsList;
