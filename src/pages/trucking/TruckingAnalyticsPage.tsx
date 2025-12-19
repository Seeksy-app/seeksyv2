import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, Phone, BarChart3, DollarSign, MessageSquare, TrendingUp, Users, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruckingPageWrapper } from '@/components/trucking/TruckingPageWrapper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// AI Calls tab components
import { CEIKPICards } from '@/components/trucking/analytics/CEIKPICards';
import { CEIEngagementCards } from '@/components/trucking/analytics/CEIEngagementCards';
import { CEIBandChart } from '@/components/trucking/analytics/CEIBandChart';
import { CEICallsTable } from '@/components/trucking/analytics/CEICallsTable';
import { CEICallDetailDrawer } from '@/components/trucking/analytics/CEICallDetailDrawer';
import { CEIDailyReportPanel } from '@/components/trucking/analytics/CEIDailyReportPanel';
import { useTruckingCalls, useTruckingCallsStats, TruckingCall } from '@/hooks/trucking/useTruckingCalls';

// General analytics
import TruckingAnalytics from '@/components/trucking/TruckingAnalytics';

// Financial analytics
import { FinancialAnalyticsTab } from '@/components/trucking/analytics/FinancialAnalyticsTab';

// Sentiment analytics  
import { SentimentAnalyticsTab } from '@/components/trucking/analytics/SentimentAnalyticsTab';

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'mtd' | 'ytd' | 'all' | 'custom';

const tabs = [
  { id: 'ai-calls', label: 'AI Calls', icon: Phone },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
  { id: 'general', label: 'General', icon: BarChart3 },
];

export default function TruckingAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('ai-calls');
  const [date, setDate] = useState<Date>(new Date());
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [selectedCall, setSelectedCall] = useState<TruckingCall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // AI Calls data
  const { data: calls, isLoading: callsLoading } = useTruckingCalls(date);
  const stats = useTruckingCallsStats(date);

  const handleSelectCall = (call: TruckingCall) => {
    setSelectedCall(call);
    setDrawerOpen(true);
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setDate(today);
        setDateRange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDate(yesterday);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case '7d':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case '30d':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case 'mtd':
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case 'ytd':
        setDateRange({ from: startOfYear(today), to: today });
        break;
      case 'all':
        setDateRange(undefined);
        break;
      case 'custom':
        break;
    }
  };

  const presetLabels: Record<DatePreset, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    mtd: 'Month to Date',
    ytd: 'Year to Date',
    all: 'All Time',
    custom: 'Custom',
  };

  return (
    <TruckingPageWrapper
      title="Analytics"
      description="Performance metrics, financial insights, and AI call analytics"
      action={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[120px]">
                {presetLabels[datePreset]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePresetChange('today')}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('yesterday')}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('7d')}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('30d')}>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('mtd')}>Month to Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('ytd')}>Year to Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePresetChange('all')}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('w-[200px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange 
                  ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                  : 'All Time'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setDateRange({ from: d, to: d });
                    setDatePreset('custom');
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AI Calls Tab */}
        <TabsContent value="ai-calls" className="space-y-6">
          <CEIKPICards
            totalCalls={stats.totalCalls}
            resolvedWithoutHandoffPct={stats.resolvedWithoutHandoffPct}
            handoffRequestedPct={stats.handoffRequestedPct}
            leadCreatedPct={stats.leadCreatedPct}
            avgCeiScore={stats.avgCeiScore}
            isLoading={stats.isLoading}
          />

          <CEIEngagementCards
            avgDurationSeconds={stats.avgDurationSeconds}
            engagedCallsCount={stats.engagedCallsCount}
            quickHangupsCount={stats.quickHangupsCount}
            avgTimeToHandoffSeconds={stats.avgTimeToHandoffSeconds}
            totalCalls={stats.totalCalls}
            isLoading={stats.isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CEIBandChart breakdown={stats.ceiBandBreakdown} isLoading={stats.isLoading} />
            <CEIDailyReportPanel date={date} />
          </div>

          <CEICallsTable
            calls={calls || []}
            isLoading={callsLoading}
            onSelectCall={handleSelectCall}
          />

          <CEICallDetailDrawer
            call={selectedCall}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <FinancialAnalyticsTab dateRange={dateRange} />
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <SentimentAnalyticsTab dateRange={dateRange} />
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <TruckingAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </TruckingPageWrapper>
  );
}
