import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, FileSpreadsheet, FileText, Sparkles, Target, TrendingUp,
  DollarSign, Users, Building2, Briefcase, Calculator, Share2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface RevenueModel {
  saasSubscriptions: number[];
  aiProductionTools: number[];
  advertisingMarketplace: number[];
  enterpriseLicensing: number[];
}

interface COGS {
  hostingBandwidth: number[];
  aiInference: number[];
  paymentProcessing: number[];
}

interface OpEx {
  productEngineering: number[];
  salesMarketing: number[];
  generalAdmin: number[];
  customerSuccess: number[];
  contractorsAI: number[];
}

interface HeadcountRow {
  department: string;
  year1: number;
  year2: number;
  year3: number;
}

interface Assumptions {
  monthlyCreatorGrowth: number;
  avgRevenuePerCreator: number;
  aiToolsAdoption: number;
  adFillRate: number;
  avgCPM: number;
  churnRate: number;
  cacPaid: number;
  cacOrganic: number;
  grossMarginTarget: number;
}

interface KeyMetrics {
  arr: number[];
  cac: number;
  ltv: number;
  grossMargin: number[];
  burnRate: number[];
  runway: number;
  ebitda: number[];
  breakEvenMonth: number | null;
}

const YEARS = [2025, 2026, 2027];

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function CFOStudioV2() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('revenue');
  const [forecastMode, setForecastMode] = useState<'ai' | 'custom'>('custom');
  const [enterpriseEnabled, setEnterpriseEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Assumptions State
  const [assumptions, setAssumptions] = useState<Assumptions>({
    monthlyCreatorGrowth: 8,
    avgRevenuePerCreator: 45,
    aiToolsAdoption: 35,
    adFillRate: 65,
    avgCPM: 22,
    churnRate: 5,
    cacPaid: 85,
    cacOrganic: 15,
    grossMarginTarget: 70,
  });

  // Revenue Model State
  const [revenue, setRevenue] = useState<RevenueModel>({
    saasSubscriptions: [480000, 1200000, 2400000],
    aiProductionTools: [120000, 420000, 960000],
    advertisingMarketplace: [180000, 720000, 1800000],
    enterpriseLicensing: [0, 150000, 500000],
  });

  // COGS State
  const [cogs, setCogs] = useState<COGS>({
    hostingBandwidth: [48000, 96000, 180000],
    aiInference: [36000, 84000, 192000],
    paymentProcessing: [24000, 60000, 144000],
  });

  // OpEx State
  const [opex, setOpex] = useState<OpEx>({
    productEngineering: [360000, 540000, 720000],
    salesMarketing: [180000, 360000, 540000],
    generalAdmin: [120000, 180000, 240000],
    customerSuccess: [60000, 120000, 180000],
    contractorsAI: [48000, 72000, 96000],
  });

  // Headcount State
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([
    { department: 'Engineering', year1: 4, year2: 7, year3: 12 },
    { department: 'Product', year1: 2, year2: 3, year3: 5 },
    { department: 'Sales', year1: 2, year2: 4, year3: 8 },
    { department: 'Marketing', year1: 1, year2: 2, year3: 4 },
    { department: 'Customer Success', year1: 1, year2: 2, year3: 4 },
    { department: 'G&A', year1: 2, year2: 3, year3: 4 },
  ]);

  // Calculated Metrics
  const metrics = useMemo<KeyMetrics>(() => {
    const totalRevenue = YEARS.map((_, i) => 
      revenue.saasSubscriptions[i] + 
      revenue.aiProductionTools[i] + 
      revenue.advertisingMarketplace[i] + 
      (enterpriseEnabled ? revenue.enterpriseLicensing[i] : 0)
    );

    const totalCogs = YEARS.map((_, i) => 
      cogs.hostingBandwidth[i] + cogs.aiInference[i] + cogs.paymentProcessing[i]
    );

    const totalOpex = YEARS.map((_, i) =>
      opex.productEngineering[i] + opex.salesMarketing[i] + opex.generalAdmin[i] +
      opex.customerSuccess[i] + opex.contractorsAI[i]
    );

    const grossProfit = totalRevenue.map((rev, i) => rev - totalCogs[i]);
    const grossMargin = totalRevenue.map((rev, i) => rev > 0 ? (grossProfit[i] / rev) * 100 : 0);
    const ebitda = grossProfit.map((gp, i) => gp - totalOpex[i]);
    const burnRate = ebitda.map(e => e < 0 ? Math.abs(e) / 12 : 0);

    // Simple CAC/LTV based on assumptions
    const blendedCAC = (assumptions.cacPaid * 0.6) + (assumptions.cacOrganic * 0.4);
    const avgMonthlyRevenue = assumptions.avgRevenuePerCreator;
    const churnRate = assumptions.churnRate / 100;
    const ltv = churnRate > 0 ? avgMonthlyRevenue / churnRate : avgMonthlyRevenue * 24;

    // Find breakeven month (first month where cumulative EBITDA > 0)
    let breakEvenMonth: number | null = null;
    let cumulative = 0;
    for (let month = 1; month <= 36; month++) {
      const yearIndex = Math.floor((month - 1) / 12);
      const monthlyEbitda = ebitda[yearIndex] / 12;
      cumulative += monthlyEbitda;
      if (cumulative > 0 && breakEvenMonth === null) {
        breakEvenMonth = month;
        break;
      }
    }

    // Runway calculation (months of cash at current burn rate)
    const currentBurn = burnRate[0];
    const assumedCash = 500000; // Could be an input
    const runway = currentBurn > 0 ? assumedCash / currentBurn : 36;

    return {
      arr: totalRevenue,
      cac: blendedCAC,
      ltv,
      grossMargin,
      burnRate,
      runway: Math.min(runway, 36),
      ebitda,
      breakEvenMonth,
    };
  }, [revenue, cogs, opex, assumptions, enterpriseEnabled]);

  // Update handlers
  const updateRevenue = useCallback((key: keyof RevenueModel, yearIndex: number, value: number) => {
    setRevenue(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateCogs = useCallback((key: keyof COGS, yearIndex: number, value: number) => {
    setCogs(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateOpex = useCallback((key: keyof OpEx, yearIndex: number, value: number) => {
    setOpex(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateHeadcount = useCallback((index: number, field: 'year1' | 'year2' | 'year3', value: number) => {
    setHeadcount(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  }, []);

  const updateAssumption = useCallback((key: keyof Assumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // AI Forecast Generation
  const generateAIForecast = async () => {
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Apply growth multipliers based on assumptions
    const growthMultiplier = 1 + (assumptions.monthlyCreatorGrowth / 100) * 12;
    
    setRevenue({
      saasSubscriptions: [480000, Math.round(480000 * growthMultiplier), Math.round(480000 * growthMultiplier * growthMultiplier)],
      aiProductionTools: [120000, Math.round(120000 * growthMultiplier * 1.2), Math.round(120000 * growthMultiplier * growthMultiplier * 1.3)],
      advertisingMarketplace: [180000, Math.round(180000 * growthMultiplier * 1.1), Math.round(180000 * growthMultiplier * growthMultiplier * 1.2)],
      enterpriseLicensing: [0, 150000, 500000],
    });
    
    setIsGenerating(false);
    setForecastMode('ai');
    toast.success('AI forecast generated');
  };

  // Export handlers
  const exportPDF = () => {
    toast.success('PDF export started');
    // PDF generation logic would go here
  };

  const exportExcel = () => {
    const headers = ['Category', ...YEARS.map(y => y.toString())];
    const rows = [
      ['Revenue - SaaS Subscriptions', ...revenue.saasSubscriptions],
      ['Revenue - AI + Production Tools', ...revenue.aiProductionTools],
      ['Revenue - Advertising + Marketplace', ...revenue.advertisingMarketplace],
      ['Revenue - Enterprise Licensing', ...revenue.enterpriseLicensing],
      ['', '', '', ''],
      ['COGS - Hosting & Bandwidth', ...cogs.hostingBandwidth],
      ['COGS - AI Inference', ...cogs.aiInference],
      ['COGS - Payment Processing', ...cogs.paymentProcessing],
      ['', '', '', ''],
      ['OpEx - Product & Engineering', ...opex.productEngineering],
      ['OpEx - Sales & Marketing', ...opex.salesMarketing],
      ['OpEx - G&A', ...opex.generalAdmin],
      ['OpEx - Customer Success', ...opex.customerSuccess],
      ['OpEx - Contractors/AI', ...opex.contractorsAI],
      ['', '', '', ''],
      ['ARR', ...metrics.arr],
      ['Gross Margin %', ...metrics.grossMargin.map(v => `${v.toFixed(1)}%`)],
      ['EBITDA', ...metrics.ebitda],
    ];
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-proforma-v2-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Excel export complete');
  };

  const shareToBoard = () => {
    toast.success('Pro Forma shared to Board');
    // Would update board_shared flag in database
  };

  // Render helpers
  const renderNumberInput = (
    value: number, 
    onChange: (v: number) => void, 
    prefix = '$',
    className = ''
  ) => (
    <div className={cn("relative", className)}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("text-right h-9", prefix && "pl-7")}
      />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CFO Studio V2</h1>
              <p className="text-muted-foreground text-sm">3-Year Financial Pro Forma • Investor Package</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Forecast Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={forecastMode === 'custom' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setForecastMode('custom')}
                className="h-8"
              >
                <Target className="w-4 h-4 mr-1.5" />
                Custom
              </Button>
              <Button
                variant={forecastMode === 'ai' ? 'default' : 'ghost'}
                size="sm"
                onClick={generateAIForecast}
                disabled={isGenerating}
                className="h-8"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isGenerating ? 'Generating...' : 'AI Forecast'}
              </Button>
            </div>

            <Badge variant="outline" className="h-8 px-3">
              {forecastMode === 'ai' ? 'AI-Generated' : 'Custom Assumptions'}
            </Badge>

            {/* Export Buttons */}
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-1.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </Button>
            <Button variant="default" size="sm" onClick={shareToBoard}>
              <Share2 className="w-4 h-4 mr-1.5" />
              Share to Board
            </Button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-8 gap-3">
          {[
            { label: 'Y3 ARR', value: formatCurrency(metrics.arr[2]), icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'CAC', value: formatCurrency(metrics.cac, false), icon: DollarSign, color: 'text-blue-600' },
            { label: 'LTV', value: formatCurrency(metrics.ltv), icon: Users, color: 'text-purple-600' },
            { label: 'LTV:CAC', value: `${(metrics.ltv / metrics.cac).toFixed(1)}x`, icon: Target, color: 'text-amber-600' },
            { label: 'Gross Margin', value: formatPercent(metrics.grossMargin[2]), icon: Calculator, color: 'text-indigo-600' },
            { label: 'Burn Rate', value: formatCurrency(metrics.burnRate[0]), icon: TrendingUp, color: metrics.burnRate[0] > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Runway', value: `${Math.round(metrics.runway)}mo`, icon: Building2, color: 'text-cyan-600' },
            { label: 'Breakeven', value: metrics.breakEvenMonth ? `M${metrics.breakEvenMonth}` : 'N/A', icon: Briefcase, color: 'text-green-600' },
          ].map((metric, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <metric.icon className={cn("w-4 h-4", metric.color)} />
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                <p className="text-lg font-semibold">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-7 w-full max-w-3xl">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="cogs">COGS</TabsTrigger>
            <TabsTrigger value="opex">OpEx</TabsTrigger>
            <TabsTrigger value="headcount">Headcount</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Revenue Model</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enterprise-toggle" className="text-sm text-muted-foreground">Enterprise Licensing</Label>
                    <Switch
                      id="enterprise-toggle"
                      checked={enterpriseEnabled}
                      onCheckedChange={setEnterpriseEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Line Item</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">SaaS Platform Subscriptions</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(revenue.saasSubscriptions[i], (v) => updateRevenue('saasSubscriptions', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">AI + Production Tools (Usage)</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(revenue.aiProductionTools[i], (v) => updateRevenue('aiProductionTools', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Advertising + Marketplace</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(revenue.advertisingMarketplace[i], (v) => updateRevenue('advertisingMarketplace', i, v))}
                          </td>
                        ))}
                      </tr>
                      {enterpriseEnabled && (
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3">Enterprise Licensing</td>
                          {YEARS.map((_, i) => (
                            <td key={i} className="py-2 px-3">
                              {renderNumberInput(revenue.enterpriseLicensing[i], (v) => updateRevenue('enterpriseLicensing', i, v))}
                            </td>
                          ))}
                        </tr>
                      )}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total Revenue</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right">
                            {formatCurrency(
                              revenue.saasSubscriptions[i] + 
                              revenue.aiProductionTools[i] + 
                              revenue.advertisingMarketplace[i] + 
                              (enterpriseEnabled ? revenue.enterpriseLicensing[i] : 0)
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COGS Tab */}
          <TabsContent value="cogs">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cost of Goods Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Line Item</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Hosting + Bandwidth</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(cogs.hostingBandwidth[i], (v) => updateCogs('hostingBandwidth', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">AI Inference</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(cogs.aiInference[i], (v) => updateCogs('aiInference', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Payment Processing</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(cogs.paymentProcessing[i], (v) => updateCogs('paymentProcessing', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total COGS</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right">
                            {formatCurrency(cogs.hostingBandwidth[i] + cogs.aiInference[i] + cogs.paymentProcessing[i])}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OpEx Tab */}
          <TabsContent value="opex">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Operating Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Product & Engineering</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(opex.productEngineering[i], (v) => updateOpex('productEngineering', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Sales & Marketing</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(opex.salesMarketing[i], (v) => updateOpex('salesMarketing', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">General & Administrative</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(opex.generalAdmin[i], (v) => updateOpex('generalAdmin', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Customer Success</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(opex.customerSuccess[i], (v) => updateOpex('customerSuccess', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Contractors / AI Automation</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3">
                            {renderNumberInput(opex.contractorsAI[i], (v) => updateOpex('contractorsAI', i, v))}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total OpEx</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right">
                            {formatCurrency(
                              opex.productEngineering[i] + opex.salesMarketing[i] + opex.generalAdmin[i] +
                              opex.customerSuccess[i] + opex.contractorsAI[i]
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Headcount Tab */}
          <TabsContent value="headcount">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Headcount Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Department</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-center py-2 px-3 font-medium text-muted-foreground w-28">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {headcount.map((row, index) => (
                        <tr key={row.department} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3">{row.department}</td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={row.year1}
                              onChange={(e) => updateHeadcount(index, 'year1', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={row.year2}
                              onChange={(e) => updateHeadcount(index, 'year2', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={row.year3}
                              onChange={(e) => updateHeadcount(index, 'year3', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total Headcount</td>
                        <td className="py-2 px-3 text-center">{headcount.reduce((sum, r) => sum + r.year1, 0)}</td>
                        <td className="py-2 px-3 text-center">{headcount.reduce((sum, r) => sum + r.year2, 0)}</td>
                        <td className="py-2 px-3 text-center">{headcount.reduce((sum, r) => sum + r.year3, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Key Metrics (Auto-Calculated)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">ARR</td>
                        {metrics.arr.map((v, i) => (
                          <td key={i} className="py-2 px-3 text-right font-semibold text-emerald-600">{formatCurrency(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">Gross Margin %</td>
                        {metrics.grossMargin.map((v, i) => (
                          <td key={i} className="py-2 px-3 text-right">{formatPercent(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">EBITDA</td>
                        {metrics.ebitda.map((v, i) => (
                          <td key={i} className={cn("py-2 px-3 text-right font-semibold", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(v)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">Burn Rate (Monthly)</td>
                        {metrics.burnRate.map((v, i) => (
                          <td key={i} className={cn("py-2 px-3 text-right", v > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {v > 0 ? formatCurrency(v) : 'Cash Positive'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">CAC (Blended)</td>
                        <td colSpan={3} className="py-2 px-3 text-right">{formatCurrency(metrics.cac, false)}</td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">LTV</td>
                        <td colSpan={3} className="py-2 px-3 text-right">{formatCurrency(metrics.ltv)}</td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">LTV:CAC Ratio</td>
                        <td colSpan={3} className={cn("py-2 px-3 text-right font-semibold", metrics.ltv / metrics.cac >= 3 ? 'text-emerald-600' : 'text-amber-600')}>
                          {(metrics.ltv / metrics.cac).toFixed(1)}x
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">Runway (Months)</td>
                        <td colSpan={3} className="py-2 px-3 text-right">{Math.round(metrics.runway)} months</td>
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30">
                        <td className="py-2 px-3 font-semibold">Breakeven Month</td>
                        <td colSpan={3} className="py-2 px-3 text-right font-bold text-emerald-600">
                          {metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'Beyond Y3'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">CFO Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Growth</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Monthly Creator Growth (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.monthlyCreatorGrowth}
                          onChange={(e) => updateAssumption('monthlyCreatorGrowth', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Avg Revenue Per Creator ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.avgRevenuePerCreator}
                          onChange={(e) => updateAssumption('avgRevenuePerCreator', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Monthly Churn Rate (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.churnRate}
                          onChange={(e) => updateAssumption('churnRate', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Advertising</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">AI Tools Adoption (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.aiToolsAdoption}
                          onChange={(e) => updateAssumption('aiToolsAdoption', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Ad Fill Rate (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.adFillRate}
                          onChange={(e) => updateAssumption('adFillRate', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Average CPM ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.avgCPM}
                          onChange={(e) => updateAssumption('avgCPM', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Unit Economics</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">CAC Paid ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.cacPaid}
                          onChange={(e) => updateAssumption('cacPaid', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">CAC Organic ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.cacOrganic}
                          onChange={(e) => updateAssumption('cacOrganic', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Gross Margin Target (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.grossMarginTarget}
                          onChange={(e) => updateAssumption('grossMarginTarget', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-2 gap-6">
              {/* P&L Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">P&L Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground"></th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Revenue</td>
                        {metrics.arr.map((v, i) => (
                          <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">COGS</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 text-right text-red-600">
                            ({formatCurrency(cogs.hostingBandwidth[i] + cogs.aiInference[i] + cogs.paymentProcessing[i])})
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="py-2 font-semibold">Gross Profit</td>
                        {YEARS.map((_, i) => {
                          const totalCogs = cogs.hostingBandwidth[i] + cogs.aiInference[i] + cogs.paymentProcessing[i];
                          return (
                            <td key={i} className="py-2 text-right font-semibold">{formatCurrency(metrics.arr[i] - totalCogs)}</td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Operating Expenses</td>
                        {YEARS.map((_, i) => {
                          const totalOpex = opex.productEngineering[i] + opex.salesMarketing[i] + opex.generalAdmin[i] + opex.customerSuccess[i] + opex.contractorsAI[i];
                          return (
                            <td key={i} className="py-2 text-right text-red-600">({formatCurrency(totalOpex)})</td>
                          );
                        })}
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30">
                        <td className="py-2 font-bold">EBITDA</td>
                        {metrics.ebitda.map((v, i) => (
                          <td key={i} className={cn("py-2 text-right font-bold", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(v)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Board Pack Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Board Pack Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 ARR Target</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.arr[2])}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 EBITDA</p>
                      <p className={cn("text-2xl font-bold", metrics.ebitda[2] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(metrics.ebitda[2])}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 Headcount</p>
                      <p className="text-2xl font-bold">{headcount.reduce((sum, r) => sum + r.year3, 0)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Breakeven</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Revenue Mix (Year 3)</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'SaaS Subscriptions', value: revenue.saasSubscriptions[2], color: 'bg-blue-500' },
                        { label: 'AI + Production', value: revenue.aiProductionTools[2], color: 'bg-purple-500' },
                        { label: 'Advertising', value: revenue.advertisingMarketplace[2], color: 'bg-amber-500' },
                        ...(enterpriseEnabled ? [{ label: 'Enterprise', value: revenue.enterpriseLicensing[2], color: 'bg-emerald-500' }] : []),
                      ].map((item) => {
                        const total = metrics.arr[2];
                        const pct = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", item.color)} />
                            <span className="text-sm flex-1">{item.label}</span>
                            <span className="text-sm font-medium">{formatPercent(pct)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
