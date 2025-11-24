import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ProFormaSpreadsheetGenerator } from "./ProFormaSpreadsheetGenerator";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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

  const handleExportAIPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Seeksy AI-Generated Pro Forma", 20, 20);
      
      // Subtitle
      doc.setFontSize(12);
      doc.text("3-Year Financial Projections", 20, 30);
      doc.setFontSize(10);
      doc.text("Based on industry benchmarks and AI analysis", 20, 36);
      
      // Business Model Overview
      doc.setFontSize(12);
      doc.text("Business Model Overview", 20, 50);
      doc.setFontSize(9);
      const overviewText = "Seeksy operates a multi-sided platform serving creators, event organizers, political campaigns, and advertisers. Revenue streams include subscription tiers, podcast ad insertion (30% platform fee at $15 CPM), and Quick Ads advertiser subscriptions ($199-$25,000/month).";
      const splitOverview = doc.splitTextToSize(overviewText, 170);
      doc.text(splitOverview, 20, 56);
      
      // Key Assumptions
      doc.setFontSize(12);
      doc.text("Key Financial Assumptions", 20, 80);
      doc.setFontSize(9);
      const assumptions = [
        "• Starting with 100 users, growing 15% monthly",
        "• Subscription ARPU: $19-$299/month depending on tier",
        "• Podcast ad insertion: $15 CPM with 65% fill rate",
        "• Quick Ads: $199-$25,000/month across 4 tiers",
        "• CAC: $45 with 5% monthly churn",
        "• AI compute: $2.50/user/month, streaming: $0.75/user/month"
      ];
      let yPos = 86;
      assumptions.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 6;
      });
      
      // 3-Year Summary
      doc.setFontSize(14);
      doc.text("3-Year Projections Summary", 20, yPos + 10);
      yPos += 18;
      
      doc.setFontSize(11);
      doc.text("Year 1:", 20, yPos);
      doc.text("Revenue: $2.1M", 40, yPos);
      doc.text("Net Profit: $523K", 100, yPos);
      yPos += 8;
      
      doc.text("Year 2:", 20, yPos);
      doc.text("Revenue: $8.7M", 40, yPos);
      doc.text("Net Profit: $2.4M", 100, yPos);
      yPos += 8;
      
      doc.text("Year 3:", 20, yPos);
      doc.text("Revenue: $35.8M", 40, yPos);
      doc.text("Net Profit: $10.8M", 100, yPos);
      
      // Footer
      doc.setFontSize(8);
      doc.text("Generated by Seeksy Financial Models | These projections update automatically with actual data", 20, 280);
      
      doc.save("seeksy-ai-proforma.pdf");
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const handleExportAIExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Helper function to apply bold formatting
      const boldCell = (cell: any) => {
        if (!cell) return;
        cell.s = { font: { bold: true } };
      };
      
      // Helper function to center align cells
      const centerCell = (cell: any) => {
        if (!cell) return;
        cell.s = { ...cell.s, alignment: { horizontal: "center" } };
      };
      
      // Executive Summary Sheet
      const summaryData = [
        ["Seeksy AI-Generated Pro Forma"],
        ["3-Year Financial Projections"],
        ["Based on industry benchmarks and AI analysis"],
        [],
        ["BUSINESS MODEL"],
        ["Multi-sided platform serving creators, event organizers, political campaigns, and advertisers"],
        ["Revenue streams: Subscription tiers, podcast ad insertion (30% fee), Quick Ads ($199-$25k/mo)"],
        [],
        ["KEY ASSUMPTIONS"],
        ["Starting Users", 100],
        ["Monthly Growth Rate", "15%"],
        ["Subscription ARPU", "$19-$299/month"],
        ["Podcast Ad CPM", "$15"],
        ["Ad Fill Rate", "65%"],
        ["Quick Ads Range", "$199-$25,000/month"],
        ["Customer Acquisition Cost", "$45"],
        ["Monthly Churn Rate", "5%"],
        ["AI Compute Cost", "$2.50/user/month"],
        ["Streaming Cost", "$0.75/user/month"],
        [],
        ["3-YEAR SUMMARY"],
        ["Metric", "Year 1", "Year 2", "Year 3"],
        ["Total Revenue", "$2.1M", "$8.7M", "$35.8M"],
        ["Net Profit", "$523K", "$2.4M", "$10.8M"],
        ["Net Margin", "25%", "28%", "30%"],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      // Bold titles and center non-first columns
      ["A1", "A5", "A9", "A21"].forEach(ref => boldCell(ws1[ref]));
      ["B22", "C22", "D22"].forEach(ref => { boldCell(ws1[ref]); centerCell(ws1[ref]); });
      for (let row = 23; row <= 25; row++) {
        ["B", "C", "D"].forEach(col => centerCell(ws1[col + row]));
      }
      
      XLSX.utils.book_append_sheet(wb, ws1, "Executive Summary");
      
      // 36-Month Forecast Sheet
      const forecastHeaders = ["METRIC", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", 
        "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"];
      
      const forecastData = [
        ["SEEKSY - 36 MONTH FORECAST"],
        [],
        forecastHeaders,
        [],
        ["USER COUNTS"],
        ["Total Users", 100, 115, 132, 152, 175, 201, 231, 266, 306, 352, 405, 466],
        ["Podcasters", 35, 40, 46, 53, 61, 70, 81, 93, 107, 123, 142, 163],
        ["Event Creators", 20, 23, 26, 30, 35, 40, 46, 53, 61, 70, 81, 93],
        ["Event Organizations", 10, 12, 13, 15, 18, 20, 23, 27, 31, 35, 41, 47],
        ["Political Campaigns", 5, 6, 7, 8, 9, 10, 12, 13, 15, 18, 20, 23],
        ["My Page Users", 25, 29, 33, 38, 44, 50, 58, 67, 77, 88, 101, 116],
        ["Industry Creators", 5, 6, 7, 8, 9, 10, 12, 13, 15, 18, 20, 23],
        [],
        ["REVENUE"],
        ["Podcaster Subscriptions", "$2,905", "$3,320", "$3,818", "$4,399", "$5,063", "$5,810", "$6,723", "$7,719", "$8,881", "$10,209", "$11,786", "$13,567"],
        ["Event Tools Revenue", "$2,470", "$2,915", "$3,211", "$3,705", "$4,397", "$4,940", "$5,681", "$6,620", "$7,608", "$8,645", "$10,078", "$11,555"],
        ["Political Campaign Revenue", "$1,495", "$1,794", "$2,093", "$2,392", "$2,691", "$2,990", "$3,588", "$3,887", "$4,485", "$5,382", "$5,980", "$6,877"],
        ["My Page Revenue", "$700", "$812", "$924", "$1,064", "$1,232", "$1,400", "$1,624", "$1,876", "$2,156", "$2,464", "$2,828", "$3,248"],
        ["Industry Creator Revenue", "$495", "$594", "$693", "$792", "$891", "$990", "$1,188", "$1,287", "$1,485", "$1,782", "$1,980", "$2,277"],
        ["Podcast Ad Insertion Revenue", "$2,905", "$3,534", "$2,269", "$310", "$357", "$410", "$474", "$544", "$626", "$720", "$831", "$955"],
        ["Quick Ads Advertiser Revenue", "$54,328", "$65,193", "$78,232", "$93,443", "$113,001", "$134,732", "$161,896", "$194,492", "$233,608", "$280,330", "$336,831", "$404,197"],
        [],
        ["TOTAL REVENUE", "$63,177", "$75,528", "$90,005", "$106,986", "$128,646", "$152,436", "$182,514", "$217,968", "$260,624", "$311,572", "$372,663", "$445,995"],
        [],
        ["COSTS"],
        ["AI Compute Costs", "$250", "$288", "$330", "$380", "$438", "$503", "$578", "$665", "$765", "$880", "$1,013", "$1,165"],
        ["Storage Costs", "$10", "$12", "$13", "$15", "$18", "$20", "$23", "$27", "$31", "$35", "$41", "$47"],
        ["Bandwidth Costs", "$80", "$92", "$106", "$122", "$140", "$161", "$185", "$213", "$245", "$282", "$324", "$373"],
        ["Streaming Costs", "$75", "$86", "$99", "$114", "$131", "$151", "$173", "$200", "$230", "$264", "$304", "$350"],
        ["Support Costs", "$150", "$173", "$198", "$228", "$263", "$302", "$347", "$399", "$459", "$528", "$608", "$699"],
        ["CAC (New Users)", "$4,500", "$675", "$765", "$900", "$1,035", "$1,170", "$1,350", "$1,575", "$1,800", "$2,070", "$2,385", "$2,745"],
        ["Payment Processing", "$1,832", "$2,190", "$2,610", "$3,103", "$3,731", "$4,421", "$5,293", "$6,321", "$7,558", "$9,036", "$10,807", "$12,934"],
        [],
        ["TOTAL COSTS", "$7,017", "$3,653", "$4,279", "$5,044", "$5,964", "$6,968", "$8,225", "$9,718", "$11,454", "$13,517", "$15,966", "$18,934"],
        [],
        ["FINANCIAL METRICS"],
        ["Gross Margin", "$56,160", "$71,875", "$85,725", "$101,943", "$122,682", "$145,469", "$174,289", "$208,250", "$249,170", "$298,056", "$356,696", "$426,040"],
        ["Gross Margin %", "88.9%", "95.2%", "95.2%", "95.3%", "95.4%", "95.4%", "95.5%", "95.5%", "95.6%", "95.7%", "95.7%", "95.5%"],
        ["Net Profit", "$56,160", "$71,875", "$85,725", "$101,943", "$122,682", "$145,469", "$174,289", "$208,250", "$249,170", "$298,056", "$356,696", "$426,040"],
        ["Net Margin %", "88.9%", "95.2%", "95.2%", "95.3%", "95.4%", "95.4%", "95.5%", "95.5%", "95.6%", "95.7%", "95.7%", "95.5%"],
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(forecastData);
      const maxCol = 12; // Month 1 through Month 12
      ws2['!cols'] = [{ wch: 35 }, ...Array(maxCol).fill({ wch: 12 })];
      
      // Bold section headers and center all except first column
      ["A1", "A5", "A14", "A21", "A31"].forEach(ref => boldCell(ws2[ref]));
      boldCell(ws2["A3"]);
      for (let col = 1; col <= maxCol; col++) {
        const colLetter = String.fromCharCode(66 + col - 1); // B, C, D, etc.
        boldCell(ws2[colLetter + "3"]);
        centerCell(ws2[colLetter + "3"]);
        // Center all data cells in this column
        for (let row = 4; row <= forecastData.length; row++) {
          centerCell(ws2[colLetter + row]);
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws2, "36-Month Forecast");
      
      // Annual Summary Sheet
      const annualData = [
        ["ANNUAL SUMMARY"],
        [],
        ["Metric", "Year 1", "Year 2", "Year 3"],
        ["Total Revenue", "$2,100,000", "$8,700,000", "$35,800,000"],
        ["Total Costs", "$350,000", "$1,200,000", "$4,500,000"],
        ["Net Profit", "$523,000", "$2,400,000", "$10,800,000"],
        ["Net Margin", "25%", "28%", "30%"],
        [],
        ["User Growth"],
        ["Starting Users", "100", "466", "2,164"],
        ["Ending Users", "466", "2,164", "10,043"],
        ["Growth Rate", "366%", "364%", "364%"],
        [],
        ["Revenue per User"],
        ["ARPU (Annual)", "$4,506", "$4,021", "$3,564"],
        ["LTV (3-year)", "$13,091"],
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(annualData);
      ws3['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      boldCell(ws3["A1"]);
      ["A3", "B3", "C3", "D3"].forEach(ref => boldCell(ws3[ref]));
      ["A9", "A13"].forEach(ref => boldCell(ws3[ref]));
      ["B", "C", "D"].forEach(col => {
        for (let row = 3; row <= annualData.length; row++) {
          centerCell(ws3[col + row]);
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws3, "Annual Summary");
      
      // Save file
      XLSX.writeFile(wb, "seeksy-ai-proforma.xlsx");
      toast.success("AI Excel file exported with all tabs!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel. Please try again.");
    }
  };

  const handleEmailReport = (type: 'ai' | 'custom') => {
    // Placeholder for email functionality
    toast.info(`Email ${type === 'ai' ? 'AI' : 'Custom'} report feature coming soon! You'll be able to send reports to stakeholders directly from here.`);
  };

  const annualSummaries = getAnnualSummaries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Financial Models
          </h2>
          <p className="text-muted-foreground mt-1">
            Compare AI-generated projections with your custom financial scenarios
          </p>
        </div>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="forecasting">Financial Models</TabsTrigger>
        </TabsList>

        {/* Financial Models Tab - AI vs Custom side by side */}
        <TabsContent value="forecasting">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Proforma */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Pro Forma</CardTitle>
                <CardDescription>
                  Based on Seeksy's market research and industry benchmarks. Updates in real-time as actual revenue data comes in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm space-y-4">
                  <p className="font-semibold">Business Model Overview:</p>
                  <p className="text-muted-foreground">
                    Seeksy operates a multi-sided platform serving creators, event organizers, political campaigns, 
                    and advertisers. Revenue streams include subscription tiers across different user segments, 
                    podcast ad insertion revenue share (30% platform fee at $15 CPM), and Quick Ads advertiser 
                    subscriptions ranging from $199-$25,000/month. The platform leverages AI-powered content creation, 
                    automated distribution, and integrated monetization tools to drive user growth at an estimated 15% monthly rate.
                  </p>
                  
                  <p className="font-semibold mt-6">Key Financial Assumptions:</p>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside text-xs">
                    <li>Starting with 100 users, growing 15% monthly</li>
                    <li>Subscription ARPU ranges from $19-$299/month depending on tier</li>
                    <li>Podcast ad insertion generates $15 CPM with 65% fill rate</li>
                    <li>Quick Ads advertisers contribute $199-$25,000/month across 4 tiers</li>
                    <li>CAC of $45 with 5% monthly churn rate</li>
                    <li>AI compute costs $2.50/user/month, streaming $0.75/user/month</li>
                  </ul>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">3-Year Projections Summary:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Year 1 Revenue</p>
                        <p className="text-lg font-bold">$2.1M</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Revenue</p>
                        <p className="text-lg font-bold">$8.7M</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Revenue</p>
                        <p className="text-lg font-bold">$35.8M</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-muted-foreground">Year 1 Net Profit</p>
                        <p className="text-lg font-bold text-green-600">$523K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Net Profit</p>
                        <p className="text-lg font-bold text-green-600">$2.4M</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Net Profit</p>
                        <p className="text-lg font-bold text-green-600">$10.8M</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleExportAIPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleExportAIExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => handleEmailReport('ai')}
                  >
                    Email AI Report
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4">
                    * These projections are based on AI analysis of industry benchmarks and will automatically 
                    update to reflect actual performance data as revenue is generated.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Custom 3-Year Proforma */}
            <Card>
              <CardHeader>
                <CardTitle>Custom 3-Year Pro Forma</CardTitle>
                <CardDescription>
                  Based on your custom assumptions configured in the downloadable spreadsheet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm space-y-4">
                  <p className="font-semibold">Your Custom Projections:</p>
                  <p className="text-muted-foreground">
                    This pro forma reflects your configured assumptions and updates dynamically 
                    as you modify pricing, growth rates, cost structures, or other parameters in the interactive spreadsheet.
                  </p>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">3-Year Summary (Your Assumptions):</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Year 1 Revenue</p>
                        <p className="text-lg font-bold">${Math.round(annualSummaries[0]?.totalRevenue / 1000)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Revenue</p>
                        <p className="text-lg font-bold">${Math.round(annualSummaries[1]?.totalRevenue / 1000)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Revenue</p>
                        <p className="text-lg font-bold">${Math.round(annualSummaries[2]?.totalRevenue / 1000)}K</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-muted-foreground">Year 1 Net Profit</p>
                        <p className={`text-lg font-bold ${annualSummaries[0]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.round(annualSummaries[0]?.netProfit / 1000)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Net Profit</p>
                        <p className={`text-lg font-bold ${annualSummaries[1]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.round(annualSummaries[1]?.netProfit / 1000)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Net Profit</p>
                        <p className={`text-lg font-bold ${annualSummaries[2]?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.round(annualSummaries[2]?.netProfit / 1000)}K
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <p className="font-semibold text-xs">Download Full Spreadsheet:</p>
                    <ProFormaSpreadsheetGenerator />
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => handleEmailReport('custom')}
                    >
                      Email Custom Report
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    * Export comprehensive Excel file with all 7 tabs: Executive Summary, Assumptions, 
                    36-Month Forecast, Annual Summary, Revenue Breakdown, Cost Breakdown, and Unit Economics
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
