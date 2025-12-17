import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface TruckingCall {
  id: string;
  created_at: string;
  call_provider: string | null;
  call_external_id: string | null;
  agent_name: string;
  caller_phone: string | null;
  mc_number: string | null;
  company_name: string | null;
  primary_load_id: string | null;
  load_ids_discussed: string[] | null;
  transcript_text: string | null;
  call_outcome: 'confirmed' | 'declined' | 'callback_requested' | 'incomplete' | 'error';
  handoff_requested: boolean;
  handoff_reason: string | null;
  lead_created: boolean;
  lead_create_error: string | null;
  cei_score: number;
  cei_band: '90-100' | '75-89' | '50-74' | '25-49' | '0-24';
  cei_reasons: string[] | null;
  owner_id: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  flagged_for_coaching: boolean | null;
  internal_notes: string | null;
  call_duration_seconds: number | null;
  audio_url: string | null;
  time_to_handoff_seconds: number | null;
}

export interface TruckingCallEvent {
  id: string;
  call_id: string;
  created_at: string;
  event_type: string;
  severity: 'info' | 'warn' | 'error';
  source: 'agent' | 'tool' | 'system' | 'classifier';
  phrase: string | null;
  metadata: Record<string, unknown> | null;
  cei_delta: number | null;
}

export interface TruckingDailyReport {
  id: string;
  report_date: string;
  created_at: string;
  total_calls: number;
  resolved_without_handoff_pct: number;
  handoff_requested_pct: number;
  lead_created_pct: number;
  avg_cei_score: number;
  cei_band_breakdown: Record<string, number>;
  top_frustration_phrases: string[] | null;
  top_success_signals: string[] | null;
  ai_summary_text: string;
  ai_insights_json: Record<string, unknown>;
  owner_id: string | null;
  sent_to_dispatch_at: string | null;
}

export function useTruckingCalls(date: Date) {
  return useQuery({
    queryKey: ['trucking-calls', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = startOfDay(date).toISOString();
      const endDate = endOfDay(date).toISOString();
      
      const { data, error } = await supabase
        .from('trucking_calls')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TruckingCall[];
    },
  });
}

export function useTruckingCallEvents(callId: string | null) {
  return useQuery({
    queryKey: ['trucking-call-events', callId],
    queryFn: async () => {
      if (!callId) return [];
      
      const { data, error } = await supabase
        .from('trucking_call_events')
        .select('*')
        .eq('call_id', callId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as TruckingCallEvent[];
    },
    enabled: !!callId,
  });
}

export function useTruckingDailyReport(date: Date) {
  return useQuery({
    queryKey: ['trucking-daily-report', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trucking_daily_reports')
        .select('*')
        .eq('report_date', format(date, 'yyyy-MM-dd'))
        .maybeSingle();
      
      if (error) throw error;
      return data as TruckingDailyReport | null;
    },
  });
}

export function useMarkCallReviewed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ callId, userId }: { callId: string; userId: string }) => {
      const { error } = await supabase
        .from('trucking_calls')
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', callId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucking-calls'] });
    },
  });
}

export function useFlagCallForCoaching() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ callId, flagged }: { callId: string; flagged: boolean }) => {
      const { error } = await supabase
        .from('trucking_calls')
        .update({ flagged_for_coaching: flagged })
        .eq('id', callId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucking-calls'] });
    },
  });
}

export function useUpdateCallNotes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ callId, notes }: { callId: string; notes: string }) => {
      const { error } = await supabase
        .from('trucking_calls')
        .update({ internal_notes: notes })
        .eq('id', callId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucking-calls'] });
    },
  });
}

export function useTruckingCallsStats(date: Date) {
  const { data: calls, isLoading } = useTruckingCalls(date);
  
  const emptyStats = {
    isLoading,
    totalCalls: 0,
    resolvedWithoutHandoffPct: 0,
    handoffRequestedPct: 0,
    leadCreatedPct: 0,
    avgCeiScore: 0,
    ceiBandBreakdown: { '90-100': 0, '75-89': 0, '50-74': 0, '25-49': 0, '0-24': 0 },
    // Engagement metrics
    avgDurationSeconds: 0,
    engagedCallsCount: 0,
    quickHangupsCount: 0,
    avgTimeToHandoffSeconds: null as number | null,
  };

  if (isLoading || !calls) {
    return emptyStats;
  }
  
  const totalCalls = calls.length;
  if (totalCalls === 0) {
    return { ...emptyStats, isLoading: false };
  }
  
  const resolvedWithoutHandoff = calls.filter(c => !c.handoff_requested).length;
  const handoffRequested = calls.filter(c => c.handoff_requested).length;
  const leadCreated = calls.filter(c => c.lead_created).length;
  const avgCeiScore = calls.reduce((sum, c) => sum + c.cei_score, 0) / totalCalls;
  
  const ceiBandBreakdown = calls.reduce((acc, c) => {
    acc[c.cei_band] = (acc[c.cei_band] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Engagement metrics
  const callsWithDuration = calls.filter(c => c.call_duration_seconds != null && c.call_duration_seconds > 0);
  const avgDurationSeconds = callsWithDuration.length > 0 
    ? callsWithDuration.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / callsWithDuration.length
    : 0;
  
  const engagedCallsCount = calls.filter(c => (c.call_duration_seconds || 0) > 90).length;
  const quickHangupsCount = calls.filter(c => (c.call_duration_seconds || 0) < 30 && (c.call_duration_seconds || 0) > 0).length;
  
  const callsWithHandoff = calls.filter(c => c.handoff_requested && c.time_to_handoff_seconds != null);
  const avgTimeToHandoffSeconds = callsWithHandoff.length > 0
    ? callsWithHandoff.reduce((sum, c) => sum + (c.time_to_handoff_seconds || 0), 0) / callsWithHandoff.length
    : null;
  
  return {
    isLoading: false,
    totalCalls,
    resolvedWithoutHandoffPct: (resolvedWithoutHandoff / totalCalls) * 100,
    handoffRequestedPct: (handoffRequested / totalCalls) * 100,
    leadCreatedPct: (leadCreated / totalCalls) * 100,
    avgCeiScore: Math.round(avgCeiScore),
    ceiBandBreakdown: {
      '90-100': ceiBandBreakdown['90-100'] || 0,
      '75-89': ceiBandBreakdown['75-89'] || 0,
      '50-74': ceiBandBreakdown['50-74'] || 0,
      '25-49': ceiBandBreakdown['25-49'] || 0,
      '0-24': ceiBandBreakdown['0-24'] || 0,
    },
    // Engagement metrics
    avgDurationSeconds,
    engagedCallsCount,
    quickHangupsCount,
    avgTimeToHandoffSeconds,
  };
}
