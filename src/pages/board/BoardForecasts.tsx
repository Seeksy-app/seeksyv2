import { useState } from 'react';
import { BoardLayout } from '@/components/board/BoardLayout';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { DataModeLabel, DataModeBadge } from '@/components/board/DataModeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowLeft, Calendar, Users, DollarSign, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AreaChart,
  Area,
} from 'recharts';

// Demo forecast data
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

const creatorGrowthData = [
  { month: 'Jan 25', creators: 500, paying: 40, podcasters: 150 },
  { month: 'Apr 25', creators: 1200, paying: 96, podcasters: 380 },
  { month: 'Jul 25', creators: 2500, paying: 200, podcasters: 800 },
  { month: 'Oct 25', creators: 4500, paying: 360, podcasters: 1500 },
  { month: 'Jan 26', creators: 8000, paying: 640, podcasters: 2800 },
  { month: 'Apr 26', creators: 14000, paying: 1120, podcasters: 5000 },
  { month: 'Jul 26', creators: 25000, paying: 2000, podcasters: 9000 },
  { month: 'Oct 26', creators: 42000, paying: 3360, podcasters: 15000 },
  { month: 'Jan 27', creators: 70000, paying: 5600, podcasters: 25000 },
  { month: 'Apr 27', creators: 110000, paying: 8800, podcasters: 40000 },
  { month: 'Jul 27', creators: 170000, paying: 13600, podcasters: 62000 },
  { month: 'Oct 27', creators: 250000, paying: 20000, podcasters: 90000 },
];

const expenseData = [
  { category: 'Engineering', y1: 180000, y2: 350000, y3: 600000 },
  { category: 'Sales & Marketing', y1: 80000, y2: 250000, y3: 500000 },
  { category: 'Infrastructure', y1: 45000, y2: 120000, y3: 280000 },
  { category: 'Operations', y1: 35000, y2: 80000, y3: 150000 },
  { category: 'AI/ML Compute', y1: 25000, y2: 100000, y3: 250000 },
];

const cashFlowData = [
  { quarter: 'Q1 2025', inflow: 50000, outflow: 40000, net: 10000, runway: 8 },
  { quarter: 'Q2 2025', inflow: 85000, outflow: 55000, net: 30000, runway: 10 },
  { quarter: 'Q3 2025', inflow: 150000, outflow: 85000, net: 65000, runway: 14 },
  { quarter: 'Q4 2025', inflow: 250000, outflow: 120000, net: 130000, runway: 18 },
  { quarter: 'Q1 2026', inflow: 400000, outflow: 180000, net: 220000, runway: 24 },
  { quarter: 'Q2 2026', inflow: 600000, outflow: 250000, net: 350000, runway: 30 },
  { quarter: 'Q3 2026', inflow: 900000, outflow: 350000, net: 550000, runway: 36 },
  { quarter: 'Q4 2026', inflow: 1200000, outflow: 450000, net: 750000, runway: 42 },
];

const summaryMetrics = [
  { label: 'Year 1 Revenue', value: '$535K', change: '+420%' },
  { label: 'Year 2 Revenue', value: '$3.1M', change: '+480%' },
  { label: 'Year 3 Revenue', value: '$9.9M', change: '+219%' },
  { label: 'Break-even', value: 'Q3 2025', change: 'On track' },
];

const scenarioOptions = [
  { id: 'conservative', label: 'Conservative', multiplier: 0.7 },
  { id: 'base', label: 'Base Case', multiplier: 1 },
  { id: 'optimistic', label: 'Optimistic', multiplier: 1.4 },
];

export default function BoardForecasts() {
  const navigate = useNavigate();
  const { isDemo, isReal } = useBoardDataMode();
  const [scenario, setScenario] = useState('base');

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const selectedScenario = scenarioOptions.find(s => s.id === scenario);
  const multiplier = selectedScenario?.multiplier || 1;

  return (
    <BoardLayout>
      <div>
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-700 mb-6 -ml-2"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">3-Year AI Forecasts</h1>
              <p className="text-slate-500">AI-generated financial projections</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <DataModeLabel />

        {isReal && (
          <Alert className="mt-4 mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Real Mode Active:</strong> Forecast projections are based on demo assumptions. 
              As platform data grows, forecasts will incorporate actual metrics.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
          {summaryMetrics.map((metric, i) => (
            <Card key={i} className="bg-white border-slate-200 shadow-sm relative">
              <DataModeBadge className="absolute top-2 right-2" />
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isDemo ? metric.value : '—'}
                </p>
                <p className="text-xs text-emerald-600 font-medium">{isDemo ? metric.change : '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="bg-slate-100 border border-slate-200 flex-wrap">
            <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Financial Summary
            </TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Creator Growth
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Expense Model
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Cashflow Model
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Scenario Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Revenue & Profit Projections
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Creator Growth Model
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={creatorGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="creators" name="Total Creators" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="podcasters" name="Podcasters" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="paying" name="Paying Users" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-rose-500" />
                  Expense Breakdown by Year
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
                      <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={12} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="y1" name="Year 1" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="y2" name="Year 2" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="y3" name="Year 3" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Quarterly Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" name="Outflow" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900">Scenario Planner</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-6">
                  {scenarioOptions.map((opt) => (
                    <Button
                      key={opt.id}
                      variant={scenario === opt.id ? 'default' : 'outline'}
                      onClick={() => setScenario(opt.id)}
                      className={scenario === opt.id ? 'bg-blue-600' : ''}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-slate-500">Year 1 Revenue</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(535000 * multiplier)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-slate-500">Year 2 Revenue</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(3100000 * multiplier)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-slate-500">Year 3 Revenue</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(9900000 * multiplier)}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BoardLayout>
  );
}
