import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sliders, TrendingUp, CreditCard, DollarSign, Calendar, ArrowLeft, Sparkles, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { GrowthCACCalculator } from '@/components/cfo/calculators/GrowthCACCalculator';
import { SubscriptionRevenueCalculator } from '@/components/cfo/calculators/SubscriptionRevenueCalculator';
import { AdRevenueCalculator } from '@/components/cfo/calculators/AdRevenueCalculator';
import { EventsAwardsCalculator } from '@/components/cfo/calculators/EventsAwardsCalculator';
import { AssumptionsSummaryPanel } from '@/components/cfo/AssumptionsSummaryPanel';

export default function CFOAssumptionStudio() {
  const navigate = useNavigate();
  const { rdCount, cfoOverrideCount, schemaCount, isLoading, deleteAssumption, cfoAssumptions } = useCFOAssumptions();
  const [activeTab, setActiveTab] = useState('growth');

  const handleResetAll = async () => {
    // Delete all CFO overrides
    if (cfoAssumptions) {
      for (const assumption of cfoAssumptions) {
        deleteAssumption(assumption.metric_key);
      }
    }
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
            <Button onClick={() => navigate('/board/proforma')} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Pro Forma
            </Button>
          </div>
        </div>

        {/* Info Alert */}
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
                <GrowthCACCalculator />
              </TabsContent>

              <TabsContent value="subscriptions">
                <SubscriptionRevenueCalculator />
              </TabsContent>

              <TabsContent value="ads">
                <AdRevenueCalculator />
              </TabsContent>

              <TabsContent value="events">
                <EventsAwardsCalculator />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Key Assumptions Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AssumptionsSummaryPanel onResetAll={handleResetAll} />
          </div>
        </div>
      </div>
    </div>
  );
}
