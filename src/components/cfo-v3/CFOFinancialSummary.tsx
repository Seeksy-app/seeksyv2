import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Wallet, ArrowDownUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CFOFinancialSummaryProps {
  metrics: {
    revenue: { year1: number; year2: number; year3: number };
    cogs: { year1: number; year2: number; year3: number };
    grossProfit: { year1: number; year2: number; year3: number };
    opex: { year1: number; year2: number; year3: number };
    ebitda: { year1: number; year2: number; year3: number };
    grossMargins: { year1: number; year2: number; year3: number };
    burnRate: number;
    runway: number;
  };
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (n: number) => n.toLocaleString();

function FinancialRow({ label, values, isTotal, isNegative }: { 
  label: string; 
  values: { year1: number; year2: number; year3: number };
  isTotal?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div className={`grid grid-cols-4 gap-4 py-2 ${isTotal ? 'border-t border-border font-semibold' : 'border-b border-border/30'}`}>
      <span className={`text-sm ${isTotal ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`text-sm text-right font-mono ${isNegative && values.year1 < 0 ? 'text-red-500' : ''}`}>
        {isNegative && values.year1 < 0 ? '-' : ''}${formatNumber(Math.abs(values.year1))}
      </span>
      <span className={`text-sm text-right font-mono ${isNegative && values.year2 < 0 ? 'text-red-500' : ''}`}>
        {isNegative && values.year2 < 0 ? '-' : ''}${formatNumber(Math.abs(values.year2))}
      </span>
      <span className={`text-sm text-right font-mono ${isNegative && values.year3 < 0 ? 'text-green-600' : isNegative && values.year3 < 0 ? 'text-red-500' : ''}`}>
        {isNegative && values.year3 < 0 ? '-' : ''}${formatNumber(Math.abs(values.year3))}
      </span>
    </div>
  );
}

export function CFOFinancialSummary({ metrics }: CFOFinancialSummaryProps) {
  const netIncome = {
    year1: metrics.ebitda.year1,
    year2: metrics.ebitda.year2,
    year3: metrics.ebitda.year3,
  };

  const chartData = [
    { name: '2025', revenue: metrics.revenue.year1, grossProfit: metrics.grossProfit.year1, ebitda: metrics.ebitda.year1 },
    { name: '2026', revenue: metrics.revenue.year2, grossProfit: metrics.grossProfit.year2, ebitda: metrics.ebitda.year2 },
    { name: '2027', revenue: metrics.revenue.year3, grossProfit: metrics.grossProfit.year3, ebitda: metrics.ebitda.year3 },
  ];

  const marginData = [
    { name: '2025', margin: metrics.grossMargins.year1 },
    { name: '2026', margin: metrics.grossMargins.year2 },
    { name: '2027', margin: metrics.grossMargins.year3 },
  ];

  return (
    <section id="summary" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            Financial Summary
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">3-Year Projection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Income Statement */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Income Statement</h3>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Line Item</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2025</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2026</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2027</span>
              </div>
              <FinancialRow label="Revenue" values={metrics.revenue} />
              <FinancialRow label="COGS" values={{ year1: -metrics.cogs.year1, year2: -metrics.cogs.year2, year3: -metrics.cogs.year3 }} />
              <FinancialRow label="Gross Profit" values={metrics.grossProfit} isTotal />
              <FinancialRow label="Operating Expenses" values={{ year1: -metrics.opex.year1, year2: -metrics.opex.year2, year3: -metrics.opex.year3 }} />
              <FinancialRow label="EBITDA" values={metrics.ebitda} isTotal isNegative />
            </div>
          </div>

          {/* Balance Sheet (Simplified) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Balance Sheet (Simplified)</h3>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Item</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2025</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2026</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2027</span>
              </div>
              <FinancialRow label="Cash" values={{ year1: 2000000 - (metrics.burnRate * 12), year2: 2000000 - (metrics.burnRate * 6), year3: 2000000 + (metrics.ebitda.year3 > 0 ? metrics.ebitda.year3 : 0) }} />
              <FinancialRow label="Accounts Receivable" values={{ year1: metrics.revenue.year1 * 0.08, year2: metrics.revenue.year2 * 0.08, year3: metrics.revenue.year3 * 0.08 }} />
              <FinancialRow label="Liabilities" values={{ year1: 50000, year2: 75000, year3: 100000 }} />
              <FinancialRow label="Equity" values={{ year1: 2000000, year2: 2500000, year3: 3000000 }} isTotal />
            </div>
          </div>

          {/* Cash Flow */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Cash Flow</h3>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Item</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2025</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2026</span>
                <span className="text-xs font-medium text-muted-foreground uppercase text-right">2027</span>
              </div>
              <FinancialRow label="Net Income" values={netIncome} isNegative />
              <FinancialRow label="D&A Add-back" values={{ year1: 20000, year2: 40000, year3: 60000 }} />
              <FinancialRow label="Working Capital Δ" values={{ year1: -30000, year2: -50000, year3: -80000 }} isNegative />
              <FinancialRow label="Free Cash Flow" values={{ year1: netIncome.year1 - 10000, year2: netIncome.year2 - 10000, year3: netIncome.year3 - 20000 }} isTotal isNegative />
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted/20 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-4">Revenue & Profitability</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Revenue" />
                    <Area type="monotone" dataKey="grossProfit" stackId="2" stroke="#22c55e" fill="#22c55e20" name="Gross Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-4">Gross Margin %</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marginData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="margin" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Gross Margin" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
