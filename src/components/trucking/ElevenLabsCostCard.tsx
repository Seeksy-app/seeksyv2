import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Clock, RefreshCw, Phone, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UsageData {
  monthly: {
    calls: number;
    total_seconds: number;
    total_minutes: number;
    estimated_cost: number;
    projected_cost: number;
  };
  today: {
    calls: number;
    total_seconds: number;
    total_minutes: number;
    estimated_cost: number;
  };
  pricing: {
    per_minute: number;
    currency: string;
  };
  last_updated: string;
}

interface ElevenLabsCostCardProps {
  compact?: boolean;
}

export function ElevenLabsCostCard({ compact = false }: ElevenLabsCostCardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsage = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-usage');
      
      if (error) throw error;
      if (data?.success && data.usage) {
        setUsage(data.usage);
        if (showToast) toast.success('Usage data refreshed');
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      if (showToast) toast.error('Failed to refresh usage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchUsage(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            Unable to load cost data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Est. Cost/Mo</p>
                <p className="text-lg font-semibold">${usage.monthly.estimated_cost.toFixed(2)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchUsage(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            ElevenLabs Usage
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => fetchUsage(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Today's Cost</p>
            <p className="text-xl font-bold text-green-600">
              ${usage.today.estimated_cost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {usage.today.calls} calls • {usage.today.total_minutes.toFixed(1)} min
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Month to Date</p>
            <p className="text-xl font-bold">
              ${usage.monthly.estimated_cost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {usage.monthly.calls} calls • {usage.monthly.total_minutes.toFixed(1)} min
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Projected Monthly
            </span>
            <span className="font-medium">${usage.monthly.projected_cost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Rate: ${usage.pricing.per_minute}/min</span>
            <span>
              Updated {format(new Date(usage.last_updated), 'h:mm a')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
