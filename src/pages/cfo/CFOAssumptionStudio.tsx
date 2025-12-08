import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sliders, TrendingUp, CreditCard, DollarSign, Calendar, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { GrowthCACCalculator } from '@/components/cfo/calculators/GrowthCACCalculator';
import { SubscriptionRevenueCalculator } from '@/components/cfo/calculators/SubscriptionRevenueCalculator';
import { AdRevenueCalculator } from '@/components/cfo/calculators/AdRevenueCalculator';
import { EventsAwardsCalculator } from '@/components/cfo/calculators/EventsAwardsCalculator';

export default function CFOAssumptionStudio() {
  const navigate = useNavigate();
  const { rdCount, cfoOverrideCount, isLoading } = useCFOAssumptions();

  return (
    <div className="w-full space-y-6 p-6">
      <Button
        variant="ghost"
        className="text-slate-500 hover:text-slate-700 -ml-2"
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
            <h1 className="text-3xl font-bold text-slate-900">CFO Assumption Studio</h1>
            <p className="text-slate-500">Configure financial assumptions for AI Pro Forma</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
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

      {/* Calculator Tabs */}
      <Tabs defaultValue="growth" className="space-y-6">
        <TabsList className="bg-slate-100 border border-slate-200 p-1">
          <TabsTrigger value="growth" className="gap-2 data-[state=active]:bg-white">
            <TrendingUp className="w-4 h-4" />
            Growth & CAC
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2 data-[state=active]:bg-white">
            <CreditCard className="w-4 h-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-2 data-[state=active]:bg-white">
            <DollarSign className="w-4 h-4" />
            Ad Revenue
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-white">
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

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <CardContent className="p-4">
          <p className="text-sm text-indigo-800">
            <strong>How it works:</strong> Adjust sliders to set your assumptions, then click "Save to Pro Forma". 
            Your CFO overrides will take precedence over R&D defaults when generating AI forecasts.
            Navigate to the AI-Powered 3-Year Pro Forma to see your assumptions in action.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
