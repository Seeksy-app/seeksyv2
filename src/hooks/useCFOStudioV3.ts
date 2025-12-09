import { useState, useCallback, useMemo } from 'react';

export type ForecastMode = 'custom' | 'ai' | 'hybrid';

export interface YearlyValues {
  year1: number;
  year2: number;
  year3: number;
}

export interface RevenueModel {
  subscriptions: YearlyValues;
  aiTools: YearlyValues;
  advertising: YearlyValues;
  enterprise: YearlyValues;
  enterpriseEnabled: boolean;
}

export interface COGSModel {
  hostingAI: YearlyValues;
  videoProcessing: YearlyValues;
  paymentFees: YearlyValues;
}

export interface OpExModel {
  productEngineering: YearlyValues;
  salesMarketing: YearlyValues;
  gna: YearlyValues;
  customerSuccess: YearlyValues;
  contractors: YearlyValues;
}

export interface HeadcountRow {
  department: string;
  year1Count: number;
  year2Count: number;
  year3Count: number;
  avgSalary: number;
}

export interface Assumptions {
  revenueGrowth: number;
  churnRate: number;
  pricingGrowth: number;
  cogsPercent: number;
  headcountGrowth: number;
  salaryGrowth: number;
  cacCost: number;
  ltvMonths: number;
}

export interface CFOStudioV3State {
  forecastMode: ForecastMode;
  revenue: RevenueModel;
  cogs: COGSModel;
  opex: OpExModel;
  headcount: HeadcountRow[];
  assumptions: Assumptions;
}

const defaultState: CFOStudioV3State = {
  forecastMode: 'custom',
  revenue: {
    subscriptions: { year1: 480000, year2: 1200000, year3: 2880000 },
    aiTools: { year1: 120000, year2: 360000, year3: 840000 },
    advertising: { year1: 60000, year2: 240000, year3: 720000 },
    enterprise: { year1: 0, year2: 100000, year3: 400000 },
    enterpriseEnabled: true,
  },
  cogs: {
    hostingAI: { year1: 72000, year2: 180000, year3: 360000 },
    videoProcessing: { year1: 24000, year2: 60000, year3: 120000 },
    paymentFees: { year1: 19800, year2: 57000, year3: 145200 },
  },
  opex: {
    productEngineering: { year1: 360000, year2: 720000, year3: 1200000 },
    salesMarketing: { year1: 180000, year2: 480000, year3: 960000 },
    gna: { year1: 120000, year2: 240000, year3: 360000 },
    customerSuccess: { year1: 60000, year2: 180000, year3: 360000 },
    contractors: { year1: 48000, year2: 96000, year3: 144000 },
  },
  headcount: [
    { department: 'Engineering', year1Count: 4, year2Count: 8, year3Count: 14, avgSalary: 150000 },
    { department: 'Product', year1Count: 1, year2Count: 2, year3Count: 4, avgSalary: 140000 },
    { department: 'Sales', year1Count: 2, year2Count: 5, year3Count: 10, avgSalary: 120000 },
    { department: 'Marketing', year1Count: 1, year2Count: 3, year3Count: 6, avgSalary: 110000 },
    { department: 'Customer Success', year1Count: 1, year2Count: 3, year3Count: 6, avgSalary: 80000 },
    { department: 'G&A', year1Count: 1, year2Count: 2, year3Count: 3, avgSalary: 100000 },
  ],
  assumptions: {
    revenueGrowth: 150,
    churnRate: 5,
    pricingGrowth: 10,
    cogsPercent: 18,
    headcountGrowth: 80,
    salaryGrowth: 5,
    cacCost: 500,
    ltvMonths: 24,
  },
};

