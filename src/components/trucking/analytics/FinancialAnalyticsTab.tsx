import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfMonth, startOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { DollarSign, TrendingUp, Package, Users, Calendar, Repeat, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

interface FinancialAnalyticsTabProps {
  dateRange?: { from: Date; to: Date };
}

interface FinancialData {
  // Revenue metrics (based on when loads were ADDED, not when they exist)
  newRevenueToday: number;
  newRevenueThisMonth: number;
  newRevenueThisYear: number;
  totalBoardValue: number;
  
  // Load counts
  loadsAddedToday: number;
  loadsAddedThisMonth: number;
  loadsAddedThisYear: number;
  
  // By customer
  revenueByCustomer: { name: string; revenue: number; loadCount: number }[];
  
  // Trends
  dailyRevenueTrend: { date: string; revenue: number; loads: number }[];
  monthlyRevenueTrend: { month: string; revenue: number; loads: number }[];
  
  // Booked revenue
  bookedRevenueToday: number;
  bookedRevenueThisMonth: number;
}

const TIMEZONE = 'America/Chicago';
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function FinancialAnalyticsTab({ dateRange }: FinancialAnalyticsTabProps) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const zonedNow = toZonedTime(now, TIMEZONE);
      
      const todayStart = fromZonedTime(startOfDay(zonedNow), TIMEZONE).toISOString();
      const todayEnd = fromZonedTime(endOfDay(zonedNow), TIMEZONE).toISOString();
      const monthStart = fromZonedTime(startOfMonth(zonedNow), TIMEZONE).toISOString();
      const yearStart = fromZonedTime(startOfYear(zonedNow), TIMEZONE).toISOString();

      // Fetch loads with created_at for "added" metrics
      const [
        loadsTodayRes,
        loadsMonthRes,
        loadsYearRes,
        allActiveLoadsRes,
        bookedTodayRes,
        bookedMonthRes
      ] = await Promise.all([
        // Loads ADDED today (by created_at)
        supabase
          .from('trucking_loads')
          .select('id, target_rate, shipper_name, created_at')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        // Loads ADDED this month
        supabase
          .from('trucking_loads')
          .select('id, target_rate, shipper_name, created_at')
          .gte('created_at', monthStart),
        // Loads ADDED this year
        supabase
          .from('trucking_loads')
          .select('id, target_rate, shipper_name, created_at')
          .gte('created_at', yearStart),
        // All active loads (current board value)
        supabase
          .from('trucking_loads')
          .select('id, target_rate, status')
          .eq('is_active', true),
        // Loads BOOKED today (by updated_at when status changed)
        supabase
          .from('trucking_loads')
          .select('id, target_rate')
          .eq('status', 'booked')
          .gte('updated_at', todayStart)
          .lte('updated_at', todayEnd),
        // Loads BOOKED this month
        supabase
          .from('trucking_loads')
          .select('id, target_rate')
          .eq('status', 'booked')
          .gte('updated_at', monthStart),
      ]);

      const loadsToday = loadsTodayRes.data || [];
      const loadsMonth = loadsMonthRes.data || [];
      const loadsYear = loadsYearRes.data || [];
      const allActiveLoads = allActiveLoadsRes.data || [];
      const bookedToday = bookedTodayRes.data || [];
      const bookedMonth = bookedMonthRes.data || [];

      // Calculate revenue metrics
      const newRevenueToday = loadsToday.reduce((sum, l) => sum + (l.target_rate || 0), 0);
      const newRevenueThisMonth = loadsMonth.reduce((sum, l) => sum + (l.target_rate || 0), 0);
      const newRevenueThisYear = loadsYear.reduce((sum, l) => sum + (l.target_rate || 0), 0);
      const totalBoardValue = allActiveLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0);

      // Revenue by customer
      const customerMap: Record<string, { revenue: number; loadCount: number }> = {};
      loadsMonth.forEach(load => {
        const name = load.shipper_name || 'Unknown';
        if (!customerMap[name]) {
          customerMap[name] = { revenue: 0, loadCount: 0 };
        }
        customerMap[name].revenue += load.target_rate || 0;
        customerMap[name].loadCount += 1;
      });

      const revenueByCustomer = Object.entries(customerMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Daily trend (last 14 days)
      const last14Days = eachDayOfInterval({
        start: fromZonedTime(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), TIMEZONE),
        end: zonedNow
      });

      const dailyRevenueTrend = last14Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLoads = loadsYear.filter(l => 
          format(toZonedTime(new Date(l.created_at), TIMEZONE), 'yyyy-MM-dd') === dayStr
        );
        return {
          date: format(day, 'MMM d'),
          revenue: dayLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0),
          loads: dayLoads.length
        };
      });

      // Monthly trend (last 6 months)
      const last6Months = eachMonthOfInterval({
        start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        end: now
      });

      // We need to fetch more data for monthly trend
      const sixMonthsAgo = fromZonedTime(new Date(now.getFullYear(), now.getMonth() - 5, 1), TIMEZONE).toISOString();
      const { data: loadsForTrend } = await supabase
        .from('trucking_loads')
        .select('id, target_rate, created_at')
        .gte('created_at', sixMonthsAgo);

      const monthlyRevenueTrend = last6Months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthLoads = (loadsForTrend || []).filter(l =>
          format(toZonedTime(new Date(l.created_at), TIMEZONE), 'yyyy-MM') === monthStr
        );
        return {
          month: format(month, 'MMM'),
          revenue: monthLoads.reduce((sum, l) => sum + (l.target_rate || 0), 0),
          loads: monthLoads.length
        };
      });

      setData({
        newRevenueToday,
        newRevenueThisMonth,
        newRevenueThisYear,
        totalBoardValue,
        loadsAddedToday: loadsToday.length,
        loadsAddedThisMonth: loadsMonth.length,
        loadsAddedThisYear: loadsYear.length,
        revenueByCustomer,
        dailyRevenueTrend,
        monthlyRevenueTrend,
        bookedRevenueToday: bookedToday.reduce((sum, l) => sum + (l.target_rate || 0), 0),
        bookedRevenueThisMonth: bookedMonth.reduce((sum, l) => sum + (l.target_rate || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Added Today</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.newRevenueToday)}</p>
                <p className="text-xs text-muted-foreground">{data.loadsAddedToday} loads</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Added This Month</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.newRevenueThisMonth)}</p>
                <p className="text-xs text-muted-foreground">{data.loadsAddedThisMonth} loads</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Booked Today</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.bookedRevenueToday)}</p>
                <p className="text-xs text-muted-foreground">Confirmed revenue</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Board Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totalBoardValue)}</p>
                <p className="text-xs text-muted-foreground">Active loads</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Revenue Added (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyRevenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelClassName="font-medium"
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyRevenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Loads'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="loads" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} yAxisId={0} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Revenue by Customer (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenueByCustomer}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="revenue"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {data.revenueByCustomer.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.revenueByCustomer.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-sm">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(customer.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{customer.loadCount} loads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
