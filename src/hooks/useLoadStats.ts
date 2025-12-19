import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const TIMEZONE = 'America/Chicago';

export interface LoadStats {
  todayCount: number;
  todayRevenue: number;
  monthCount: number;
  monthRevenue: number;
  dailyRecord: { count: number; date: string };
  monthlyRecord: { count: number; month: string };
  streak: number;
  isPersonalBest: boolean;
}

export const useLoadStats = () => {
  const [stats, setStats] = useState<LoadStats>({
    todayCount: 0,
    todayRevenue: 0,
    monthCount: 0,
    monthRevenue: 0,
    dailyRecord: { count: 0, date: '' },
    monthlyRecord: { count: 0, month: '' },
    streak: 0,
    isPersonalBest: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchStats = async (userId?: string | null) => {
    try {
      // Get current user if not passed
      let userIdToUse = userId;
      if (!userIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        userIdToUse = user?.id || null;
        setCurrentUserId(userIdToUse);
      }

      // If no user, show zeros
      if (!userIdToUse) {
        setStats({
          todayCount: 0,
          todayRevenue: 0,
          monthCount: 0,
          monthRevenue: 0,
          dailyRecord: { count: 0, date: '' },
          monthlyRecord: { count: 0, month: '' },
          streak: 0,
          isPersonalBest: false,
        });
        setLoading(false);
        return;
      }

      // Check if user is an agent (not owner)
      const { data: agentRecord } = await supabase
        .from('trucking_agents')
        .select('owner_id')
        .eq('user_id', userIdToUse)
        .eq('is_active', true)
        .maybeSingle();

      const isAgent = !!agentRecord;

      const now = new Date();
      const zonedNow = toZonedTime(now, TIMEZONE);
      
      // Today's range
      const todayStart = fromZonedTime(startOfDay(zonedNow), TIMEZONE).toISOString();
      const todayEnd = fromZonedTime(endOfDay(zonedNow), TIMEZONE).toISOString();
      
      // This month's range
      const monthStart = fromZonedTime(startOfMonth(zonedNow), TIMEZONE).toISOString();
      const monthEnd = fromZonedTime(endOfMonth(zonedNow), TIMEZONE).toISOString();

      // Build query base - agents filter by assigned_agent_id, owners by owner_id
      const buildQuery = (query: any) => {
        if (isAgent) {
          return query.eq('assigned_agent_id', userIdToUse);
        }
        return query.eq('owner_id', userIdToUse);
      };

      // Fetch today's confirmed loads - FILTER BY USER TYPE
      let todayQuery = supabase
        .from('trucking_loads')
        .select('id, target_rate, updated_at')
        .eq('status', 'booked')
        .gte('updated_at', todayStart)
        .lte('updated_at', todayEnd);
      const { data: todayLoads } = await buildQuery(todayQuery);

      // Fetch this month's confirmed loads - FILTER BY USER TYPE
      let monthQuery = supabase
        .from('trucking_loads')
        .select('id, target_rate, updated_at')
        .eq('status', 'booked')
        .gte('updated_at', monthStart)
        .lte('updated_at', monthEnd);
      const { data: monthLoads } = await buildQuery(monthQuery);

      // Fetch all booked loads for records (last 12 months) - FILTER BY USER TYPE
      const yearAgo = fromZonedTime(subMonths(zonedNow, 12), TIMEZONE).toISOString();
      let allLoadsQuery = supabase
        .from('trucking_loads')
        .select('id, target_rate, updated_at')
        .eq('status', 'booked')
        .gte('updated_at', yearAgo);
      const { data: allLoads } = await buildQuery(allLoadsQuery);

      // Calculate daily record
      const loadsByDay: Record<string, number> = {};
      allLoads?.forEach(load => {
        const day = format(toZonedTime(new Date(load.updated_at), TIMEZONE), 'yyyy-MM-dd');
        loadsByDay[day] = (loadsByDay[day] || 0) + 1;
      });

      let dailyRecord = { count: 0, date: '' };
      Object.entries(loadsByDay).forEach(([date, count]) => {
        if (count > dailyRecord.count) {
          dailyRecord = { count, date: format(new Date(date), 'MMM d') };
        }
      });

      // Calculate monthly record
      const loadsByMonth: Record<string, number> = {};
      allLoads?.forEach(load => {
        const month = format(toZonedTime(new Date(load.updated_at), TIMEZONE), 'yyyy-MM');
        loadsByMonth[month] = (loadsByMonth[month] || 0) + 1;
      });

      let monthlyRecord = { count: 0, month: '' };
      Object.entries(loadsByMonth).forEach(([month, count]) => {
        if (count > monthlyRecord.count) {
          monthlyRecord = { count, month: format(new Date(month + '-01'), 'MMM yyyy') };
        }
      });

      // Calculate streak (consecutive days with at least 1 booking)
      let streak = 0;
      const today = format(zonedNow, 'yyyy-MM-dd');
      let checkDate = today;
      
      while (loadsByDay[checkDate]) {
        streak++;
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        checkDate = format(prevDate, 'yyyy-MM-dd');
      }

      const todayCount = todayLoads?.length || 0;
      const isPersonalBest = todayCount > 0 && todayCount >= dailyRecord.count;

      setStats({
        todayCount,
        todayRevenue: todayLoads?.reduce((sum, l) => sum + (l.target_rate || 0), 0) || 0,
        monthCount: monthLoads?.length || 0,
        monthRevenue: monthLoads?.reduce((sum, l) => sum + (l.target_rate || 0), 0) || 0,
        dailyRecord,
        monthlyRecord,
        streak,
        isPersonalBest,
      });
    } catch (error) {
      console.error('Error fetching load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
};
