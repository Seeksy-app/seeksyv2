import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone } from "lucide-react";

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
        .eq("user_id", user.id)
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
      return data || [];
    },
    enabled: !!advertiser,
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
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {campaign.budget && (
                      <span>Budget: ${campaign.budget.toLocaleString()}</span>
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
