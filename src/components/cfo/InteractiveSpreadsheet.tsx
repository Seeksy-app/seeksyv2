import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ProFormaSpreadsheetGenerator } from "./ProFormaSpreadsheetGenerator";

interface SpreadsheetAssumptions {
  // Pricing by Product Line
  podcasterBasicPrice: number;
  podcasterProPrice: number;
  podcasterEnterprisePrice: number;
  eventCreatorPrice: number;
  eventOrgPrice: number;
  politicalCampaignPrice: number;
  myPageBasicPrice: number;
  myPageProPrice: number;
  industryCreatorPrice: number;
  
  // Customer Acquisition (Starting Month 1)
  startingPodcasters: number;
  startingEventCreators: number;
  startingEventOrgs: number;
  startingPolitical: number;
  startingMyPage: number;
  startingIndustryCreators: number;
  
  // Monthly Growth Rates (%)
  podcasterGrowthRate: number;
  eventCreatorGrowthRate: number;
  eventOrgGrowthRate: number;
  politicalGrowthRate: number;
  myPageGrowthRate: number;
  industryCreatorGrowthRate: number;
  
  // Tier Distribution (%)
  podcasterBasicPercent: number;
  podcasterProPercent: number;
  podcasterEnterprisePercent: number;
  myPageBasicPercent: number;
  myPageProPercent: number;
  
  // Churn & Retention (%)
  monthlyChurnRate: number;
  
  // Ad Revenue
  avgCPM: number;
  avgEpisodesPerMonth: number;
  avgListenersPerEpisode: number;
  adFillRate: number;
  platformAdRevShare: number; // % kept by platform
  
  // Costs (per user per month unless noted)
  aiComputeCost: number;
  storageCostPerGB: number;
  avgStoragePerUserGB: number;
  bandwidthCostPerGB: number;
  avgBandwidthPerUserGB: number;
  streamingCostPerHour: number;
  avgStreamingHoursPerUser: number;
  supportCostPerUser: number;
  marketingCAC: number;
  paymentProcessingRate: number; // %
  
  // Upsell Assumptions (% per month)
  basicToProUpsellRate: number;
  proToEnterpriseUpsellRate: number;
  
  // Cross-sell (% of podcasters also buying My Page)
  podcasterToMyPageCrossSell: number;
}

