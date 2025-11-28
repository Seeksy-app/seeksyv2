import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target, 
  ExternalLink,
  Plus,
  MessageSquare,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface AdvertisingOverviewProps {
  contact: any;
}

export const AdvertisingOverview = ({ contact }: AdvertisingOverviewProps) => {
  // Query advertisers linked to this contact (by email or company name)
  const { data: linkedAdvertisers, isLoading: advertisersLoading } = useQuery({
    queryKey: ["contact-advertisers", contact.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .or(`contact_email.eq.${contact.email},company_name.ilike.%${contact.company}%`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!contact.email || !!contact.company,
  });

  // Query campaigns for linked advertisers
  const { data: campaignStats } = useQuery({
    queryKey: ["contact-campaign-stats", linkedAdvertisers?.map(a => a.id)],
    queryFn: async () => {
      if (!linkedAdvertisers || linkedAdvertisers.length === 0) return null;
      
      const advertiserIds = linkedAdvertisers.map(a => a.id);
      
      const { data: campaigns, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .in("advertiser_id", advertiserIds);
      
      if (error) throw error;
      
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;
      const completedCampaigns = campaigns?.filter(c => c.status === "completed").length || 0;
      
      const totalSpent = campaigns?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0;
      const totalImpressions = campaigns?.reduce((sum, c) => sum + (Number(c.total_impressions) || 0), 0) || 0;
      const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
      
      // Find most recent active campaign
      const activeCampaignsSorted = campaigns
        ?.filter(c => c.status === "active")
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      
      const lastActiveCampaign = activeCampaignsSorted?.[0];
      
      return {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalSpent,
        totalImpressions,
        avgCPM,
        lastActiveCampaign,
      };
    },
    enabled: !!linkedAdvertisers && linkedAdvertisers.length > 0,
  });

  if (advertisersLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Advertising Overview</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  if (!linkedAdvertisers || linkedAdvertisers.length === 0) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Advertising Overview</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          No advertiser account linked to this contact
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/advertising/advertisers">
            <Plus className="h-4 w-4 mr-2" />
            Create Advertiser Account
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Advertising Overview</h3>
        <Badge variant="secondary" className="ml-auto">
          Advertiser Account Contact
        </Badge>
      </div>

      {/* Advertiser Account Links */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-muted-foreground">Linked Advertiser Accounts</h4>
        {linkedAdvertisers.map((advertiser) => (
          <div key={advertiser.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{advertiser.company_name}</span>
              <Badge variant={advertiser.status === "pending" ? "secondary" : "default"} className="text-xs">
                {advertiser.status}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/admin/advertising/advertisers`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Campaign Summary */}
      {campaignStats && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-muted/30 rounded-md">
              <div className="text-2xl font-bold">{campaignStats.totalCampaigns}</div>
              <div className="text-xs text-muted-foreground">Total Campaigns</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-md">
              <div className="text-2xl font-bold text-green-600">{campaignStats.activeCampaigns}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-md">
              <div className="text-2xl font-bold text-blue-600">{campaignStats.completedCampaigns}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Performance Snapshot */}
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Performance Snapshot</h4>
            
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">Total Spend</span>
              </div>
              <span className="font-semibold">${campaignStats.totalSpent.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Total Impressions</span>
              </div>
              <span className="font-semibold">{campaignStats.totalImpressions.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Avg CPM</span>
              </div>
              <span className="font-semibold">${campaignStats.avgCPM.toFixed(2)}</span>
            </div>

            {campaignStats.lastActiveCampaign && (
              <div className="p-2 bg-primary/10 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Last Active Campaign</div>
                <div className="font-medium">{campaignStats.lastActiveCampaign.name}</div>
                <div className="text-xs text-muted-foreground">
                  Started: {new Date(campaignStats.lastActiveCampaign.start_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/advertising/campaigns/create">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/advertising/advertisers">
              <Building2 className="h-4 w-4 mr-2" />
              View Account
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/campaigns">
              <Eye className="h-4 w-4 mr-2" />
              All Campaigns
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/contacts`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};
