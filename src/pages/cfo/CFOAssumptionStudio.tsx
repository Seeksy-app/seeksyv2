import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sliders, TrendingUp, CreditCard, DollarSign, Calendar, ArrowLeft, Sparkles, Info, Lock, Unlock, CheckCircle2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { GrowthCACCalculator } from '@/components/cfo/calculators/GrowthCACCalculator';
import { SubscriptionRevenueCalculator } from '@/components/cfo/calculators/SubscriptionRevenueCalculator';
import { AdRevenueCalculator } from '@/components/cfo/calculators/AdRevenueCalculator';
import { EventsAwardsCalculator } from '@/components/cfo/calculators/EventsAwardsCalculator';
import { AssumptionsSummaryPanel } from '@/components/cfo/AssumptionsSummaryPanel';
import { toast } from 'sonner';

export default function CFOAssumptionStudio() {
  const navigate = useNavigate();
  const { rdCount, cfoOverrideCount, schemaCount, isLoading, deleteAssumption, cfoAssumptions } = useCFOAssumptions();
  const { isLocked, lockedAt, toggleLock, isToggling } = useCFOLockStatus();
  const [activeTab, setActiveTab] = useState('growth');

  const handleResetAll = async () => {
    // Delete all CFO overrides
    if (cfoAssumptions) {
      for (const assumption of cfoAssumptions) {
        deleteAssumption(assumption.metric_key);
      }
    }
  };

  // Handler for when a calculator saves - shows toast with CTA
  const handleCalculatorSave = () => {
    toast.success('Assumptions updated', {
      description: 'Open the AI-Powered 3-Year Pro Forma to see the updated forecast.',
      action: {
        label: 'View Pro Forma',
        onClick: () => navigate('/board/proforma'),
      },
      duration: 6000,
    });
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sliders className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CFO Assumption Studio</h1>
              <p className="text-muted-foreground">Configure financial assumptions for AI Pro Forma forecasts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {schemaCount} total metrics
            </Badge>
            <Badge variant="outline" className="text-sm bg-slate-50 text-slate-700 border-slate-200">
              {rdCount} R&D benchmarks
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
              {cfoOverrideCount} CFO overrides
            </Badge>
            
            {/* Lock Toggle for Board */}
            <div className="flex items-center gap-2 border-l border-border pl-3 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={isLocked}
                      onCheckedChange={(checked) => toggleLock(checked)}
                      disabled={isToggling}
                    />
                    <span className="text-sm font-medium">
                      {isLocked ? 'Locked for Board' : 'Unlock for Board'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    When locked, Board members can only view published assumptions. 
                    They cannot see real-time changes until you unlock.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Button onClick={() => navigate('/board/proforma')} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Pro Forma
            </Button>
          </div>
        </div>

        {/* Live Assumptions Banner */}
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 flex items-center justify-between">
            <div>
              <strong>Your Assumptions Are Live</strong>
              <span className="ml-2">
                These inputs drive all Board-facing financial forecasts. Navigate to the AI-Powered 3-Year Pro Forma to see your assumptions in action.
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-4 bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              onClick={() => navigate('/board/proforma')}
            >
              View Pro Forma
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>

        {/* How it works Info */}
        <Alert className="bg-indigo-50 border-indigo-200">
          <Info className="w-4 h-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>How it works:</strong> Use the calculators below to adjust assumptions. When you click "Save to Pro Forma", 
            your values become CFO overrides that take precedence over R&D benchmarks. Navigate to the AI-Powered 3-Year Pro Forma 
            to see your assumptions in action.
          </AlertDescription>
        </Alert>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr,420px] gap-6 overflow-visible">
          {/* Left: Calculators */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted border border-border p-1">
                <TabsTrigger value="growth" className="gap-2 data-[state=active]:bg-background">
                  <TrendingUp className="w-4 h-4" />
                  Growth & CAC
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2 data-[state=active]:bg-background">
                  <CreditCard className="w-4 h-4" />
                  Subscriptions
                </TabsTrigger>
                <TabsTrigger value="ads" className="gap-2 data-[state=active]:bg-background">
                  <DollarSign className="w-4 h-4" />
                  Ad Revenue
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-background">
                  <Calendar className="w-4 h-4" />
                  Events & Awards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="growth">
                <GrowthCACCalculator onSave={handleCalculatorSave} />
              </TabsContent>

              <TabsContent value="subscriptions">
                <SubscriptionRevenueCalculator onSave={handleCalculatorSave} />
              </TabsContent>

              <TabsContent value="ads">
                <AdRevenueCalculator onSave={handleCalculatorSave} />
              </TabsContent>

              <TabsContent value="events">
                <EventsAwardsCalculator onSave={handleCalculatorSave} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Key Assumptions Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AssumptionsSummaryPanel onResetAll={handleResetAll} />
          </div>
        </div>

        {/* Footer Reminder */}
        <div className="mt-8 p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Want to preview your impact?</strong>
            <span className="ml-2">
              Open the 3-Year Pro Forma to see how your assumptions drive revenue, CAC, churn, and margins.
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/board/proforma')}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Pro Forma
          </Button>
        </div>
      </div>
    </div>
  );
}