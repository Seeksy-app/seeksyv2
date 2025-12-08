import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Calculator, Users, DollarSign, TrendingUp, RefreshCw, Save } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';

interface Props {
  onSave?: () => void;
}

export function GrowthCACCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Input state with defaults from R&D benchmarks
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [cac, setCac] = useState(() => getEffectiveValue('creator_cac_paid', 45));
  const [arpu, setArpu] = useState(() => getEffectiveValue('creator_subscription_arpu_pro', 29));
  const [churnRate, setChurnRate] = useState(() => getEffectiveValue('creator_monthly_churn', 5));
  const [timeHorizon, setTimeHorizon] = useState(12);

  // Update from R&D when loaded
  useEffect(() => {
    setCac(getEffectiveValue('creator_cac_paid', 45));
    setArpu(getEffectiveValue('creator_subscription_arpu_pro', 29));
    setChurnRate(getEffectiveValue('creator_monthly_churn', 5));
  }, [getEffectiveValue]);

  // Calculations
  const newCustomersPerMonth = Math.floor(monthlyBudget / cac);
  const ltv = arpu * (1 / (churnRate / 100));
  const ltvCacRatio = (ltv / cac).toFixed(2);
  const totalCustomersYear = newCustomersPerMonth * timeHorizon;
  const totalRevenue = totalCustomersYear * ltv;
  const totalCost = monthlyBudget * timeHorizon;
  const netROI = ((totalRevenue - totalCost) / totalCost * 100).toFixed(1);
  const paybackMonths = (cac / arpu).toFixed(1);

  const handleReset = () => {
    setMonthlyBudget(10000);
    setCac(45);
    setArpu(29);
    setChurnRate(5);
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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Growth & CAC Calculator
          </CardTitle>
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
                <span className="text-sm font-medium text-slate-900">${monthlyBudget.toLocaleString()}</span>
              </Label>
              <Slider
                value={[monthlyBudget]}
                onValueChange={([v]) => setMonthlyBudget(v)}
                min={1000}
                max={100000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Customer Acquisition Cost (CAC)</span>
                <span className="text-sm font-medium text-slate-900">${cac}</span>
              </Label>
              <Slider
                value={[cac]}
                onValueChange={([v]) => setCac(v)}
                min={10}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Average Revenue Per User (ARPU)</span>
                <span className="text-sm font-medium text-slate-900">${arpu}/mo</span>
              </Label>
              <Slider
                value={[arpu]}
                onValueChange={([v]) => setArpu(v)}
                min={5}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Churn Rate</span>
                <span className="text-sm font-medium text-slate-900">{churnRate}%</span>
              </Label>
              <Slider
                value={[churnRate]}
                onValueChange={([v]) => setChurnRate(v)}
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Time Horizon</span>
                <span className="text-sm font-medium text-slate-900">{timeHorizon} months</span>
              </Label>
              <Slider
                value={[timeHorizon]}
                onValueChange={([v]) => setTimeHorizon(v)}
                min={3}
                max={36}
                step={3}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-500">Net ROI</p>
                  <p className={`text-4xl font-bold ${Number(netROI) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netROI}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">LTV/CAC Ratio</p>
                    <p className={`text-xl font-bold ${Number(ltvCacRatio) >= 3 ? 'text-emerald-600' : Number(ltvCacRatio) >= 2 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {ltvCacRatio}x
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">Payback Period</p>
                    <p className="text-xl font-bold text-slate-900">{paybackMonths} mo</p>
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
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{metric.label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{metric.value}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Benchmark & Actions */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
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
