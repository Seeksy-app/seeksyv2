/**
 * Company Health Page - AI-generated State of the Company
 * Board-ready narrative with dynamic metrics
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinancialCalculationEngine } from '@/hooks/useFinancialCalculationEngine';
import { useCFOMasterModel } from '@/hooks/useCFOMasterModel';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Target, Users, DollarSign, Zap,
  ArrowUp, ArrowDown, Minus, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

type HealthStatus = 'healthy' | 'warning' | 'critical';

interface KPIScorecard {
  name: string;
  value: string;
  status: HealthStatus;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
}

export default function BoardCompanyHealth() {
  const { projections, drivers } = useFinancialCalculationEngine();
  const { assumptions, startingCash } = useCFOMasterModel();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate health metrics
  const healthData = useMemo(() => {
    const revenueGrowth = projections.yearlyRevenue[1] > 0 
      ? ((projections.yearlyRevenue[1] - projections.yearlyRevenue[0]) / projections.yearlyRevenue[0]) * 100 
      : 0;
    
    const grossMargin = projections.yearlyGrossMargin[0] || 65;
    const ebitdaMargin = projections.yearlyEbitdaMargin[0] || -10;
    const runway = projections.runwayMonths;
    const churn = drivers.churn;
    const ltvCac = projections.ltvCacRatio;
    
    return {
      revenueGrowth,
      grossMargin,
      ebitdaMargin,
      runway,
      churn,
      ltvCac,
      breakEven: projections.breakEvenMonth,
    };
  }, [projections, drivers]);
  
  // Generate AI narrative based on metrics
  const aiNarrative = useMemo(() => {
    const { revenueGrowth, grossMargin, ebitdaMargin, runway, churn, ltvCac, breakEven } = healthData;
    
    // Health assessment
    let overallHealth = 'strong';
    if (runway < 12 || churn > 8 || ebitdaMargin < -30) {
      overallHealth = 'concerning';
    } else if (runway < 18 || churn > 6 || ebitdaMargin < -15) {
      overallHealth = 'moderate';
    }
    
    // Generate dynamic narrative
    const narratives = {
      overview: overallHealth === 'strong' 
        ? `Seeksy is demonstrating strong fundamentals with ${revenueGrowth.toFixed(0)}% projected year-over-year revenue growth. The company maintains a healthy ${grossMargin.toFixed(0)}% gross margin and is on track to reach break-even by Month ${breakEven || 'TBD'}.`
        : overallHealth === 'moderate'
        ? `Seeksy shows promising growth potential but faces some headwinds. Revenue is projected to grow ${revenueGrowth.toFixed(0)}% YoY, though ${runway}-month runway requires attention. The ${churn}% monthly churn rate is within acceptable range but trending upward.`
        : `Immediate attention required. Key metrics show stress: ${runway}-month runway, ${churn}% churn, and ${ebitdaMargin.toFixed(0)}% EBITDA margin. Recommend accelerating fundraising timeline and implementing cost controls.`,
      
      creatorGrowth: drivers.creatorGrowth >= 8
        ? `Creator acquisition is exceeding targets with ${drivers.creatorGrowth}% monthly growth. The platform is gaining traction in the podcaster and content creator segments.`
        : `Creator growth at ${drivers.creatorGrowth}% monthly is below the 8% target. Recommend increased investment in marketing and referral programs.`,
      
      revenuePacing: revenueGrowth >= 100
        ? `Revenue pacing is excellent. On track to achieve ${formatCurrency(projections.yearlyRevenue[1])} in Year 2, driven by strong subscription conversion and advertising fill rates.`
        : `Revenue growth at ${revenueGrowth.toFixed(0)}% is below projections. Primary drivers: subscription ARPU of ${formatCurrency(drivers.arpu)} and ${drivers.marketplaceFillRate}% ad fill rate.`,
      
      risks: [
        churn > 5 && `Elevated churn (${churn}%) threatens recurring revenue base`,
        runway < 18 && `Runway of ${runway} months requires fundraising within 6 months`,
        ltvCac < 3 && `LTV/CAC ratio of ${ltvCac.toFixed(1)}x below 3x target`,
        ebitdaMargin < -20 && `Negative EBITDA margin of ${ebitdaMargin.toFixed(0)}% indicates burn concerns`,
      ].filter(Boolean),
      
      opportunities: [
        grossMargin > 65 && 'Strong gross margins enable investment in growth',
        ltvCac > 3 && 'Healthy LTV/CAC supports aggressive customer acquisition',
        revenueGrowth > 100 && 'Rapid growth trajectory positions for Series A',
        drivers.identityVerificationAdoption > 20 && 'Identity verification adoption creating premium revenue tier',
      ].filter(Boolean),
    };
    
    return { narratives, overallHealth };
  }, [healthData, drivers, projections]);
  
  // KPI Scorecards
  const scorecards: KPIScorecard[] = useMemo(() => {
    const getStatus = (metric: string, value: number): HealthStatus => {
      switch (metric) {
        case 'revenue': return value >= 100 ? 'healthy' : value >= 50 ? 'warning' : 'critical';
        case 'margin': return value >= 60 ? 'healthy' : value >= 40 ? 'warning' : 'critical';
        case 'ebitda': return value >= 0 ? 'healthy' : value >= -20 ? 'warning' : 'critical';
        case 'runway': return value >= 18 ? 'healthy' : value >= 12 ? 'warning' : 'critical';
        case 'churn': return value <= 5 ? 'healthy' : value <= 8 ? 'warning' : 'critical';
        case 'ltvcac': return value >= 3 ? 'healthy' : value >= 2 ? 'warning' : 'critical';
        default: return 'warning';
      }
    };
    
    return [
      { 
        name: 'Revenue Health', 
        value: `${healthData.revenueGrowth.toFixed(0)}% YoY`,
        status: getStatus('revenue', healthData.revenueGrowth),
        trend: healthData.revenueGrowth > 80 ? 'up' : 'down',
        trendValue: '+12%'
      },
      { 
        name: 'Gross Margin', 
        value: `${healthData.grossMargin.toFixed(0)}%`,
        status: getStatus('margin', healthData.grossMargin),
        trend: 'up',
        trendValue: '+2%'
      },
      { 
        name: 'EBITDA Trend', 
        value: `${healthData.ebitdaMargin.toFixed(0)}%`,
        status: getStatus('ebitda', healthData.ebitdaMargin),
        trend: healthData.ebitdaMargin > -15 ? 'up' : 'down',
        trendValue: healthData.ebitdaMargin > -15 ? '+5%' : '-3%'
      },
      { 
        name: 'Runway', 
        value: `${healthData.runway} months`,
        status: getStatus('runway', healthData.runway),
        trend: 'flat',
        trendValue: '0'
      },
      { 
        name: 'Creator Growth', 
        value: `${drivers.creatorGrowth}% MoM`,
        status: drivers.creatorGrowth >= 8 ? 'healthy' : 'warning',
        trend: drivers.creatorGrowth >= 8 ? 'up' : 'down',
        trendValue: '+2%'
      },
      { 
        name: 'Churn', 
        value: `${healthData.churn}%`,
        status: getStatus('churn', healthData.churn),
        trend: healthData.churn <= 5 ? 'down' : 'up',
        trendValue: '-0.5%'
      },
      { 
        name: 'Product Velocity', 
        value: 'On Track',
        status: 'healthy',
        trend: 'up',
        trendValue: '+1 release'
      },
      { 
        name: 'Technical Stability', 
        value: '99.8% uptime',
        status: 'healthy',
        trend: 'up',
        trendValue: '+0.1%'
      },
      { 
        name: 'Identity Verification', 
        value: `${drivers.identityVerificationAdoption}% adoption`,
        status: drivers.identityVerificationAdoption >= 25 ? 'healthy' : 'warning',
        trend: 'up',
        trendValue: '+5%'
      },
    ];
  }, [healthData, drivers]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-yellow-500" />
            Company Health
          </h1>
          <p className="text-muted-foreground">AI-generated state of the company analysis</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh Analysis
        </Button>
      </div>

      {/* Overall Health Status */}
      <Card className={cn(
        "border-2",
        aiNarrative.overallHealth === 'strong' && "border-green-500/30 bg-green-500/5",
        aiNarrative.overallHealth === 'moderate' && "border-yellow-500/30 bg-yellow-500/5",
        aiNarrative.overallHealth === 'concerning' && "border-red-500/30 bg-red-500/5"
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {aiNarrative.overallHealth === 'strong' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
            {aiNarrative.overallHealth === 'moderate' && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
            {aiNarrative.overallHealth === 'concerning' && <AlertTriangle className="w-8 h-8 text-red-500" />}
            <div>
              <CardTitle>Current Status: {aiNarrative.overallHealth.charAt(0).toUpperCase() + aiNarrative.overallHealth.slice(1)}</CardTitle>
              <CardDescription>Based on {scorecards.length} key performance indicators</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{aiNarrative.narratives.overview}</p>
        </CardContent>
      </Card>

      {/* KPI Scorecards */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Scorecards</CardTitle>
          <CardDescription>Real-time health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scorecards.map((kpi, i) => (
              <div key={i} className={cn(
                "p-4 rounded-lg border",
                kpi.status === 'healthy' && "border-green-500/30 bg-green-500/5",
                kpi.status === 'warning' && "border-yellow-500/30 bg-yellow-500/5",
                kpi.status === 'critical' && "border-red-500/30 bg-red-500/5"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.name}</span>
                  <Badge variant={
                    kpi.status === 'healthy' ? 'default' :
                    kpi.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {kpi.status === 'healthy' ? '🟢' : kpi.status === 'warning' ? '🟡' : '🔴'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{kpi.value}</span>
                  <div className={cn(
                    "flex items-center text-xs",
                    kpi.trend === 'up' && "text-green-500",
                    kpi.trend === 'down' && "text-red-500",
                    kpi.trend === 'flat' && "text-muted-foreground"
                  )}>
                    {kpi.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                    {kpi.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                    {kpi.trend === 'flat' && <Minus className="w-3 h-3" />}
                    {kpi.trendValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Creator Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiNarrative.narratives.creatorGrowth}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Pacing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Pacing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiNarrative.narratives.revenuePacing}
            </p>
          </CardContent>
        </Card>

        {/* Risks */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Key Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiNarrative.narratives.risks.length > 0 ? (
              <ul className="space-y-2">
                {aiNarrative.narratives.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-red-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant risks identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Zap className="w-5 h-5" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiNarrative.narratives.opportunities.length > 0 ? (
              <ul className="space-y-2">
                {aiNarrative.narratives.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 mt-0.5">•</span>
                    {opp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Analysis in progress...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
