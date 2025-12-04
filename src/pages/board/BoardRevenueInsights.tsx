import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react';

const revenueMetrics = [
  { label: 'Total Revenue (MTD)', value: '$156,420', change: '+12.3%', icon: DollarSign },
  { label: 'Ad Revenue', value: '$89,200', change: '+18.5%', icon: BarChart3 },
  { label: 'Subscription Revenue', value: '$67,220', change: '+8.2%', icon: Users },
  { label: 'Revenue Growth Rate', value: '24.7%', change: '+3.2%', icon: TrendingUp },
];

const revenueByChannel = [
  { channel: 'Podcast Ads', revenue: '$45,200', percentage: 29 },
  { channel: 'Video Pre-roll', revenue: '$32,400', percentage: 21 },
  { channel: 'Sponsorships', revenue: '$28,600', percentage: 18 },
  { channel: 'Pro Subscriptions', revenue: '$25,800', percentage: 17 },
  { channel: 'Creator Tools', revenue: '$14,420', percentage: 9 },
  { channel: 'Events & Ticketing', revenue: '$10,000', percentage: 6 },
];

export default function BoardRevenueInsights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue Insights</h1>
        <p className="text-muted-foreground mt-1">
          Financial performance metrics synced from Admin dashboard
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{metric.change} vs last month</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue by Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueByChannel.map((item) => (
              <div key={item.channel} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{item.channel}</span>
                    <span className="text-sm text-muted-foreground">{item.revenue}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-medium text-muted-foreground w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Data synced from Admin Revenue Insights • Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
