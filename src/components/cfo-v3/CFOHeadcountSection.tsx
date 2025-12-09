import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Users, DollarSign } from 'lucide-react';
import { HeadcountRow } from '@/hooks/useCFOStudioV3';
import { cn } from '@/lib/utils';

interface CFOHeadcountSectionProps {
  headcount: HeadcountRow[];
  onUpdate: (index: number, row: HeadcountRow) => void;
}

const formatNumber = (n: number) => n.toLocaleString();
const parseNumber = (s: string) => parseInt(s.replace(/,/g, '')) || 0;

export function CFOHeadcountSection({ headcount, onUpdate }: CFOHeadcountSectionProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const totals = headcount.reduce(
    (acc, row) => ({
      year1: acc.year1 + row.year1Count,
      year2: acc.year2 + row.year2Count,
      year3: acc.year3 + row.year3Count,
      cost1: acc.cost1 + row.year1Count * row.avgSalary,
      cost2: acc.cost2 + row.year2Count * row.avgSalary,
      cost3: acc.cost3 + row.year3Count * row.avgSalary,
    }),
    { year1: 0, year2: 0, year3: 0, cost1: 0, cost2: 0, cost3: 0 }
  );

  return (
    <section id="headcount" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            Headcount Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-3 pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2025</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2026</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2027</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Salary</span>
          </div>

          {headcount.map((row, index) => (
            <div key={row.department} className="grid grid-cols-5 gap-3 items-center py-2 border-b border-border/50">
              <span className="text-sm font-medium text-foreground">{row.department}</span>
              <Input
                type="number"
                value={row.year1Count}
                onChange={(e) => onUpdate(index, { ...row, year1Count: parseInt(e.target.value) || 0 })}
                className="h-9 text-sm text-center"
              />
              <Input
                type="number"
                value={row.year2Count}
                onChange={(e) => onUpdate(index, { ...row, year2Count: parseInt(e.target.value) || 0 })}
                className="h-9 text-sm text-center"
              />
              <Input
                type="number"
                value={row.year3Count}
                onChange={(e) => onUpdate(index, { ...row, year3Count: parseInt(e.target.value) || 0 })}
                className="h-9 text-sm text-center"
              />
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={formatNumber(row.avgSalary)}
                  onChange={(e) => onUpdate(index, { ...row, avgSalary: parseNumber(e.target.value) })}
                  className="pl-6 h-9 text-sm font-mono"
                />
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div className="grid grid-cols-5 gap-3 items-center py-3 mt-2 bg-muted/30 rounded-lg px-2">
            <span className="text-sm font-semibold text-foreground">Total Headcount</span>
            <span className="text-sm font-bold text-center">{totals.year1}</span>
            <span className="text-sm font-bold text-center">{totals.year2}</span>
            <span className="text-sm font-bold text-center">{totals.year3}</span>
            <span className="text-xs text-muted-foreground">—</span>
          </div>

          <div className="grid grid-cols-5 gap-3 items-center py-3 bg-primary/5 rounded-lg px-2">
            <span className="text-sm font-semibold text-foreground">Total Payroll</span>
            <span className="text-sm font-bold">${formatNumber(totals.cost1)}</span>
            <span className="text-sm font-bold">${formatNumber(totals.cost2)}</span>
            <span className="text-sm font-bold">${formatNumber(totals.cost3)}</span>
            <span className="text-xs text-muted-foreground">→ OpEx</span>
          </div>

          {/* Assumptions Expander */}
          <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
              <ChevronDown className={cn("w-4 h-4 transition-transform", assumptionsOpen && "rotate-180")} />
              Headcount Assumptions
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Avg Salary Growth</label>
                  <Input type="text" defaultValue="5%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Benefits %</label>
                  <Input type="text" defaultValue="25%" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hiring Lead Time</label>
                  <Input type="text" defaultValue="2 months" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Attrition Rate</label>
                  <Input type="text" defaultValue="10%" className="h-8 text-sm" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
