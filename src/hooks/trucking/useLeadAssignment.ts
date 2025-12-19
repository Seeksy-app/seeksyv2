import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLeadAssignment() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const takeLead = async (leadId: string, onSuccess?: () => void) => {
    setLoading(leadId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First check if lead is still available (unassigned)
      const { data: lead, error: fetchError } = await supabase
        .from("trucking_carrier_leads")
        .select("id, assigned_agent_id, status")
        .eq("id", leadId)
        .single();

      if (fetchError) throw fetchError;
      
      if (lead.assigned_agent_id) {
        toast({ 
          title: "Lead already assigned", 
          description: "Another agent has already claimed this lead.", 
          variant: "destructive" 
        });
        return false;
      }

      // Assign the lead
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ 
          assigned_agent_id: user.id,
          assigned_at: new Date().toISOString()
        })
        .eq("id", leadId)
        .is("assigned_agent_id", null); // Extra safety check

      if (error) throw error;

      toast({ title: "Lead claimed", description: "This lead is now assigned to you." });
      onSuccess?.();
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(null);
    }
  };

  const releaseLead = async (leadId: string, onSuccess?: () => void) => {
    setLoading(leadId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify user owns this lead
      const { data: lead, error: fetchError } = await supabase
        .from("trucking_carrier_leads")
        .select("id, assigned_agent_id")
        .eq("id", leadId)
        .single();

      if (fetchError) throw fetchError;

      if (lead.assigned_agent_id !== user.id) {
        toast({ 
          title: "Cannot release", 
          description: "You can only release leads assigned to you.", 
          variant: "destructive" 
        });
        return false;
      }

      // Release the lead
      const { error } = await supabase
        .from("trucking_carrier_leads")
        .update({ 
          assigned_agent_id: null,
          assigned_at: null
        })
        .eq("id", leadId)
        .eq("assigned_agent_id", user.id);

      if (error) throw error;

      toast({ title: "Lead released", description: "This lead is now available for others." });
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
    takeLead,
    releaseLead,
    loading,
  };
}
