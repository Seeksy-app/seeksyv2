import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, Clock, Target, BarChart3, Percent, Flame } from 'lucide-react';

interface CFOMetricsSectionProps {
  metrics: {
    arr: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    grossMargin: number;
    burnRate: number;
    runway: number;
    breakevenMonth: number | string;
  };
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  subtext 
}: { 
  label: string; 
  value: string; 
  icon: any; 
  color: string;
  subtext?: string;
}) {
  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

export function CFOMetricsSection({ metrics }: CFOMetricsSectionProps) {
  return (
    <section id="metrics" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-500" />
            </div>
            Key Metrics
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Auto-calculated</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Annual Recurring Revenue"
              value={formatCurrency(metrics.arr)}
              icon={DollarSign}
              color="bg-green-500/10 text-green-500"
              subtext="Year 3 projection"
            />
            <MetricCard
              label="Customer Acquisition Cost"
              value={formatCurrency(metrics.cac)}
              icon={Users}
              color="bg-blue-500/10 text-blue-500"
              subtext="Blended CAC"
            />
            <MetricCard
              label="Lifetime Value"
              value={formatCurrency(metrics.ltv)}
              icon={TrendingUp}
              color="bg-purple-500/10 text-purple-500"
              subtext="24-month LTV"
            />
            <MetricCard
              label="LTV:CAC Ratio"
              value={`${metrics.ltvCacRatio.toFixed(1)}x`}
              icon={Target}
              color="bg-amber-500/10 text-amber-500"
              subtext={metrics.ltvCacRatio >= 3 ? 'Healthy' : 'Needs improvement'}
            />
            <MetricCard
              label="Gross Margin"
              value={`${metrics.grossMargin.toFixed(1)}%`}
              icon={Percent}
              color="bg-teal-500/10 text-teal-500"
              subtext="Year 3"
            />
            <MetricCard
              label="Monthly Burn Rate"
              value={formatCurrency(metrics.burnRate)}
              icon={Flame}
              color="bg-red-500/10 text-red-500"
              subtext="Current monthly"
            />
            <MetricCard
              label="Cash Runway"
              value={`${metrics.runway} months`}
              icon={Clock}
              color="bg-indigo-500/10 text-indigo-500"
              subtext="At current burn"
            />
            <MetricCard
              label="Breakeven Point"
              value={typeof metrics.breakevenMonth === 'number' ? `Month ${metrics.breakevenMonth}` : String(metrics.breakevenMonth)}
              icon={Target}
              color="bg-emerald-500/10 text-emerald-500"
              subtext="Cash flow positive"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
