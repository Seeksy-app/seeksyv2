import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { listCampaigns, type Campaign } from "@/lib/api/advertiserAPI";

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load campaigns for mock advertiser
    listCampaigns("advertiser_1").then(({ campaigns }) => {
      setCampaigns(campaigns);
      setIsLoading(false);
    });
  }, []);

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
          <Button
            onClick={() => navigate("/advertiser/campaigns/new")}
            className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Campaign
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-8 bg-white/95 backdrop-blur">
            <p className="text-center text-muted-foreground">Loading campaigns...</p>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Button
              onClick={() => navigate("/advertiser/campaigns/new")}
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
            >
              Create Your First Campaign
            </Button>
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
                      {campaign.budget && (
                        <span className="text-muted-foreground">
                          Budget: ${campaign.budget.toLocaleString()}
                        </span>
                      )}
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
