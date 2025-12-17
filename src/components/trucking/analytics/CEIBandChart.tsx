import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CEI_BANDS } from '@/constants/ceiScoring';

interface CEIBandChartProps {
  breakdown: Record<string, number>;
  isLoading?: boolean;
}

export function CEIBandChart({ breakdown, isLoading }: CEIBandChartProps) {
  const data = CEI_BANDS.map(band => ({
    name: band.band,
    label: band.label,
    value: breakdown[band.band] || 0,
    color: band.color,
  })).reverse();

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">CEI Band Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">Quick view of how calls felt today.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={60}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-medium text-sm">{data.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.value} call{data.value !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
