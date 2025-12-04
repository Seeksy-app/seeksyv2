import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Users, BarChart2 } from "lucide-react";

export default function MarketIntelligence() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">Industry insights and competitive analysis</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator Economy</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$104B</div>
            <p className="text-xs text-muted-foreground">2024 Market Size</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Podcast Industry</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$23.6B</div>
            <p className="text-xs text-muted-foreground">Projected 2025</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50M+</div>
            <p className="text-xs text-muted-foreground">Globally</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Spend Growth</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+26%</div>
            <p className="text-xs text-muted-foreground">YoY Increase</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competitive Landscape</CardTitle>
          <CardDescription>Key competitors and market positioning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Riverside.fm</p>
                <p className="text-sm text-muted-foreground">Recording & Editing Platform</p>
              </div>
              <Badge>Primary Competitor</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Restream</p>
                <p className="text-sm text-muted-foreground">Live Streaming Platform</p>
              </div>
              <Badge variant="outline">Streaming Focus</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Buzzsprout</p>
                <p className="text-sm text-muted-foreground">Podcast Hosting</p>
              </div>
              <Badge variant="outline">Hosting Only</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}