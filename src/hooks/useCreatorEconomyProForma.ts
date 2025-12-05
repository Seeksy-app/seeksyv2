import { useState, useMemo, useCallback } from "react";

export interface CreatorEconomyAssumptions {
  // Market growth rates (AI-generated from industry research)
  podcastingGrowthRate: number; // 22% CAGR
  creatorEconomyGrowthRate: number; // 28% CAGR
  aiToolsAdoptionRate: number; // 35% CAGR
  digitalAdGrowthRate: number; // 18% CAGR
  
  // User acquisition
  startingPodcasters: number;
  startingCreators: number;
  monthlyGrowthRate: number;
  churnRate: number;
  
  // Pricing
  basicPlanPrice: number;
  proPlanPrice: number;
  enterprisePlanPrice: number;
  avgCPM: number;
  adRevShare: number;
  
  // Cost structure
  aiComputeCostPerUser: number;
  storageCostPerGB: number;
  avgStoragePerUser: number;
  supportCostPerUser: number;
  marketingCAC: number;
}

export interface CreatorEconomyFinancialData {
  years: string[];
  revenue: number[];
  expenses: number[];
  ebitda: number[];
  users: number[];
  arpu: number[];
  adRevenue: number[];
  subscriptionRevenue: number[];
}

// AI-Generated baseline assumptions based on creator economy research
const aiGeneratedBaseline: CreatorEconomyAssumptions = {
  podcastingGrowthRate: 0.22,
  creatorEconomyGrowthRate: 0.28,
  aiToolsAdoptionRate: 0.35,
  digitalAdGrowthRate: 0.18,
  
  startingPodcasters: 500,
  startingCreators: 1500,
  monthlyGrowthRate: 0.12, // 12% month-over-month
  churnRate: 0.05, // 5% monthly churn
  
  basicPlanPrice: 19,
  proPlanPrice: 49,
  enterprisePlanPrice: 199,
  avgCPM: 25,
  adRevShare: 0.30, // Platform keeps 30%
  
  aiComputeCostPerUser: 2.50,
  storageCostPerGB: 0.023,
  avgStoragePerUser: 50,
  supportCostPerUser: 1.20,
  marketingCAC: 45,
};

export function useCreatorEconomyProForma() {
  const [adjustmentPercent, setAdjustmentPercent] = useState(0); // -20% to +20%
  
  const adjustedAssumptions = useMemo((): CreatorEconomyAssumptions => {
    const multiplier = 1 + (adjustmentPercent / 100);
    
    return {
      ...aiGeneratedBaseline,
      startingPodcasters: Math.round(aiGeneratedBaseline.startingPodcasters * multiplier),
      startingCreators: Math.round(aiGeneratedBaseline.startingCreators * multiplier),
      monthlyGrowthRate: aiGeneratedBaseline.monthlyGrowthRate * multiplier,
    };
  }, [adjustmentPercent]);

  const calculateFinancials = useCallback((assumptions: CreatorEconomyAssumptions): CreatorEconomyFinancialData => {
    const years = ["2026", "2027", "2028"];
    const monthsPerYear = 12;
    
    const yearlyData = years.map((year, yearIndex) => {
      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalAdRevenue = 0;
      let totalSubscriptionRevenue = 0;
      let endOfYearUsers = 0;
      
      // Starting users for each year
      let podcasters = assumptions.startingPodcasters * Math.pow(2.5, yearIndex);
      let creators = assumptions.startingCreators * Math.pow(2.5, yearIndex);
      
      for (let month = 0; month < monthsPerYear; month++) {
        // Apply growth and churn
        const growthMultiplier = 1 + assumptions.monthlyGrowthRate;
        const retentionMultiplier = 1 - assumptions.churnRate;
        
        podcasters = Math.floor(podcasters * growthMultiplier * retentionMultiplier);
        creators = Math.floor(creators * growthMultiplier * retentionMultiplier);
        
        const totalUsers = podcasters + creators;
        endOfYearUsers = totalUsers;
        
        // Subscription revenue (tiered distribution)
        const basicUsers = Math.floor(totalUsers * 0.50);
        const proUsers = Math.floor(totalUsers * 0.35);
        const enterpriseUsers = Math.floor(totalUsers * 0.15);
        
        const monthlySubRevenue = 
          (basicUsers * assumptions.basicPlanPrice) +
          (proUsers * assumptions.proPlanPrice) +
          (enterpriseUsers * assumptions.enterprisePlanPrice);
        
        totalSubscriptionRevenue += monthlySubRevenue;
        
        // Ad revenue (podcasters who monetize)
        const monetizingPodcasters = Math.floor(podcasters * 0.40);
        const avgMonthlyDownloads = 15000 * (1 + yearIndex * 0.25); // Grows with platform maturity
        const adSlots = 2.5;
        const grossAdRevenue = (monetizingPodcasters * avgMonthlyDownloads * adSlots * (assumptions.avgCPM / 1000));
        const platformAdRevenue = grossAdRevenue * assumptions.adRevShare;
        
        totalAdRevenue += platformAdRevenue;
        totalRevenue += monthlySubRevenue + platformAdRevenue;
        
        // Expenses
        const aiCosts = totalUsers * assumptions.aiComputeCostPerUser;
        const storageCosts = totalUsers * assumptions.avgStoragePerUser * assumptions.storageCostPerGB;
        const supportCosts = totalUsers * assumptions.supportCostPerUser;
        const acquisitionCosts = (podcasters + creators) * 0.05 * assumptions.marketingCAC; // 5% new user rate
        const platformFees = (monthlySubRevenue + platformAdRevenue) * 0.029;
        const overhead = (aiCosts + storageCosts + supportCosts) * 0.15;
        
        totalExpenses += aiCosts + storageCosts + supportCosts + acquisitionCosts + platformFees + overhead;
      }
      
      return {
        revenue: Math.round(totalRevenue),
        expenses: Math.round(totalExpenses),
        ebitda: Math.round(totalRevenue - totalExpenses),
        users: endOfYearUsers,
        arpu: Math.round((totalRevenue / (endOfYearUsers * monthsPerYear)) * 100) / 100,
        adRevenue: Math.round(totalAdRevenue),
        subscriptionRevenue: Math.round(totalSubscriptionRevenue),
      };
    });
    
    return {
      years,
      revenue: yearlyData.map(d => d.revenue),
      expenses: yearlyData.map(d => d.expenses),
      ebitda: yearlyData.map(d => d.ebitda),
      users: yearlyData.map(d => d.users),
      arpu: yearlyData.map(d => d.arpu),
      adRevenue: yearlyData.map(d => d.adRevenue),
      subscriptionRevenue: yearlyData.map(d => d.subscriptionRevenue),
    };
  }, []);

  const financialData = useMemo(
    () => calculateFinancials(adjustedAssumptions),
    [adjustedAssumptions, calculateFinancials]
  );

  const updateAdjustment = useCallback((percent: number) => {
    setAdjustmentPercent(Math.max(-20, Math.min(20, percent)));
  }, []);

  return {
    financialData,
    assumptions: adjustedAssumptions,
    baselineAssumptions: aiGeneratedBaseline,
    adjustmentPercent,
    updateAdjustment,
  };
}
