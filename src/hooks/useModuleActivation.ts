import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ActivatedModule {
  module_id: string;
  activated_at: string;
}

export function useModuleActivation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all activated modules for current user
  const { data: activatedModules = [], isLoading, refetch } = useQuery({
    queryKey: ['user-activated-modules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching activated modules:', error);
        return [];
      }

      // Map to our interface since types may not be regenerated yet
      return (data || []).map((row: any) => ({
        module_id: row.module_id as string,
        activated_at: row.activated_at as string,
      })) as ActivatedModule[];
    },
  });

  // Check if a specific module is activated
  const isModuleActivated = (moduleId: string): boolean => {
    return activatedModules.some(m => m.module_id === moduleId);
  };

  // Get list of activated module IDs
  const activatedModuleIds = activatedModules.map(m => m.module_id);

  // Activate a module
  const activateModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_modules')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          activated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_id'
        });

      if (error) throw error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['user-activated-modules'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast({
        title: "Module Activated",
        description: `Module has been added to your workspace and navigation.`,
      });
    },
    onError: (error) => {
      console.error('Error activating module:', error);
      toast({
        title: "Error",
        description: "Failed to activate module. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deactivate a module
  const deactivateModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', user.id)
        .eq('module_id', moduleId);

      if (error) throw error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['user-activated-modules'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast({
        title: "Module Deactivated",
        description: `Module has been removed from your workspace.`,
      });
    },
    onError: (error) => {
      console.error('Error deactivating module:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate module. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    activatedModules,
    activatedModuleIds,
    isLoading,
    isModuleActivated,
    activateModule: activateModule.mutate,
    deactivateModule: deactivateModule.mutate,
    isActivating: activateModule.isPending,
    isDeactivating: deactivateModule.isPending,
    refetch,
  };
}
