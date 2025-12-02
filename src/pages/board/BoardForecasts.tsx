import { useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// Sample forecast data - in production, this would come from the forecast engine
const revenueData = [
  { month: 'Jan 25', revenue: 50000, costs: 35000, profit: 15000 },
  { month: 'Apr 25', revenue: 85000, costs: 45000, profit: 40000 },
  { month: 'Jul 25', revenue: 150000, costs: 70000, profit: 80000 },
  { month: 'Oct 25', revenue: 250000, costs: 100000, profit: 150000 },
  { month: 'Jan 26', revenue: 400000, costs: 150000, profit: 250000 },
  { month: 'Apr 26', revenue: 600000, costs: 200000, profit: 400000 },
  { month: 'Jul 26', revenue: 900000, costs: 280000, profit: 620000 },
  { month: 'Oct 26', revenue: 1200000, costs: 350000, profit: 850000 },
  { month: 'Jan 27', revenue: 1600000, costs: 450000, profit: 1150000 },
  { month: 'Apr 27', revenue: 2100000, costs: 550000, profit: 1550000 },
  { month: 'Jul 27', revenue: 2700000, costs: 700000, profit: 2000000 },
  { month: 'Oct 27', revenue: 3500000, costs: 850000, profit: 2650000 },
];

const cashFlowData = [
  { quarter: 'Q1 2025', inflow: 50000, outflow: 40000, net: 10000 },
  { quarter: 'Q2 2025', inflow: 85000, outflow: 55000, net: 30000 },
  { quarter: 'Q3 2025', inflow: 150000, outflow: 85000, net: 65000 },
  { quarter: 'Q4 2025', inflow: 250000, outflow: 120000, net: 130000 },
  { quarter: 'Q1 2026', inflow: 400000, outflow: 180000, net: 220000 },
  { quarter: 'Q2 2026', inflow: 600000, outflow: 250000, net: 350000 },
  { quarter: 'Q3 2026', inflow: 900000, outflow: 350000, net: 550000 },
  { quarter: 'Q4 2026', inflow: 1200000, outflow: 450000, net: 750000 },
];

const summaryMetrics = [
  { label: 'Year 1 Revenue', value: '$535K', change: '+420%' },
  { label: 'Year 2 Revenue', value: '$3.1M', change: '+480%' },
  { label: 'Year 3 Revenue', value: '$9.9M', change: '+219%' },
  { label: 'Break-even', value: 'Q3 2025', change: 'On track' },
];

export default function BoardForecasts() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('3-year');

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <BoardLayout>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white mb-6"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">3-Year AI Forecasts</h1>
              <p className="text-slate-400">AI-generated financial projections</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryMetrics.map((metric, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-emerald-400">{metric.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700">
              Revenue Projections
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-slate-700">
              Cost Structure
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-slate-700">
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue & Profit Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue vs Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costs" name="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quarterly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" name="Outflow" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BoardLayout>
  );
}
