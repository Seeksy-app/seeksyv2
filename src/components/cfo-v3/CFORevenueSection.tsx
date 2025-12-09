import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, DollarSign } from 'lucide-react';
import { RevenueModel, YearlyValues } from '@/hooks/useCFOStudioV3';
import { cn } from '@/lib/utils';

interface CFORevenueSectionProps {
  revenue: RevenueModel;
  onUpdate: (key: keyof RevenueModel, value: any) => void;
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

export function CFORevenueSection({ revenue, onUpdate }: CFORevenueSectionProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  return (
    <section id="revenue" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            Revenue Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue Line</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2025</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2026</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2027</span>
          </div>

          <YearlyInput
            label="SaaS Subscriptions"
            values={revenue.subscriptions}
            onChange={(v) => onUpdate('subscriptions', v)}
          />
          <YearlyInput
            label="AI & Production Tools"
            values={revenue.aiTools}
            onChange={(v) => onUpdate('aiTools', v)}
          />
          <YearlyInput
            label="Advertising + Marketplace"
            values={revenue.advertising}
            onChange={(v) => onUpdate('advertising', v)}
          />
          
          {/* Enterprise Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Enterprise Licensing</span>
              <Switch
                checked={revenue.enterpriseEnabled}
                onCheckedChange={(checked) => onUpdate('enterpriseEnabled', checked)}
              />
            </div>
          </div>
          
          {revenue.enterpriseEnabled && (
            <YearlyInput
              label="Enterprise Licensing"
              values={revenue.enterprise}
              onChange={(v) => onUpdate('enterprise', v)}
            />
          )}

          {/* Assumptions Expander */}
          <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
              <ChevronDown className={cn("w-4 h-4 transition-transform", assumptionsOpen && "rotate-180")} />
              Revenue Assumptions
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Avg Pricing Growth</label>
                  <Input type="text" defaultValue="10%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">YoY Growth Rate</label>
                  <Input type="text" defaultValue="150%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Churn Rate</label>
                  <Input type="text" defaultValue="5%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Adoption Rate</label>
                  <Input type="text" defaultValue="25%" className="h-8 text-sm" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
