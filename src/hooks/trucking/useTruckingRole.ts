import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type TruckingRole = "owner" | "agent" | null;

interface TruckingRoleInfo {
  role: TruckingRole;
  isOwner: boolean;
  isAgent: boolean;
  ownerId: string | null;
  loading: boolean;
}

export function useTruckingRole(): TruckingRoleInfo {
  const [role, setRole] = useState<TruckingRole>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is an agent under any owner
      const { data: agentRecord } = await supabase
        .from("trucking_agents")
        .select("owner_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (agentRecord) {
        // User is an agent
        setRole("agent");
        setOwnerId(agentRecord.owner_id);
      } else {
        // Check if user owns any loads (meaning they're an owner)
        const { data: loads } = await supabase
          .from("trucking_loads")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (loads && loads.length > 0) {
          setRole("owner");
          setOwnerId(user.id);
        } else {
          // Default to owner for new users
          setRole("owner");
          setOwnerId(user.id);
        }
      }
    } catch (error) {
      console.error("Error checking trucking role:", error);
      setRole("owner"); // Default to owner on error
    } finally {
      setLoading(false);
    }
  };

  return {
    role,
    isOwner: role === "owner",
    isAgent: role === "agent",
    ownerId,
    loading,
  };
}
