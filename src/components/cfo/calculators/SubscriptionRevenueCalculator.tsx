import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, RefreshCw, Save, CreditCard } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';

interface Props {
  onSave?: () => void;
}

export function SubscriptionRevenueCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Input state
  const [activeCreators, setActiveCreators] = useState(5000);
  const [freePct, setFreePct] = useState(70);
  const [proPct, setProPct] = useState(20);
  const [businessPct, setBusinessPct] = useState(8);
  const [enterprisePct, setEnterprisePct] = useState(2);
  const [monthlyGrowth, setMonthlyGrowth] = useState(15);
  const [upgradeRate, setUpgradeRate] = useState(8);
  
  // Prices from R&D
  const [priceProMonthly] = useState(() => getEffectiveValue('creator_subscription_arpu_pro', 29));
  const [priceBusinessMonthly] = useState(() => getEffectiveValue('creator_subscription_arpu_business', 79));
  const [priceEnterpriseMonthly] = useState(() => getEffectiveValue('creator_subscription_arpu_enterprise', 299));

  // Calculations
  const freeCount = Math.round(activeCreators * (freePct / 100));
  const proCount = Math.round(activeCreators * (proPct / 100));
  const businessCount = Math.round(activeCreators * (businessPct / 100));
  const enterpriseCount = Math.round(activeCreators * (enterprisePct / 100));

  const monthlyProRevenue = proCount * priceProMonthly;
  const monthlyBusinessRevenue = businessCount * priceBusinessMonthly;
  const monthlyEnterpriseRevenue = enterpriseCount * priceEnterpriseMonthly;
  const totalMRR = monthlyProRevenue + monthlyBusinessRevenue + monthlyEnterpriseRevenue;

  // 3-year projection with growth
  const year1Revenue = totalMRR * 12 * (1 + (monthlyGrowth * 6) / 100); // Average growth
  const year2Revenue = year1Revenue * (1 + monthlyGrowth / 100) ** 12;
  const year3Revenue = year2Revenue * (1 + monthlyGrowth / 100) ** 12;

  const handleReset = () => {
    setActiveCreators(5000);
    setFreePct(70);
    setProPct(20);
    setBusinessPct(8);
    setEnterprisePct(2);
    setMonthlyGrowth(15);
    setUpgradeRate(8);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'starting_creators', value: activeCreators, unit: 'count', category: 'growth' },
      { metric_key: 'free_tier_percent', value: freePct, unit: 'percent', category: 'subscriptions' },
      { metric_key: 'pro_tier_percent', value: proPct, unit: 'percent', category: 'subscriptions' },
      { metric_key: 'business_tier_percent', value: businessPct, unit: 'percent', category: 'subscriptions' },
      { metric_key: 'enterprise_tier_percent', value: enterprisePct, unit: 'percent', category: 'subscriptions' },
      { metric_key: 'creator_growth_mom', value: monthlyGrowth, unit: 'percent', category: 'growth' },
      { metric_key: 'free_to_paid_upgrade_rate', value: upgradeRate, unit: 'percent', category: 'subscriptions' },
    ]);
    onSave?.();
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Subscription Revenue Calculator
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            MRR Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Active Creators Today</span>
                <span className="text-sm font-medium text-slate-900">{activeCreators.toLocaleString()}</span>
              </Label>
              <Slider
                value={[activeCreators]}
                onValueChange={([v]) => setActiveCreators(v)}
                min={100}
                max={50000}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Free Tier %</span>
                <span className="text-sm font-medium text-slate-900">{freePct}%</span>
              </Label>
              <Slider
                value={[freePct]}
                onValueChange={([v]) => setFreePct(v)}
                min={50}
                max={95}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Pro Tier % (${priceProMonthly}/mo)</span>
                <span className="text-sm font-medium text-slate-900">{proPct}%</span>
              </Label>
              <Slider
                value={[proPct]}
                onValueChange={([v]) => setProPct(v)}
                min={1}
                max={40}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Business Tier % (${priceBusinessMonthly}/mo)</span>
                <span className="text-sm font-medium text-slate-900">{businessPct}%</span>
              </Label>
              <Slider
                value={[businessPct]}
                onValueChange={([v]) => setBusinessPct(v)}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Creator Growth</span>
                <span className="text-sm font-medium text-slate-900">{monthlyGrowth}%</span>
              </Label>
              <Slider
                value={[monthlyGrowth]}
                onValueChange={([v]) => setMonthlyGrowth(v)}
                min={0}
                max={30}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Free → Paid Upgrade Rate</span>
                <span className="text-sm font-medium text-slate-900">{upgradeRate}%</span>
              </Label>
              <Slider
                value={[upgradeRate]}
                onValueChange={([v]) => setUpgradeRate(v)}
                min={1}
                max={25}
                step={1}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-500">Current MRR</p>
                  <p className="text-4xl font-bold text-emerald-600">
                    {formatCurrency(totalMRR)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">Pro</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyProRevenue)}</p>
                    <p className="text-xs text-slate-400">{proCount} users</p>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">Business</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyBusinessRevenue)}</p>
                    <p className="text-xs text-slate-400">{businessCount} users</p>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">Enterprise</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyEnterpriseRevenue)}</p>
                    <p className="text-xs text-slate-400">{enterpriseCount} users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Year 1', value: formatCurrency(year1Revenue) },
                { label: 'Year 2', value: formatCurrency(year2Revenue) },
                { label: 'Year 3', value: formatCurrency(year3Revenue) },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 bg-slate-50 rounded-lg text-center"
                >
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900">{item.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">Free Users</span>
                <span className="font-medium text-amber-900">{freeCount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                {upgradeRate}% upgrade rate = {Math.round(freeCount * upgradeRate / 100)} potential converts/mo
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
