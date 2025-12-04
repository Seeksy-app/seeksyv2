import { BoardLayout } from '@/components/board/BoardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketOverviewTab } from '@/components/board/gtm/MarketOverviewTab';
import { GTMStrategyTab } from '@/components/board/gtm/GTMStrategyTab';
import { CompetitiveLandscapeTab } from '@/components/board/gtm/CompetitiveLandscapeTab';
import { KeyMetricsTab } from '@/components/board/gtm/KeyMetricsTab';
import { ChannelsTab } from '@/components/board/gtm/ChannelsTab';
import { ROICalculatorTab } from '@/components/board/gtm/ROICalculatorTab';
import { SWOTAnalysisTab } from '@/components/board/gtm/SWOTAnalysisTab';
import { ShareWithInvestorTab } from '@/components/board/gtm/ShareWithInvestorTab';

export default function BoardGTM() {
  const navigate = useNavigate();

  return (
    <BoardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="text-slate-500 hover:text-slate-700 mb-4 -ml-2"
            onClick={() => navigate('/board')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">GTM Strategy</h1>
              <p className="text-slate-500">Go-to-market plan, channels & acquisition strategy</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="market-overview" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex-wrap gap-1">
            <TabsTrigger value="market-overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Market Overview
            </TabsTrigger>
            <TabsTrigger value="gtm-strategy" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              GTM Strategy
            </TabsTrigger>
            <TabsTrigger value="competitive" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Competitive Landscape
            </TabsTrigger>
            <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Key Metrics
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Channels
            </TabsTrigger>
            <TabsTrigger value="roi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              ROI Calculator
            </TabsTrigger>
            <TabsTrigger value="swot" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              SWOT Analysis
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Share With Investor
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="market-overview" className="mt-0">
              <MarketOverviewTab />
            </TabsContent>
            <TabsContent value="gtm-strategy" className="mt-0">
              <GTMStrategyTab />
            </TabsContent>
            <TabsContent value="competitive" className="mt-0">
              <CompetitiveLandscapeTab />
            </TabsContent>
            <TabsContent value="metrics" className="mt-0">
              <KeyMetricsTab />
            </TabsContent>
            <TabsContent value="channels" className="mt-0">
              <ChannelsTab />
            </TabsContent>
            <TabsContent value="roi" className="mt-0">
              <ROICalculatorTab />
            </TabsContent>
            <TabsContent value="swot" className="mt-0">
              <SWOTAnalysisTab />
            </TabsContent>
            <TabsContent value="share" className="mt-0">
              <ShareWithInvestorTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </BoardLayout>
  );
}
