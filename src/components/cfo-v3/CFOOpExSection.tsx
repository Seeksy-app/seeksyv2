import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Briefcase, DollarSign, Calculator, TrendingUp, Target } from 'lucide-react';
import { OpExModel, YearlyValues } from '@/hooks/useCFOStudioV3';
import { cn } from '@/lib/utils';

interface CFOOpExSectionProps {
  opex: OpExModel;
  onUpdate: (key: keyof OpExModel, value: YearlyValues) => void;
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

function InlineCalculator({ 
  title, 
  icon: Icon, 
  children,
  onApply 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
  onApply: () => void;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="pt-2 space-y-4">
          {children}
          <Button size="sm" onClick={onApply} className="w-full">
            Apply to Model
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CFOOpExSection({ opex, onUpdate }: CFOOpExSectionProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const totalOpEx = {
    year1: opex.productEngineering.year1 + opex.salesMarketing.year1 + opex.gna.year1 + opex.customerSuccess.year1 + opex.contractors.year1,
    year2: opex.productEngineering.year2 + opex.salesMarketing.year2 + opex.gna.year2 + opex.customerSuccess.year2 + opex.contractors.year2,
    year3: opex.productEngineering.year3 + opex.salesMarketing.year3 + opex.gna.year3 + opex.customerSuccess.year3 + opex.contractors.year3,
  };

  return (
    <section id="opex" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-purple-500" />
            </div>
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2025</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2026</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2027</span>
          </div>

          <YearlyInput
            label="Product & Engineering"
            values={opex.productEngineering}
            onChange={(v) => onUpdate('productEngineering', v)}
          />
          <YearlyInput
            label="Sales & Marketing"
            values={opex.salesMarketing}
            onChange={(v) => onUpdate('salesMarketing', v)}
          />
          <YearlyInput
            label="General & Administrative"
            values={opex.gna}
            onChange={(v) => onUpdate('gna', v)}
          />
          <YearlyInput
            label="Customer Success"
            values={opex.customerSuccess}
            onChange={(v) => onUpdate('customerSuccess', v)}
          />
          <YearlyInput
            label="Contractors / AI Automation"
            values={opex.contractors}
            onChange={(v) => onUpdate('contractors', v)}
          />

          {/* Total Row */}
          <div className="grid grid-cols-4 gap-4 items-center py-3 mt-2 bg-muted/30 rounded-lg px-2">
            <span className="text-sm font-semibold text-foreground">Total OpEx</span>
            <span className="text-sm font-bold text-foreground">${formatNumber(totalOpEx.year1)}</span>
            <span className="text-sm font-bold text-foreground">${formatNumber(totalOpEx.year2)}</span>
            <span className="text-sm font-bold text-foreground">${formatNumber(totalOpEx.year3)}</span>
          </div>

          {/* Inline Calculators */}
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Calculators</h4>
            
            <InlineCalculator title="ROI Calculator" icon={Calculator} onApply={() => {}}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Marketing Spend</label>
                  <Input type="text" defaultValue="$180,000" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expected Revenue</label>
                  <Input type="text" defaultValue="$540,000" className="h-8 text-sm" />
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-400">Projected ROI: 200%</span>
              </div>
            </InlineCalculator>

            <InlineCalculator title="Breakeven Calculator" icon={Target} onApply={() => {}}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Fixed Costs</label>
                  <Input type="text" defaultValue="$768,000" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Gross Margin %</label>
                  <Input type="text" defaultValue="82%" className="h-8 text-sm" />
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-400">Breakeven Revenue: $936,585 (Month 18)</span>
              </div>
            </InlineCalculator>

            <InlineCalculator title="Growth Impact Calculator" icon={TrendingUp} onApply={() => {}}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Growth Rate %</label>
                  <Input type="text" defaultValue="150%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Base Revenue</label>
                  <Input type="text" defaultValue="$660,000" className="h-8 text-sm" />
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <span className="text-sm text-purple-700 dark:text-purple-400">Year 3 Projection: $4,125,000</span>
              </div>
            </InlineCalculator>
          </div>

          {/* Assumptions Expander */}
          <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
              <ChevronDown className={cn("w-4 h-4 transition-transform", assumptionsOpen && "rotate-180")} />
              OpEx Assumptions
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">OpEx Growth Rate</label>
                  <Input type="text" defaultValue="80%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">R&D % of OpEx</label>
                  <Input type="text" defaultValue="45%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">S&M % of OpEx</label>
                  <Input type="text" defaultValue="30%" className="h-8 text-sm" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
