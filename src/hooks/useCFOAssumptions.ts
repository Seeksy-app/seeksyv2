import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CFOAssumption {
  id: string;
  metric_key: string;
  value: number;
  unit: string;
  source: 'cfo_override' | 'r_d_default' | 'blended';
  category: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffectiveAssumption {
  metric_key: string;
  value: number;
  unit: string;
  source: 'cfo_override' | 'r_d_default';
  rd_value?: number;
  cfo_value?: number;
}

export function useCFOAssumptions() {
  const queryClient = useQueryClient();

  // Fetch CFO assumptions
  const { data: cfoAssumptions, isLoading: cfoLoading } = useQuery({
    queryKey: ['cfo-assumptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cfo_assumptions')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as CFOAssumption[];
    },
  });

  // Fetch R&D benchmarks
  const { data: rdBenchmarks, isLoading: rdLoading } = useQuery({
    queryKey: ['rd-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_benchmarks')
        .select('metric_key, value, unit, confidence, source_notes')
        .order('metric_key');
      
      if (error) throw error;
      return data;
    },
  });

  // Build effective assumptions map (CFO overrides take precedence)
  const effectiveAssumptions: Record<string, EffectiveAssumption> = {};
  
  // Start with R&D benchmarks
  rdBenchmarks?.forEach((b) => {
    effectiveAssumptions[b.metric_key] = {
      metric_key: b.metric_key,
      value: Number(b.value),
      unit: b.unit || 'number',
      source: 'r_d_default',
      rd_value: Number(b.value),
    };
  });

  // Apply CFO overrides
  cfoAssumptions?.forEach((a) => {
    const existing = effectiveAssumptions[a.metric_key];
    effectiveAssumptions[a.metric_key] = {
      metric_key: a.metric_key,
      value: Number(a.value),
      unit: a.unit || 'number',
      source: 'cfo_override',
      rd_value: existing?.rd_value,
      cfo_value: Number(a.value),
    };
  });

  // Save or update CFO assumption
  const saveAssumption = useMutation({
    mutationFn: async ({ metric_key, value, unit, category, notes }: {
      metric_key: string;
      value: number;
      unit?: string;
      category?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cfo_assumptions')
        .upsert({
          metric_key,
          value,
          unit: unit || 'number',
          source: 'cfo_override',
          category: category || 'general',
          notes,
          created_by: user.user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'metric_key',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Assumption saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Save multiple assumptions at once
  const saveMultipleAssumptions = useMutation({
    mutationFn: async (assumptions: Array<{
      metric_key: string;
      value: number;
      unit?: string;
      category?: string;
      notes?: string;
    }>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const records = assumptions.map((a) => ({
        metric_key: a.metric_key,
        value: a.value,
        unit: a.unit || 'number',
        source: 'cfo_override' as const,
        category: a.category || 'general',
        notes: a.notes,
        created_by: user.user?.id,
        updated_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from('cfo_assumptions')
        .upsert(records, { onConflict: 'metric_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Assumptions saved and will be used in the AI Pro Forma');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete a CFO assumption (revert to R&D default)
  const deleteAssumption = useMutation({
    mutationFn: async (metric_key: string) => {
      const { error } = await supabase
        .from('cfo_assumptions')
        .delete()
        .eq('metric_key', metric_key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-assumptions'] });
      toast.success('Reverted to R&D default');
    },
  });

  // Get effective value for a metric
  const getEffectiveValue = (metricKey: string, fallback: number = 0): number => {
    return effectiveAssumptions[metricKey]?.value ?? fallback;
  };

  // Get counts for display
  const rdCount = rdBenchmarks?.length || 0;
  const cfoOverrideCount = cfoAssumptions?.length || 0;

  return {
    cfoAssumptions,
    rdBenchmarks,
    effectiveAssumptions,
    isLoading: cfoLoading || rdLoading,
    saveAssumption: saveAssumption.mutate,
    saveMultipleAssumptions: saveMultipleAssumptions.mutate,
    deleteAssumption: deleteAssumption.mutate,
    getEffectiveValue,
    rdCount,
    cfoOverrideCount,
    isSaving: saveAssumption.isPending || saveMultipleAssumptions.isPending,
  };
}
