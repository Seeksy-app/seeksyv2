import { useState } from 'react';

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

import { motion, AnimatePresence } from 'framer-motion';

const tabContentVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
};

export default function BoardGTM() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("market-overview");

  return (
    <div className="space-y-6 w-full">
        {/* Header */}
        <div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {activeTab === "market-overview" && <MarketOverviewTab />}
                {activeTab === "gtm-strategy" && <GTMStrategyTab />}
                {activeTab === "competitive" && <CompetitiveLandscapeTab />}
                {activeTab === "metrics" && <KeyMetricsTab />}
                {activeTab === "channels" && <ChannelsTab />}
                {activeTab === "roi" && <ROICalculatorTab />}
                {activeTab === "swot" && <SWOTAnalysisTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
    </div>
  );
}
