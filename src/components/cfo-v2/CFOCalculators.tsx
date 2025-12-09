import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Calculator, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ROICalculatorProps {
  marketingSpend: number;
  cac: number;
  churn: number;
  arpu: number;
  onApply: (results: { roi: number; ltvCac: number; payback: number }) => void;
}

export function ROICalculator({ marketingSpend, cac, churn, arpu, onApply }: ROICalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSpend, setLocalSpend] = useState(marketingSpend);
  const [localCac, setLocalCac] = useState(cac);
  const [localChurn, setLocalChurn] = useState(churn);
  const [localArpu, setLocalArpu] = useState(arpu);

  const results = useMemo(() => {
    const churnRate = localChurn / 100;
    const ltv = churnRate > 0 ? localArpu / churnRate : localArpu * 24;
    const ltvCac = localCac > 0 ? ltv / localCac : 0;
    const newCustomers = localCac > 0 ? localSpend / localCac : 0;
    const revenueFromNew = newCustomers * ltv;
    const roi = localSpend > 0 ? ((revenueFromNew - localSpend) / localSpend) * 100 : 0;
    const payback = localArpu > 0 ? localCac / localArpu : 0;
    return { roi, ltvCac, payback, ltv };
  }, [localSpend, localCac, localChurn, localArpu]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">ROI Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Marketing Spend ($)</Label>
              <Input
                type="number"
                value={localSpend}
                onChange={(e) => setLocalSpend(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">CAC ($)</Label>
              <Input
                type="number"
                value={localCac}
                onChange={(e) => setLocalCac(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Monthly Churn (%)</Label>
              <Input
                type="number"
                value={localChurn}
                onChange={(e) => setLocalChurn(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">ARPU ($)</Label>
              <Input
                type="number"
                value={localArpu}
                onChange={(e) => setLocalArpu(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className={cn("font-bold", results.roi >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.roi.toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">LTV:CAC</p>
              <p className={cn("font-bold", results.ltvCac >= 3 ? "text-emerald-600" : "text-amber-600")}>
                {results.ltvCac.toFixed(1)}x
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Payback</p>
              <p className="font-bold">{results.payback.toFixed(1)} mo</p>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={() => onApply({ roi: results.roi, ltvCac: results.ltvCac, payback: results.payback })}
          >
            Apply to Model
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

interface BreakevenCalculatorProps {
  fixedOpex: number;
  variableOpexPct: number;
  revenueGrowth: number;
  initialRevenue: number;
  onApply: (results: { breakEvenMonth: number; breakEvenRunRate: number }) => void;
}

export function BreakevenCalculator({
  fixedOpex,
  variableOpexPct,
  revenueGrowth,
  initialRevenue,
  onApply,
}: BreakevenCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFixed, setLocalFixed] = useState(fixedOpex);
  const [localVariable, setLocalVariable] = useState(variableOpexPct);
  const [localGrowth, setLocalGrowth] = useState(revenueGrowth);

  const results = useMemo(() => {
    const monthlyGrowthRate = 1 + (localGrowth / 100) / 12;
    let cumulative = 0;
    let breakEvenMonth = null;
    let breakEvenRunRate = 0;
    
    for (let month = 1; month <= 36; month++) {
      const monthlyRevenue = initialRevenue / 12 * Math.pow(monthlyGrowthRate, month);
      const variableCost = monthlyRevenue * (localVariable / 100);
      const monthlyCost = localFixed / 12 + variableCost;
      const monthlyEbitda = monthlyRevenue - monthlyCost;
      cumulative += monthlyEbitda;
      
      if (cumulative > 0 && breakEvenMonth === null) {
        breakEvenMonth = month;
        breakEvenRunRate = monthlyRevenue * 12;
        break;
      }
    }
    
    return {
      breakEvenMonth: breakEvenMonth || 36,
      breakEvenRunRate: breakEvenRunRate || initialRevenue * Math.pow(monthlyGrowthRate, 36),
    };
  }, [localFixed, localVariable, localGrowth, initialRevenue]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-sm">Breakeven Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Fixed OpEx ($/yr)</Label>
              <Input
                type="number"
                value={localFixed}
                onChange={(e) => setLocalFixed(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Variable OpEx (%)</Label>
              <Input
                type="number"
                value={localVariable}
                onChange={(e) => setLocalVariable(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Revenue Growth (%)</Label>
              <Input
                type="number"
                value={localGrowth}
                onChange={(e) => setLocalGrowth(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Breakeven Month</p>
              <p className="font-bold text-emerald-600">Month {results.breakEvenMonth}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Run Rate at Breakeven</p>
              <p className="font-bold">
                ${(results.breakEvenRunRate / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={() => onApply(results)}
          >
            Apply to Model
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

interface GrowthImpactCalculatorProps {
  baseRevenue: number[];
  baseEbitda: number[];
  onApply: (results: { deltaRevenue: number[]; deltaEbitda: number[]; deltaRunway: number }) => void;
}

export function GrowthImpactCalculator({
  baseRevenue,
  baseEbitda,
  onApply,
}: GrowthImpactCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [growthDelta, setGrowthDelta] = useState(10);
  const [pricingDelta, setPricingDelta] = useState(0);
  const [cacDelta, setCacDelta] = useState(0);
  const [churnDelta, setChurnDelta] = useState(0);

  const results = useMemo(() => {
    const growthMultiplier = 1 + growthDelta / 100;
    const pricingMultiplier = 1 + pricingDelta / 100;
    const churnImpact = 1 - churnDelta / 100;
    
    const deltaRevenue = baseRevenue.map((rev, i) => 
      rev * growthMultiplier * pricingMultiplier * churnImpact - rev
    );
    
    const deltaEbitda = baseEbitda.map((eb, i) => 
      eb + deltaRevenue[i] * 0.7 // Assuming 70% flow-through
    );
    
    const currentBurn = baseEbitda[0] < 0 ? Math.abs(baseEbitda[0]) / 12 : 0;
    const newBurn = deltaEbitda[0] < 0 ? Math.abs(deltaEbitda[0]) / 12 : 0;
    const deltaRunway = currentBurn > 0 ? ((currentBurn - newBurn) / currentBurn) * 12 : 0;
    
    return { deltaRevenue, deltaEbitda, deltaRunway };
  }, [growthDelta, pricingDelta, cacDelta, churnDelta, baseRevenue, baseEbitda]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">Growth Impact Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Growth Δ (%)</Label>
              <Input
                type="number"
                value={growthDelta}
                onChange={(e) => setGrowthDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Pricing Δ (%)</Label>
              <Input
                type="number"
                value={pricingDelta}
                onChange={(e) => setPricingDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">CAC Δ (%)</Label>
              <Input
                type="number"
                value={cacDelta}
                onChange={(e) => setCacDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Churn Δ (%)</Label>
              <Input
                type="number"
                value={churnDelta}
                onChange={(e) => setChurnDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">ΔRevenue Y3</p>
              <p className={cn("font-bold", results.deltaRevenue[2] >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaRevenue[2] >= 0 ? '+' : ''}{(results.deltaRevenue[2] / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">ΔEBITDA Y3</p>
              <p className={cn("font-bold", results.deltaEbitda[2] >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaEbitda[2] >= 0 ? '+' : ''}{(results.deltaEbitda[2] / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">ΔRunway</p>
              <p className={cn("font-bold", results.deltaRunway >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaRunway >= 0 ? '+' : ''}{results.deltaRunway.toFixed(1)} mo
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={() => onApply(results)}
          >
            Apply to Model
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
