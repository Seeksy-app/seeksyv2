import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Server, DollarSign } from 'lucide-react';
import { COGSModel, YearlyValues } from '@/hooks/useCFOStudioV3';
import { cn } from '@/lib/utils';

interface CFOCOGSSectionProps {
  cogs: COGSModel;
  grossMargins: { year1: number; year2: number; year3: number };
  onUpdate: (key: keyof COGSModel, value: YearlyValues) => void;
}

const formatNumber = (n: number) => n.toLocaleString();
const parseNumber = (s: string) => parseInt(s.replace(/,/g, '')) || 0;

function YearlyInput({ 
  values, 
  onChange,
  label 
}: { 
  values: YearlyValues; 
  onChange: (v: YearlyValues) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {(['year1', 'year2', 'year3'] as const).map((year) => (
        <div key={year} className="relative">
          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={formatNumber(values[year])}
            onChange={(e) => onChange({ ...values, [year]: parseNumber(e.target.value) })}
            className="pl-6 h-9 text-sm font-mono"
          />
        </div>
      ))}
    </div>
  );
}

export function CFOCOGSSection({ cogs, grossMargins, onUpdate }: CFOCOGSSectionProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  return (
    <section id="cogs" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Server className="w-4 h-4 text-orange-500" />
            </div>
            Cost of Goods Sold (COGS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost Line</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2025</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2026</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2027</span>
          </div>

          <YearlyInput
            label="Hosting + AI Inference"
            values={cogs.hostingAI}
            onChange={(v) => onUpdate('hostingAI', v)}
          />
          <YearlyInput
            label="Video Processing"
            values={cogs.videoProcessing}
            onChange={(v) => onUpdate('videoProcessing', v)}
          />
          <YearlyInput
            label="Payment Processing"
            values={cogs.paymentFees}
            onChange={(v) => onUpdate('paymentFees', v)}
          />

          {/* Gross Margin Display */}
          <div className="grid grid-cols-4 gap-4 items-center py-3 mt-2 bg-muted/30 rounded-lg px-2">
            <span className="text-sm font-semibold text-foreground">Gross Margin %</span>
            <span className="text-sm font-bold text-green-600">{grossMargins.year1.toFixed(1)}%</span>
            <span className="text-sm font-bold text-green-600">{grossMargins.year2.toFixed(1)}%</span>
            <span className="text-sm font-bold text-green-600">{grossMargins.year3.toFixed(1)}%</span>
          </div>

          {/* Assumptions Expander */}
          <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
              <ChevronDown className={cn("w-4 h-4 transition-transform", assumptionsOpen && "rotate-180")} />
              COGS Assumptions
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Target COGS %</label>
                  <Input type="text" defaultValue="18%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">AI Cost per 1K tokens</label>
                  <Input type="text" defaultValue="$0.002" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Payment Fee %</label>
                  <Input type="text" defaultValue="2.9%" className="h-8 text-sm" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
