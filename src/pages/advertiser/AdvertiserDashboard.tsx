import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { listCampaigns, type Campaign } from "@/lib/api/advertiserAPI";
import { useAdvertiserGuard } from "@/hooks/useAdvertiserGuard";

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { isOnboarded, advertiserId, isLoading: guardLoading } = useAdvertiserGuard();
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  useEffect(() => {
    // Only load campaigns once we have a valid advertiser ID
    const fetchCampaigns = async () => {
      if (!isOnboarded || !advertiserId) return;
      
      setIsLoadingCampaigns(true);
      try {
        const { campaigns: fetchedCampaigns } = await listCampaigns(advertiserId);
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [isOnboarded, advertiserId]);

  const isLoading = guardLoading || isLoadingCampaigns;

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "paused":
        return "text-yellow-600";
      case "draft":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advertiser Dashboard</h1>
            <p className="text-white/70 mt-1">Manage your campaigns and ad scripts</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/advertiser/campaigns/create-type")}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
            <Button
              onClick={() => navigate("/advertiser/campaigns/create")}
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-8 bg-white/95 backdrop-blur">
            <p className="text-center text-muted-foreground">Loading campaigns...</p>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mb-6">Get started by creating an ad first, then launch a campaign</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => navigate("/advertiser/campaigns/create-type")}
                variant="outline"
              >
                Create Ad First
              </Button>
              <Button
                onClick={() => navigate("/advertiser/campaigns/create")}
                className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
              >
                Create Campaign
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="p-6 bg-white/95 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-[#053877]">
                      {campaign.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">
                        Budget: ${(campaign as any).total_budget?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.targeting.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-[#2C6BED]/10 text-[#2C6BED] text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
    </div>
  );
};

export default AdvertiserDashboard;
