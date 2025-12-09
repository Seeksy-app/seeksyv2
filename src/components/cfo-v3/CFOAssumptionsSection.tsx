import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Settings, TrendingUp, Server, Briefcase, Users, DollarSign, Percent } from 'lucide-react';
import { Assumptions } from '@/hooks/useCFOStudioV3';

interface CFOAssumptionsSectionProps {
  assumptions: Assumptions;
  onUpdate: (key: keyof Assumptions, value: number) => void;
}

export function CFOAssumptionsSection({ assumptions, onUpdate }: CFOAssumptionsSectionProps) {
  return (
    <section id="assumptions" className="scroll-mt-32">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-500" />
            </div>
            Model Assumptions
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Drives all calculations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['revenue', 'cogs']} className="space-y-2">
            <AccordionItem value="revenue" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Revenue Drivers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">YoY Growth Rate</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.revenueGrowth}
                        onChange={(e) => onUpdate('revenueGrowth', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Churn Rate</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.churnRate}
                        onChange={(e) => onUpdate('churnRate', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Pricing Growth</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.pricingGrowth}
                        onChange={(e) => onUpdate('pricingGrowth', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">LTV Months</label>
                    <Input
                      type="number"
                      value={assumptions.ltvMonths}
                      onChange={(e) => onUpdate('ltvMonths', parseInt(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cogs" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">COGS Drivers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Target COGS %</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.cogsPercent}
                        onChange={(e) => onUpdate('cogsPercent', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="opex" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">OpEx Drivers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">OpEx Growth Rate</label>
                    <div className="relative">
                      <Input type="number" defaultValue="80" className="h-9 text-sm pr-8" />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">R&D Allocation</label>
                    <div className="relative">
                      <Input type="number" defaultValue="45" className="h-9 text-sm pr-8" />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="headcount" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Headcount Drivers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Headcount Growth</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.headcountGrowth}
                        onChange={(e) => onUpdate('headcountGrowth', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Salary Growth</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={assumptions.salaryGrowth}
                        onChange={(e) => onUpdate('salaryGrowth', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="acquisition" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Acquisition & Pricing</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">CAC (Customer)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        value={assumptions.cacCost}
                        onChange={(e) => onUpdate('cacCost', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm pl-7"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
