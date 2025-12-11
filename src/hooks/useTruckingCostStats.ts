import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CostStats {
  avgCostPerCall: number;
  totalCostThisMonth: number;
  callsLast20: number;
  callsThisMonth: number;
  loading: boolean;
  error: string | null;
}

export function useTruckingCostStats() {
  const [stats, setStats] = useState<CostStats>({
    avgCostPerCall: 0,
    totalCostThisMonth: 0,
    callsLast20: 0,
    callsThisMonth: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchCostStats();
  }, []);

  const fetchCostStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase.rpc("get_trucking_cost_stats", {
        p_owner_id: user.id,
      });

      if (error) throw error;

      const result = data as {
        avg_estimated_cost_usd_last_20: number;
        sum_estimated_cost_usd_current_month: number;
        calls_count_last_20: number;
        calls_count_current_month: number;
      };

      setStats({
        avgCostPerCall: result.avg_estimated_cost_usd_last_20 || 0,
        totalCostThisMonth: result.sum_estimated_cost_usd_current_month || 0,
        callsLast20: result.calls_count_last_20 || 0,
        callsThisMonth: result.calls_count_current_month || 0,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Error fetching cost stats:", error);
      setStats(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  return stats;
}