export const InteractiveSpreadsheet = () => {
  const [assumptions, setAssumptions] = useState<SpreadsheetAssumptions>({
    // Pricing
    podcasterBasicPrice: 19,
    podcasterProPrice: 49,
    podcasterEnterprisePrice: 199,
    eventCreatorPrice: 29,
    eventOrgPrice: 299,
    politicalCampaignPrice: 499,
    myPageBasicPrice: 9,
    myPageProPrice: 29,
    industryCreatorPrice: 149,
    
    // Starting Customers
    startingPodcasters: 20,
    startingEventCreators: 5,
    startingEventOrgs: 1,
    startingPolitical: 1,
    startingMyPage: 30,
    startingIndustryCreators: 3,
    
    // Growth Rates
    podcasterGrowthRate: 25,
    eventCreatorGrowthRate: 20,
    eventOrgGrowthRate: 15,
    politicalGrowthRate: 10,
    myPageGrowthRate: 30,
    industryCreatorGrowthRate: 15,
    
    // Tier Distribution
    podcasterBasicPercent: 40,
    podcasterProPercent: 45,
    podcasterEnterprisePercent: 15,
    myPageBasicPercent: 70,
    myPageProPercent: 30,
    
    // Churn
    monthlyChurnRate: 5,
    
    // Ad Revenue
    avgCPM: 25,
    avgEpisodesPerMonth: 4,
    avgListenersPerEpisode: 1000,
    adFillRate: 80,
    platformAdRevShare: 30,
    
    // Costs
    aiComputeCost: 2.5,
    storageCostPerGB: 0.023,
    avgStoragePerUserGB: 50,
    bandwidthCostPerGB: 0.05,
    avgBandwidthPerUserGB: 100,
    streamingCostPerHour: 0.15,
    avgStreamingHoursPerUser: 5,
    supportCostPerUser: 1.2,
    marketingCAC: 45,
    paymentProcessingRate: 2.9,
    
    // Upsell/Cross-sell
    basicToProUpsellRate: 2,
    proToEnterpriseUpsellRate: 1,
    podcasterToMyPageCrossSell: 25,
  });

  const updateAssumption = (key: keyof SpreadsheetAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  // Calculate monthly forecast for 36 months (3 years)
  const calculateForecast = () => {
    const months = [];
    
    let podcasters = assumptions.startingPodcasters;
    let eventCreators = assumptions.startingEventCreators;
    let eventOrgs = assumptions.startingEventOrgs;
    let political = assumptions.startingPolitical;
    let myPage = assumptions.startingMyPage;
    let industryCreators = assumptions.startingIndustryCreators;
    
    for (let month = 1; month <= 36; month++) {
      // Apply growth
      const newPodcasters = Math.round(podcasters * (1 + assumptions.podcasterGrowthRate / 100));
      const newEventCreators = Math.round(eventCreators * (1 + assumptions.eventCreatorGrowthRate / 100));
      const newEventOrgs = Math.round(eventOrgs * (1 + assumptions.eventOrgGrowthRate / 100));
      const newPolitical = Math.round(political * (1 + assumptions.politicalGrowthRate / 100));
      const newMyPage = Math.round(myPage * (1 + assumptions.myPageGrowthRate / 100));
      const newIndustryCreators = Math.round(industryCreators * (1 + assumptions.industryCreatorGrowthRate / 100));
      
      // Apply churn
      const churnMultiplier = 1 - (assumptions.monthlyChurnRate / 100);
      podcasters = Math.round(newPodcasters * churnMultiplier);
      eventCreators = Math.round(newEventCreators * churnMultiplier);
      eventOrgs = Math.round(newEventOrgs * churnMultiplier);
      political = Math.round(newPolitical * churnMultiplier);
      myPage = Math.round(newMyPage * churnMultiplier);
      industryCreators = Math.round(newIndustryCreators * churnMultiplier);
      
      // Calculate tier splits
      const podcasterBasic = Math.round(podcasters * (assumptions.podcasterBasicPercent / 100));
      const podcasterPro = Math.round(podcasters * (assumptions.podcasterProPercent / 100));
      const podcasterEnterprise = Math.round(podcasters * (assumptions.podcasterEnterprisePercent / 100));
      const myPageBasic = Math.round(myPage * (assumptions.myPageBasicPercent / 100));
      const myPagePro = Math.round(myPage * (assumptions.myPageProPercent / 100));
      
      // Calculate subscription revenue
      const podcasterRevenue = (
        podcasterBasic * assumptions.podcasterBasicPrice +
        podcasterPro * assumptions.podcasterProPrice +
        podcasterEnterprise * assumptions.podcasterEnterprisePrice
      );
      const eventCreatorRevenue = eventCreators * assumptions.eventCreatorPrice;
      const eventOrgRevenue = eventOrgs * assumptions.eventOrgPrice;
      const politicalRevenue = political * assumptions.politicalCampaignPrice;
      const myPageRevenue = (
        myPageBasic * assumptions.myPageBasicPrice +
        myPagePro * assumptions.myPageProPrice
      );
      const industryCreatorRevenue = industryCreators * assumptions.industryCreatorPrice;
      
      const totalSubscriptionRevenue = (
        podcasterRevenue + eventCreatorRevenue + eventOrgRevenue +
        politicalRevenue + myPageRevenue + industryCreatorRevenue
      );
      
      // Calculate ad revenue
      const totalImpressions = podcasters * assumptions.avgEpisodesPerMonth * assumptions.avgListenersPerEpisode;
      const adRevenueGross = (totalImpressions / 1000) * assumptions.avgCPM * (assumptions.adFillRate / 100);
      const adRevenuePlatform = adRevenueGross * (assumptions.platformAdRevShare / 100);
      const adRevenueToCreators = adRevenueGross - adRevenuePlatform;
      
      // Total revenue
      const totalRevenue = totalSubscriptionRevenue + adRevenuePlatform;
      
      // Calculate costs
      const totalUsers = podcasters + eventCreators + eventOrgs + political + myPage + industryCreators;
      
      const aiCosts = totalUsers * assumptions.aiComputeCost;
      const storageCosts = totalUsers * assumptions.avgStoragePerUserGB * assumptions.storageCostPerGB;
      const bandwidthCosts = totalUsers * assumptions.avgBandwidthPerUserGB * assumptions.bandwidthCostPerGB;
      const streamingCosts = totalUsers * assumptions.avgStreamingHoursPerUser * assumptions.streamingCostPerHour;
      const supportCosts = totalUsers * assumptions.supportCostPerUser;
      
      // Marketing costs (based on new user acquisition)
      const newUsers = month === 1 ? totalUsers : totalUsers - months[month - 2].totalUsers;
      const marketingCosts = newUsers * assumptions.marketingCAC;
      
      // Payment processing
      const paymentProcessingCosts = totalRevenue * (assumptions.paymentProcessingRate / 100);
      
      // Creator payouts
      const creatorPayouts = adRevenueToCreators;
      
      const totalCosts = (
        aiCosts + storageCosts + bandwidthCosts + streamingCosts +
        supportCosts + marketingCosts + paymentProcessingCosts + creatorPayouts
      );
      
      // Margins
      const grossProfit = totalRevenue - creatorPayouts;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfit = totalRevenue - totalCosts;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      months.push({
        month,
        year: 2026 + Math.floor((month - 1) / 12),
        podcasters,
        podcasterBasic,
        podcasterPro,
        podcasterEnterprise,
        eventCreators,
        eventOrgs,
        political,
        myPage,
        myPageBasic,
        myPagePro,
        industryCreators,
        totalUsers,
        podcasterRevenue,
        eventCreatorRevenue,
        eventOrgRevenue,
        politicalRevenue,
        myPageRevenue,
        industryCreatorRevenue,
        totalSubscriptionRevenue,
        adRevenueGross,
        adRevenuePlatform,
        adRevenueToCreators,
        totalRevenue,
        aiCosts,
        storageCosts,
        bandwidthCosts,
        streamingCosts,
        supportCosts,
        marketingCosts,
        paymentProcessingCosts,
        creatorPayouts,
        totalCosts,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
      });
    }
    
    return months;
  };

  const forecast = calculateForecast();

  const exportToCSV = (tabName: string) => {
    let csv = '';
    
    if (tabName === 'assumptions') {
      csv = 'Category,Item,Value,Unit\n';
      csv += 'PRICING,,,,\n';
      csv += 'Pricing,Podcaster Basic,$' + assumptions.podcasterBasicPrice + ',per month\n';
      csv += 'Pricing,Podcaster Pro,$' + assumptions.podcasterProPrice + ',per month\n';
      csv += 'Pricing,Podcaster Enterprise,$' + assumptions.podcasterEnterprisePrice + ',per month\n';
      csv += 'Pricing,Event Creator,$' + assumptions.eventCreatorPrice + ',per month\n';
      csv += 'Pricing,Event Organization,$' + assumptions.eventOrgPrice + ',per month\n';
      csv += 'Pricing,Political Campaign,$' + assumptions.politicalCampaignPrice + ',per month\n';
      csv += 'Pricing,My Page Basic,$' + assumptions.myPageBasicPrice + ',per month\n';
      csv += 'Pricing,My Page Pro,$' + assumptions.myPageProPrice + ',per month\n';
      csv += 'Pricing,Industry Creator,$' + assumptions.industryCreatorPrice + ',per month\n';
      csv += '\nSTARTING CUSTOMERS,,,,\n';
      csv += 'Starting Customers,Podcasters,' + assumptions.startingPodcasters + ',count\n';
      csv += 'Starting Customers,Event Creators,' + assumptions.startingEventCreators + ',count\n';
      csv += 'Starting Customers,Event Orgs,' + assumptions.startingEventOrgs + ',count\n';
      csv += 'Starting Customers,Political,' + assumptions.startingPolitical + ',count\n';
      csv += 'Starting Customers,My Page Users,' + assumptions.startingMyPage + ',count\n';
      csv += 'Starting Customers,Industry Creators,' + assumptions.startingIndustryCreators + ',count\n';
      csv += '\nGROWTH RATES,,,,\n';
      csv += 'Growth Rates,Podcaster,' + assumptions.podcasterGrowthRate + ',%\n';
      csv += 'Growth Rates,Event Creator,' + assumptions.eventCreatorGrowthRate + ',%\n';
      csv += 'Growth Rates,Event Org,' + assumptions.eventOrgGrowthRate + ',%\n';
      csv += 'Growth Rates,Political,' + assumptions.politicalGrowthRate + ',%\n';
      csv += 'Growth Rates,My Page,' + assumptions.myPageGrowthRate + ',%\n';
      csv += 'Growth Rates,Industry Creator,' + assumptions.industryCreatorGrowthRate + ',%\n';
      csv += '\nTIER DISTRIBUTION,,,,\n';
      csv += 'Tiers,Podcaster Basic %,' + assumptions.podcasterBasicPercent + ',%\n';
      csv += 'Tiers,Podcaster Pro %,' + assumptions.podcasterProPercent + ',%\n';
      csv += 'Tiers,Podcaster Enterprise %,' + assumptions.podcasterEnterprisePercent + ',%\n';
      csv += 'Tiers,My Page Basic %,' + assumptions.myPageBasicPercent + ',%\n';
      csv += 'Tiers,My Page Pro %,' + assumptions.myPageProPercent + ',%\n';
      csv += '\nCHURN & RETENTION,,,,\n';
      csv += 'Churn,Monthly Churn Rate,' + assumptions.monthlyChurnRate + ',%\n';
      csv += '\nAD REVENUE,,,,\n';
      csv += 'Ad Revenue,Average CPM,$' + assumptions.avgCPM + ',per thousand\n';
      csv += 'Ad Revenue,Episodes per Month,' + assumptions.avgEpisodesPerMonth + ',count\n';
      csv += 'Ad Revenue,Listeners per Episode,' + assumptions.avgListenersPerEpisode + ',count\n';
      csv += 'Ad Revenue,Ad Fill Rate,' + assumptions.adFillRate + ',%\n';
      csv += 'Ad Revenue,Platform Revenue Share,' + assumptions.platformAdRevShare + ',%\n';
      csv += '\nCOST STRUCTURE,,,,\n';
      csv += 'Costs,AI Compute Cost,$' + assumptions.aiComputeCost + ',per user/month\n';
      csv += 'Costs,Storage Cost per GB,$' + assumptions.storageCostPerGB + ',per GB\n';
      csv += 'Costs,Avg Storage per User,' + assumptions.avgStoragePerUserGB + ',GB\n';
      csv += 'Costs,Bandwidth Cost per GB,$' + assumptions.bandwidthCostPerGB + ',per GB\n';
      csv += 'Costs,Avg Bandwidth per User,' + assumptions.avgBandwidthPerUserGB + ',GB\n';
      csv += 'Costs,Streaming Cost per Hour,$' + assumptions.streamingCostPerHour + ',per hour\n';
      csv += 'Costs,Avg Streaming Hours,' + assumptions.avgStreamingHoursPerUser + ',hours/month\n';
      csv += 'Costs,Support Cost,$' + assumptions.supportCostPerUser + ',per user/month\n';
      csv += 'Costs,Marketing CAC,$' + assumptions.marketingCAC + ',per acquisition\n';
      csv += 'Costs,Payment Processing,' + assumptions.paymentProcessingRate + ',%\n';
    } else if (tabName === 'forecast-summary') {
      // Summary export
      csv = 'Month,Year,Total Users,Podcasters,Event Creators,Event Orgs,Political,My Page,Industry Creators,';
      csv += 'Subscription Revenue,Ad Revenue,Total Revenue,Total Costs,Net Profit,Net Margin %\n';
      
      forecast.forEach(m => {
        csv += `${m.month},${m.year},${m.totalUsers},${m.podcasters},${m.eventCreators},${m.eventOrgs},${m.political},${m.myPage},${m.industryCreators},`;
        csv += `${m.totalSubscriptionRevenue.toFixed(2)},${m.adRevenuePlatform.toFixed(2)},${m.totalRevenue.toFixed(2)},${m.totalCosts.toFixed(2)},${m.netProfit.toFixed(2)},${m.netMargin.toFixed(2)}\n`;
      });
    } else if (tabName === 'forecast-detailed') {
      // Complete detailed export with ALL line items
      csv = 'Month,Year,';
      csv += 'Total Users,Podcasters,Podcaster Basic,Podcaster Pro,Podcaster Enterprise,Event Creators,Event Orgs,Political,My Page Users,My Page Basic,My Page Pro,Industry Creators,';
      csv += 'Podcaster Revenue,Event Creator Revenue,Event Org Revenue,Political Revenue,My Page Revenue,Industry Creator Revenue,Total Subscription Revenue,';
      csv += 'Ad Revenue Gross,Ad Revenue Platform,Ad Revenue to Creators,';
      csv += 'AI Costs,Storage Costs,Bandwidth Costs,Streaming Costs,Support Costs,Marketing Costs,Payment Processing Costs,Creator Payouts,Total Costs,';
      csv += 'Gross Profit,Gross Margin %,Net Profit,Net Margin %\n';
      
      forecast.forEach(m => {
        csv += `${m.month},${m.year},`;
        csv += `${m.totalUsers},${m.podcasters},${m.podcasterBasic},${m.podcasterPro},${m.podcasterEnterprise},${m.eventCreators},${m.eventOrgs},${m.political},${m.myPage},${m.myPageBasic},${m.myPagePro},${m.industryCreators},`;
        csv += `${m.podcasterRevenue.toFixed(2)},${m.eventCreatorRevenue.toFixed(2)},${m.eventOrgRevenue.toFixed(2)},${m.politicalRevenue.toFixed(2)},${m.myPageRevenue.toFixed(2)},${m.industryCreatorRevenue.toFixed(2)},${m.totalSubscriptionRevenue.toFixed(2)},`;
        csv += `${m.adRevenueGross.toFixed(2)},${m.adRevenuePlatform.toFixed(2)},${m.adRevenueToCreators.toFixed(2)},`;
        csv += `${m.aiCosts.toFixed(2)},${m.storageCosts.toFixed(2)},${m.bandwidthCosts.toFixed(2)},${m.streamingCosts.toFixed(2)},${m.supportCosts.toFixed(2)},${m.marketingCosts.toFixed(2)},${m.paymentProcessingCosts.toFixed(2)},${m.creatorPayouts.toFixed(2)},${m.totalCosts.toFixed(2)},`;
        csv += `${m.grossProfit.toFixed(2)},${m.grossMargin.toFixed(2)},${m.netProfit.toFixed(2)},${m.netMargin.toFixed(2)}\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-${tabName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported to CSV successfully`);
  };

  // Calculate annual summaries
  const getAnnualSummaries = () => {
    const years = [2026, 2027, 2028];
    return years.map(year => {
      const yearData = forecast.filter(m => m.year === year);
      return {
        year,
        totalRevenue: yearData.reduce((sum, m) => sum + m.totalRevenue, 0),
        totalCosts: yearData.reduce((sum, m) => sum + m.totalCosts, 0),
        netProfit: yearData.reduce((sum, m) => sum + m.netProfit, 0),
        avgUsers: Math.round(yearData.reduce((sum, m) => sum + m.totalUsers, 0) / yearData.length),
        endUsers: yearData[yearData.length - 1].totalUsers,
      };
    });
  };

  const annualSummaries = getAnnualSummaries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Interactive Pro Forma Spreadsheet
          </h2>
          <p className="text-muted-foreground mt-1">
            Edit assumptions and watch the forecast update in real-time
          </p>
        </div>
      </div>

      <Tabs defaultValue="assumptions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Forecast</TabsTrigger>
          <TabsTrigger value="annual">Annual Summary</TabsTrigger>
          <TabsTrigger value="download">3-Year Download</TabsTrigger>
        </TabsList>

        {/* Assumptions Tab */}
        <TabsContent value="assumptions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => exportToCSV('assumptions')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Assumptions
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing (Monthly)</CardTitle>
                <CardDescription>Revenue per customer per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Podcaster Basic</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.podcasterBasicPrice}
                      onChange={(e) => updateAssumption('podcasterBasicPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Podcaster Pro</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.podcasterProPrice}
                      onChange={(e) => updateAssumption('podcasterProPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Podcaster Enterprise</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.podcasterEnterprisePrice}
                      onChange={(e) => updateAssumption('podcasterEnterprisePrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Event Creator</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.eventCreatorPrice}
                      onChange={(e) => updateAssumption('eventCreatorPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Event Organization</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.eventOrgPrice}
                      onChange={(e) => updateAssumption('eventOrgPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Political Campaign</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.politicalCampaignPrice}
                      onChange={(e) => updateAssumption('politicalCampaignPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">My Page Basic</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.myPageBasicPrice}
                      onChange={(e) => updateAssumption('myPageBasicPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">My Page Pro</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.myPageProPrice}
                      onChange={(e) => updateAssumption('myPageProPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Industry Creator</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.industryCreatorPrice}
                      onChange={(e) => updateAssumption('industryCreatorPrice', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Starting Customers & Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>Starting count and monthly growth rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 items-center text-xs font-medium text-muted-foreground">
                  <span>Segment</span>
                  <span className="text-center">Starting</span>
                  <span className="text-center">Growth %</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">Podcasters</label>
                  <Input
                    type="number"
                    value={assumptions.startingPodcasters}
                    onChange={(e) => updateAssumption('startingPodcasters', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.podcasterGrowthRate}
                    onChange={(e) => updateAssumption('podcasterGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">Event Creators</label>
                  <Input
                    type="number"
                    value={assumptions.startingEventCreators}
                    onChange={(e) => updateAssumption('startingEventCreators', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.eventCreatorGrowthRate}
                    onChange={(e) => updateAssumption('eventCreatorGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">Event Orgs</label>
                  <Input
                    type="number"
                    value={assumptions.startingEventOrgs}
                    onChange={(e) => updateAssumption('startingEventOrgs', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.eventOrgGrowthRate}
                    onChange={(e) => updateAssumption('eventOrgGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">Political</label>
                  <Input
                    type="number"
                    value={assumptions.startingPolitical}
                    onChange={(e) => updateAssumption('startingPolitical', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.politicalGrowthRate}
                    onChange={(e) => updateAssumption('politicalGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">My Page</label>
                  <Input
                    type="number"
                    value={assumptions.startingMyPage}
                    onChange={(e) => updateAssumption('startingMyPage', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.myPageGrowthRate}
                    onChange={(e) => updateAssumption('myPageGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm">Industry Creators</label>
                  <Input
                    type="number"
                    value={assumptions.startingIndustryCreators}
                    onChange={(e) => updateAssumption('startingIndustryCreators', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={assumptions.industryCreatorGrowthRate}
                    onChange={(e) => updateAssumption('industryCreatorGrowthRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ad Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Ad Revenue</CardTitle>
                <CardDescription>Monetization through advertising</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Average CPM</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.avgCPM}
                      onChange={(e) => updateAssumption('avgCPM', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Episodes/Month</label>
                  <Input
                    type="number"
                    value={assumptions.avgEpisodesPerMonth}
                    onChange={(e) => updateAssumption('avgEpisodesPerMonth', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Listeners/Episode</label>
                  <Input
                    type="number"
                    value={assumptions.avgListenersPerEpisode}
                    onChange={(e) => updateAssumption('avgListenersPerEpisode', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Ad Fill Rate %</label>
                  <Input
                    type="number"
                    value={assumptions.adFillRate}
                    onChange={(e) => updateAssumption('adFillRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Platform Rev Share %</label>
                  <Input
                    type="number"
                    value={assumptions.platformAdRevShare}
                    onChange={(e) => updateAssumption('platformAdRevShare', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Structure</CardTitle>
                <CardDescription>Per user per month unless noted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">AI Compute</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={assumptions.aiComputeCost}
                      onChange={(e) => updateAssumption('aiComputeCost', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Storage $/GB</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      step="0.001"
                      value={assumptions.storageCostPerGB}
                      onChange={(e) => updateAssumption('storageCostPerGB', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Avg Storage GB</label>
                  <Input
                    type="number"
                    value={assumptions.avgStoragePerUserGB}
                    onChange={(e) => updateAssumption('avgStoragePerUserGB', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Bandwidth $/GB</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={assumptions.bandwidthCostPerGB}
                      onChange={(e) => updateAssumption('bandwidthCostPerGB', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Streaming $/Hour</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={assumptions.streamingCostPerHour}
                      onChange={(e) => updateAssumption('streamingCostPerHour', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Support Cost</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={assumptions.supportCostPerUser}
                      onChange={(e) => updateAssumption('supportCostPerUser', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Marketing CAC</label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={assumptions.marketingCAC}
                      onChange={(e) => updateAssumption('marketingCAC', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Payment Processing %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={assumptions.paymentProcessingRate}
                    onChange={(e) => updateAssumption('paymentProcessingRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Monthly Churn %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={assumptions.monthlyChurnRate}
                    onChange={(e) => updateAssumption('monthlyChurnRate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Forecast Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => exportToCSV('forecast-summary')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Summary
            </Button>
            <Button onClick={() => exportToCSV('forecast-detailed')} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All Details
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>36-Month Detailed Forecast</CardTitle>
              <CardDescription>Scroll horizontally to see all columns • All line items included</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 sticky left-0 bg-background z-10">Mo</TableHead>
                      <TableHead className="w-16">Year</TableHead>
                      <TableHead colSpan={7} className="text-center bg-muted/50">Customer Counts</TableHead>
                      <TableHead colSpan={7} className="text-center bg-blue-50 dark:bg-blue-950">Revenue Streams</TableHead>
                      <TableHead colSpan={8} className="text-center bg-orange-50 dark:bg-orange-950">Cost Breakdown</TableHead>
                      <TableHead colSpan={4} className="text-center bg-green-50 dark:bg-green-950">Margins & Profit</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">Mo</TableHead>
                      <TableHead>Year</TableHead>
                      {/* Customer Counts */}
                      <TableHead>Total</TableHead>
                      <TableHead>Podcasters</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Orgs</TableHead>
                      <TableHead>Political</TableHead>
                      <TableHead>My Page</TableHead>
                      <TableHead>Industry</TableHead>
                      {/* Revenue */}
                      <TableHead>Podcaster</TableHead>
                      <TableHead>Event Creator</TableHead>
                      <TableHead>Event Org</TableHead>
                      <TableHead>Political</TableHead>
                      <TableHead>My Page</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Ad Rev</TableHead>
                      {/* Costs */}
                      <TableHead>AI</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Bandwidth</TableHead>
                      <TableHead>Streaming</TableHead>
                      <TableHead>Support</TableHead>
                      <TableHead>Marketing</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Creator Pay</TableHead>
                      {/* Margins */}
                      <TableHead>Total Rev</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Net Profit</TableHead>
                      <TableHead>Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="sticky left-0 bg-background font-medium z-10">{m.month}</TableCell>
                        <TableCell>{m.year}</TableCell>
                        {/* Customers */}
                        <TableCell>{m.totalUsers}</TableCell>
                        <TableCell>{m.podcasters}</TableCell>
                        <TableCell>{m.eventCreators}</TableCell>
                        <TableCell>{m.eventOrgs}</TableCell>
                        <TableCell>{m.political}</TableCell>
                        <TableCell>{m.myPage}</TableCell>
                        <TableCell>{m.industryCreators}</TableCell>
                        {/* Revenue */}
                        <TableCell>${Math.round(m.podcasterRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.eventCreatorRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.eventOrgRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.politicalRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.myPageRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.industryCreatorRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.adRevenuePlatform).toLocaleString()}</TableCell>
                        {/* Costs */}
                        <TableCell>${Math.round(m.aiCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.storageCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.bandwidthCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.streamingCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.supportCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.marketingCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.paymentProcessingCosts).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.creatorPayouts).toLocaleString()}</TableCell>
                        {/* Margins */}
                        <TableCell className="font-semibold">${Math.round(m.totalRevenue).toLocaleString()}</TableCell>
                        <TableCell>${Math.round(m.totalCosts).toLocaleString()}</TableCell>
                        <TableCell className={m.netProfit >= 0 ? "text-primary font-semibold" : "text-destructive"}>
                          ${Math.round(m.netProfit).toLocaleString()}
                        </TableCell>
                        <TableCell>{m.netMargin.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Summary Tab */}
        <TabsContent value="annual" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {annualSummaries.map((year) => (
              <Card key={year.year}>
                <CardHeader>
                  <CardTitle>{year.year}</CardTitle>
                  <CardDescription>Annual Performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <p className="text-2xl font-bold">${Math.round(year.totalRevenue).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Costs</span>
                    <p className="text-xl">${Math.round(year.totalCosts).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Net Profit</span>
                    <p className={`text-xl font-semibold ${year.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      ${Math.round(year.netProfit).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Users (Avg)</span>
                    <p className="text-lg">{year.avgUsers.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Users (End)</span>
                    <p className="text-lg">{year.endUsers.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>3-Year Summary Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Total Costs</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Avg Users</TableHead>
                    <TableHead className="text-right">End Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annualSummaries.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">${Math.round(year.totalRevenue).toLocaleString()}</TableCell>
                      <TableCell className="text-right">${Math.round(year.totalCosts).toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${year.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        ${Math.round(year.netProfit).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{year.avgUsers.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{year.endUsers.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3-Year Download Tab */}
        <TabsContent value="download" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download Full 3-Year Pro Forma Spreadsheet</CardTitle>
              <CardDescription>
                Export comprehensive Excel file with all 7 tabs: Executive Summary, Assumptions, 36-Month Forecast, 
                Annual Summary, Revenue Breakdown, Cost Breakdown, and Unit Economics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProFormaSpreadsheetGenerator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
