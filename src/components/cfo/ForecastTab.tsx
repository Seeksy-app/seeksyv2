import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ForecastTabProps {
  assumptions: {
    avgSubscriptionPrice: number;
    monthlyUserGrowth: number;
    conversionRate: number;
    churnRate: number;
    hostReadCpm: number;
    announcerReadCpm: number;
    programmaticAudioCpm: number;
    videoAdsCpm: number;
    displayAdsCpm: number;
    creatorPayoutPercent: number;
    aiCostPerEpisode: number;
    storageCostPerGB: number;
    bandwidthCostPerGB: number;
  };
}

export const ForecastTab = ({ assumptions }: ForecastTabProps) => {
  // Market growth assumptions (research-based)
  const marketGrowth = {
    podcasting: 0.22, // 22% CAGR
    creatorEconomy: 0.28, // 28% CAGR
    aiTools: 0.35, // 35% CAGR
    digitalAds: 0.18, // 18% CAGR
  };

  // Calculate 3-year projections using assumptions
  const calculate3YearForecast = () => {
    const years = [2026, 2027, 2028];
    const forecast = [];

    let baseUsers = 50; // Starting users in Q1 2026
    const avgCPM = (assumptions.hostReadCpm + assumptions.announcerReadCpm + assumptions.videoAdsCpm) / 3;

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const growthMultiplier = Math.pow(1 + assumptions.monthlyUserGrowth / 100, 12);
      
      // User growth based on assumptions
      const users = Math.floor(baseUsers * Math.pow(growthMultiplier, i));
      const paidUsers = Math.floor(users * (assumptions.conversionRate / 100));
      
      // Revenue calculations
      const subscriptionRevenue = paidUsers * assumptions.avgSubscriptionPrice * 12;
      
      // Ad revenue (assuming avg 4 episodes/month per creator)
      const avgImpressions = users * 4 * 1000; // 4 episodes * 1000 listeners
      const adRevenue = (avgImpressions * avgCPM / 1000) * 12;
      
      // Total revenue
      const totalRevenue = subscriptionRevenue + adRevenue;
      
      // Cost calculations
      const aiCosts = users * assumptions.aiCostPerEpisode * 4 * 12; // 4 episodes/month
      const storageCosts = users * 50 * assumptions.storageCostPerGB * 12; // 50GB avg per user
      const bandwidthCosts = avgImpressions * 0.5 * assumptions.bandwidthCostPerGB / 1000; // 0.5MB per listen
      const creatorPayouts = adRevenue * (assumptions.creatorPayoutPercent / 100);
      const supportCosts = users * 1.2 * 12; // $1.20/user/month
      const marketingCosts = (users * 0.2) * 45 * 12; // 20% churn replacement * $45 CAC
      
      const totalCosts = aiCosts + storageCosts + bandwidthCosts + creatorPayouts + supportCosts + marketingCosts;
      
      // Margins
      const grossProfit = totalRevenue - creatorPayouts;
      const grossMargin = (grossProfit / totalRevenue) * 100;
      const netProfit = totalRevenue - totalCosts;
      const netMargin = (netProfit / totalRevenue) * 100;
      
      // Metrics
      const arpu = totalRevenue / users / 12;
      const ltv = arpu * (1 / (assumptions.churnRate / 100));
      const cac = 45; // Marketing CAC
      const ltvCacRatio = ltv / cac;
      const paybackMonths = cac / arpu;

      forecast.push({
        year,
        users,
        paidUsers,
        subscriptionRevenue,
        adRevenue,
        totalRevenue,
        aiCosts,
        storageCosts,
        bandwidthCosts,
        creatorPayouts,
        supportCosts,
        marketingCosts,
        totalCosts,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
        arpu,
        ltv,
        cac,
        ltvCacRatio,
        paybackMonths,
      });

      baseUsers = users;
    }

    return forecast;
  };

  const forecast = calculate3YearForecast();

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">3-Year Financial Forecast (2026-2028)</h2>
          <p className="text-muted-foreground mt-1">
            Investment-ready pro forma using your custom assumptions
          </p>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Key Assumptions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Assumptions</CardTitle>
          <CardDescription>These values drive all projections below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Monthly User Growth</span>
              <p className="text-lg font-semibold">{assumptions.monthlyUserGrowth}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <p className="text-lg font-semibold">{assumptions.conversionRate}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Churn Rate</span>
              <p className="text-lg font-semibold">{assumptions.churnRate}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Avg Subscription</span>
              <p className="text-lg font-semibold">${assumptions.avgSubscriptionPrice}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annual Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {forecast.map((year) => (
          <Card key={year.year}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {year.year}
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Annual financial summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <p className="text-2xl font-bold">${Math.round(year.totalRevenue).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Net Profit</span>
                <p className="text-xl font-semibold text-primary">
                  ${Math.round(year.netProfit).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-medium">{year.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid Users</span>
                <span className="font-medium">{year.paidUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Margin</span>
                <Badge variant={year.netMargin > 0 ? "default" : "destructive"}>
                  {year.netMargin.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="margins">Margins & Metrics</TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Annual revenue streams</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Subscription</TableHead>
                    <TableHead className="text-right">Ad Revenue</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.subscriptionRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.adRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Math.round(year.totalRevenue).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Annual operating costs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">AI Processing</TableHead>
                    <TableHead className="text-right">Infrastructure</TableHead>
                    <TableHead className="text-right">Creator Payouts</TableHead>
                    <TableHead className="text-right">Support</TableHead>
                    <TableHead className="text-right">Marketing</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.aiCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.storageCosts + year.bandwidthCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.creatorPayouts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.supportCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.marketingCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Math.round(year.totalCosts).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margins & Metrics */}
        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Margins & Key Metrics</CardTitle>
              <CardDescription>Profitability and unit economics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                    <TableHead className="text-right">Net Margin</TableHead>
                    <TableHead className="text-right">ARPU</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead className="text-right">LTV:CAC</TableHead>
                    <TableHead className="text-right">Payback (mo)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{year.grossMargin.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={year.netMargin > 0 ? "default" : "destructive"}>
                          {year.netMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${year.arpu.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Math.round(year.ltv)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={year.ltvCacRatio >= 3 ? "default" : "secondary"}>
                          {year.ltvCacRatio.toFixed(1)}:1
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {year.paybackMonths.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Growth Context */}
      <Card>
        <CardHeader>
          <CardTitle>Market Growth Context</CardTitle>
          <CardDescription>Industry trends supporting these projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.podcasting * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Podcasting CAGR</p>
              <p className="text-xs text-muted-foreground mt-1">Edison Research 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.creatorEconomy * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Creator Economy</p>
              <p className="text-xs text-muted-foreground mt-1">Goldman Sachs 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.aiTools * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">AI Tools CAGR</p>
              <p className="text-xs text-muted-foreground mt-1">McKinsey 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.digitalAds * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Digital Ad Growth</p>
              <p className="text-xs text-muted-foreground mt-1">eMarketer 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
