import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Calculator, Users, DollarSign, TrendingUp, RefreshCw, Save, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';

interface Props {
  onSave?: () => void;
}

export function GrowthCACCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Input state with specified defaults
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(35);
  const [churnRate, setChurnRate] = useState(4);
  const [timeHorizon, setTimeHorizon] = useState(12);

  // Update from saved values when loaded
  useEffect(() => {
    const savedCac = getEffectiveValue('creator_cac_paid', 50);
    const savedArpu = getEffectiveValue('creator_subscription_arpu_pro', 35);
    const savedChurn = getEffectiveValue('creator_monthly_churn', 4);
    if (savedCac) setCac(savedCac);
    if (savedArpu) setArpu(savedArpu);
    if (savedChurn) setChurnRate(savedChurn);
  }, [getEffectiveValue]);

  // Calculations
  const newCustomersPerMonth = Math.floor(monthlyBudget / cac);
  const ltv = arpu * (1 / (churnRate / 100));
  const ltvCacRatio = (ltv / cac).toFixed(2);
  const paybackMonths = (cac / arpu).toFixed(1);
  const totalCustomersYear = newCustomersPerMonth * timeHorizon;
  const totalRevenue = totalCustomersYear * ltv;
  const totalCost = monthlyBudget * timeHorizon;
  const netROI = ((totalRevenue - totalCost) / totalCost * 100).toFixed(1);

  const handleReset = () => {
    setMonthlyBudget(10000);
    setCac(50);
    setArpu(35);
    setChurnRate(4);
    setTimeHorizon(12);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'creator_cac_paid', value: cac, unit: 'usd', category: 'growth' },
      { metric_key: 'creator_subscription_arpu_pro', value: arpu, unit: 'usd', category: 'subscriptions' },
      { metric_key: 'creator_monthly_churn', value: churnRate, unit: 'percent', category: 'growth' },
    ]);
    onSave?.();
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Growth & CAC Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust these sliders to update CFO assumptions. Click 'Save to Pro Forma' to apply them to all board forecasts.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Unit Economics
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Marketing Budget</span>
                <span className="text-sm font-medium text-foreground">${monthlyBudget.toLocaleString()}</span>
              </Label>
              <Slider
                value={[monthlyBudget]}
                onValueChange={([v]) => setMonthlyBudget(v)}
                min={1000}
                max={100000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">Total monthly spend on paid marketing across all channels.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Customer Acquisition Cost (CAC)</span>
                <span className="text-sm font-medium text-foreground">${cac}</span>
              </Label>
              <Slider
                value={[cac]}
                onValueChange={([v]) => setCac(v)}
                min={5}
                max={500}
                step={5}
              />
              <p className="text-xs text-muted-foreground">Average cost to acquire one paying customer.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Average Revenue Per User (ARPU)</span>
                <span className="text-sm font-medium text-foreground">${arpu}/mo</span>
              </Label>
              <Slider
                value={[arpu]}
                onValueChange={([v]) => setArpu(v)}
                min={10}
                max={200}
                step={5}
              />
              <p className="text-xs text-muted-foreground">Average monthly recurring revenue per paying creator.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Churn Rate</span>
                <span className="text-sm font-medium text-foreground">{churnRate}%</span>
              </Label>
              <Slider
                value={[churnRate]}
                onValueChange={([v]) => setChurnRate(v)}
                min={1}
                max={20}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">Percent of paying customers who cancel in a given month.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Time Horizon</span>
                <span className="text-sm font-medium text-foreground">{timeHorizon} months</span>
              </Label>
              <Slider
                value={[timeHorizon]}
                onValueChange={([v]) => setTimeHorizon(v)}
                min={3}
                max={36}
                step={1}
              />
              <p className="text-xs text-muted-foreground">How far out to model ROI and payback.</p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Net ROI</p>
                  <p className={`text-4xl font-bold ${Number(netROI) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netROI}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">LTV/CAC Ratio</p>
                    <p className={`text-xl font-bold ${Number(ltvCacRatio) >= 3 ? 'text-emerald-600' : Number(ltvCacRatio) >= 2 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {ltvCacRatio}x
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Payback Period</p>
                    <p className={`text-xl font-bold ${Number(paybackMonths) <= 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {paybackMonths} mo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'New Customers/Month', value: newCustomersPerMonth.toLocaleString(), icon: Users },
                { label: 'Customer LTV', value: `$${Math.round(ltv).toLocaleString()}`, icon: DollarSign },
                { label: 'Total Customers', value: totalCustomersYear.toLocaleString(), icon: Users },
                { label: 'Total Revenue', value: `$${Math.round(totalRevenue).toLocaleString()}`, icon: TrendingUp },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{metric.label}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{metric.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* KPI Explanations */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="space-y-1.5 text-sm">
                  <p className="text-blue-800"><strong>LTV/CAC:</strong> Target &gt;3x is considered healthy.</p>
                  <p className="text-blue-800"><strong>Payback period:</strong> Under 12 months is typically considered strong.</p>
                  <p className="text-blue-800"><strong>Churn:</strong> Below 5% monthly indicates strong retention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark & Actions */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Industry Benchmarks:</strong> SaaS companies target LTV/CAC of 3:1+. Payback under 12 months is healthy. Churn below 5% indicates strong retention.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