export function useCFOStudioV3() {
  const [state, setState] = useState<CFOStudioV3State>(defaultState);

  const setForecastMode = useCallback((mode: ForecastMode) => {
    setState(prev => ({ ...prev, forecastMode: mode }));
  }, []);

  const updateRevenue = useCallback((key: keyof RevenueModel, value: any) => {
    setState(prev => ({
      ...prev,
      revenue: { ...prev.revenue, [key]: value },
    }));
  }, []);

  const updateCOGS = useCallback((key: keyof COGSModel, value: YearlyValues) => {
    setState(prev => ({
      ...prev,
      cogs: { ...prev.cogs, [key]: value },
    }));
  }, []);

  const updateOpEx = useCallback((key: keyof OpExModel, value: YearlyValues) => {
    setState(prev => ({
      ...prev,
      opex: { ...prev.opex, [key]: value },
    }));
  }, []);

  const updateHeadcount = useCallback((index: number, row: HeadcountRow) => {
    setState(prev => {
      const newHeadcount = [...prev.headcount];
      newHeadcount[index] = row;
      return { ...prev, headcount: newHeadcount };
    });
  }, []);

  const updateAssumptions = useCallback((key: keyof Assumptions, value: number) => {
    setState(prev => ({
      ...prev,
      assumptions: { ...prev.assumptions, [key]: value },
    }));
  }, []);

  // Calculated metrics
  const metrics = useMemo(() => {
    const { revenue, cogs, opex } = state;
    
    const totalRevenue = (year: 'year1' | 'year2' | 'year3') => {
      let total = revenue.subscriptions[year] + revenue.aiTools[year] + revenue.advertising[year];
      if (revenue.enterpriseEnabled) total += revenue.enterprise[year];
      return total;
    };

    const totalCOGS = (year: 'year1' | 'year2' | 'year3') => 
      cogs.hostingAI[year] + cogs.videoProcessing[year] + cogs.paymentFees[year];

    const totalOpEx = (year: 'year1' | 'year2' | 'year3') =>
      opex.productEngineering[year] + opex.salesMarketing[year] + opex.gna[year] + 
      opex.customerSuccess[year] + opex.contractors[year];

    const rev1 = totalRevenue('year1');
    const rev2 = totalRevenue('year2');
    const rev3 = totalRevenue('year3');
    
    const cogs1 = totalCOGS('year1');
    const cogs2 = totalCOGS('year2');
    const cogs3 = totalCOGS('year3');
    
    const opex1 = totalOpEx('year1');
    const opex2 = totalOpEx('year2');
    const opex3 = totalOpEx('year3');

    const grossProfit1 = rev1 - cogs1;
    const grossProfit2 = rev2 - cogs2;
    const grossProfit3 = rev3 - cogs3;

    const grossMargin1 = rev1 > 0 ? (grossProfit1 / rev1) * 100 : 0;
    const grossMargin2 = rev2 > 0 ? (grossProfit2 / rev2) * 100 : 0;
    const grossMargin3 = rev3 > 0 ? (grossProfit3 / rev3) * 100 : 0;

    const ebitda1 = grossProfit1 - opex1;
    const ebitda2 = grossProfit2 - opex2;
    const ebitda3 = grossProfit3 - opex3;

    const arr = rev3; // Year 3 ARR
    const cac = state.assumptions.cacCost;
    const arpu = revenue.subscriptions.year3 / 1000; // Simplified ARPU calculation
    const ltv = arpu * state.assumptions.ltvMonths;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    
    const monthlyBurn = ebitda1 < 0 ? Math.abs(ebitda1) / 12 : 0;
    const cashOnHand = 2000000; // Assumed starting cash
    const runway = monthlyBurn > 0 ? Math.floor(cashOnHand / monthlyBurn) : 36;
    
    // Find breakeven month
    let breakevenMonth = 0;
    const monthlyRevGrowth = Math.pow(rev3 / rev1, 1/36);
    const monthlyOpExGrowth = Math.pow(opex3 / opex1, 1/36);
    const monthlyCOGSGrowth = Math.pow(cogs3 / cogs1, 1/36);
    
    let cumRev = rev1 / 12;
    let cumOpEx = opex1 / 12;
    let cumCOGS = cogs1 / 12;
    
    for (let m = 1; m <= 36; m++) {
      cumRev *= monthlyRevGrowth;
      cumOpEx *= monthlyOpExGrowth;
      cumCOGS *= monthlyCOGSGrowth;
      if (cumRev - cumCOGS - cumOpEx > 0 && breakevenMonth === 0) {
        breakevenMonth = m;
        break;
      }
    }

    return {
      arr,
      cac,
      ltv,
      ltvCacRatio,
      grossMargin: grossMargin3,
      burnRate: monthlyBurn,
      runway,
      breakevenMonth: breakevenMonth || 'N/A',
      revenue: { year1: rev1, year2: rev2, year3: rev3 },
      cogs: { year1: cogs1, year2: cogs2, year3: cogs3 },
      grossProfit: { year1: grossProfit1, year2: grossProfit2, year3: grossProfit3 },
      grossMargins: { year1: grossMargin1, year2: grossMargin2, year3: grossMargin3 },
      opex: { year1: opex1, year2: opex2, year3: opex3 },
      ebitda: { year1: ebitda1, year2: ebitda2, year3: ebitda3 },
    };
  }, [state]);

  return {
    state,
    metrics,
    setForecastMode,
    updateRevenue,
    updateCOGS,
    updateOpEx,
    updateHeadcount,
    updateAssumptions,
  };
}
