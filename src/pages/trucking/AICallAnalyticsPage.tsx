import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruckingPageWrapper } from '@/components/trucking/TruckingPageWrapper';
import { CEIKPICards } from '@/components/trucking/analytics/CEIKPICards';
import { CEIBandChart } from '@/components/trucking/analytics/CEIBandChart';
import { CEICallsTable } from '@/components/trucking/analytics/CEICallsTable';
import { CEICallDetailDrawer } from '@/components/trucking/analytics/CEICallDetailDrawer';
import { CEIDailyReportPanel } from '@/components/trucking/analytics/CEIDailyReportPanel';
import { useTruckingCalls, useTruckingCallsStats, TruckingCall } from '@/hooks/trucking/useTruckingCalls';

export default function AICallAnalyticsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedCall, setSelectedCall] = useState<TruckingCall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { data: calls, isLoading: callsLoading } = useTruckingCalls(date);
  const stats = useTruckingCallsStats(date);

  const handleSelectCall = (call: TruckingCall) => {
    setSelectedCall(call);
    setDrawerOpen(true);
  };

  return (
    <TruckingPageWrapper
      title="AI Call Performance"
      description="Daily outcomes, CEI score, and what to improve next."
      action={
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <CEIKPICards
          totalCalls={stats.totalCalls}
          resolvedWithoutHandoffPct={stats.resolvedWithoutHandoffPct}
          handoffRequestedPct={stats.handoffRequestedPct}
          leadCreatedPct={stats.leadCreatedPct}
          avgCeiScore={stats.avgCeiScore}
          isLoading={stats.isLoading}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CEIBandChart 
            breakdown={stats.ceiBandBreakdown} 
            isLoading={stats.isLoading} 
          />
          <CEIDailyReportPanel date={date} />
        </div>

        {/* Calls Table */}
        <CEICallsTable
          calls={calls || []}
          isLoading={callsLoading}
          onSelectCall={handleSelectCall}
        />

        {/* Call Detail Drawer */}
        <CEICallDetailDrawer
          call={selectedCall}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </TruckingPageWrapper>
  );
}
