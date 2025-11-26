import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, TrendingUp, DollarSign, Eye, Users } from "lucide-react";

export default function AdvertisingManagement() {
  const campaigns = [
    { id: 1, name: "Summer 2024 Campaign", advertiser: "Acme Corp", budget: "$10,000", spent: "$7,200", impressions: "125K", status: "active" },
    { id: 2, name: "Product Launch Q1", advertiser: "TechStart", budget: "$15,000", spent: "$15,000", impressions: "200K", status: "completed" },
    { id: 3, name: "Brand Awareness", advertiser: "Global Solutions", budget: "$25,000", spent: "$12,500", impressions: "180K", status: "active" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Advertising Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Oversee ad campaigns and advertiser accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Manage Advertisers</Button>
          <Button>Create Campaign</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">24</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Advertisers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">18</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">$156K</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">2.4M</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {campaign.advertiser}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold">{campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Spent</p>
                    <p className="font-semibold">{campaign.spent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {campaign.impressions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active">
          <p className="text-muted-foreground text-center py-8">Active campaigns will appear here</p>
        </TabsContent>

        <TabsContent value="paused">
          <p className="text-muted-foreground text-center py-8">Paused campaigns will appear here</p>
        </TabsContent>

        <TabsContent value="completed">
          <p className="text-muted-foreground text-center py-8">Completed campaigns will appear here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
