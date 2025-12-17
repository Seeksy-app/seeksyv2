import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLoadAssignment() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const takeLoad = async (loadId: string, onSuccess?: () => void) => {
    setLoading(loadId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First check if load is still available (pending + unassigned)
      const { data: load, error: fetchError } = await supabase
        .from("trucking_loads")
        .select("id, status, assigned_agent_id")
        .eq("id", loadId)
        .single();

      if (fetchError) throw fetchError;
      
      if (load.status !== "pending") {
        toast({ 
          title: "Cannot take this load", 
          description: "Only pending loads can be taken.", 
          variant: "destructive" 
        });
        return false;
      }

      if (load.assigned_agent_id) {
        toast({ 
          title: "Load already taken", 
          description: "Another agent has already claimed this load.", 
          variant: "destructive" 
        });
        return false;
      }

      // Assign the load
      const { error } = await supabase
        .from("trucking_loads")
        .update({ 
          assigned_agent_id: user.id,
          assigned_at: new Date().toISOString()
        })
        .eq("id", loadId)
        .is("assigned_agent_id", null); // Extra safety check

      if (error) throw error;

      toast({ title: "Load claimed", description: "This load is now assigned to you." });
      onSuccess?.();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(null);
    }
  };

  const releaseLoad = async (loadId: string, onSuccess?: () => void) => {
    setLoading(loadId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify user owns this load
      const { data: load, error: fetchError } = await supabase
        .from("trucking_loads")
        .select("id, assigned_agent_id")
        .eq("id", loadId)
        .single();

      if (fetchError) throw fetchError;

      if (load.assigned_agent_id !== user.id) {
        toast({ 
          title: "Cannot release", 
          description: "You can only release loads assigned to you.", 
          variant: "destructive" 
        });
        return false;
      }

      // Release the load
      const { error } = await supabase
        .from("trucking_loads")
        .update({ 
          assigned_agent_id: null,
          assigned_at: null
        })
        .eq("id", loadId)
        .eq("assigned_agent_id", user.id);

      if (error) throw error;

      toast({ title: "Load released", description: "This load is now available for others." });
      onSuccess?.();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(null);
    }
  };

  return {
    takeLoad,
    releaseLoad,
    loading,
  };
}
