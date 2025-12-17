import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type TruckingRole = "owner" | "agent" | null;

interface TruckingRoleInfo {
  role: TruckingRole;
  isOwner: boolean;
  isAgent: boolean;
  isAuthorized: boolean;
  ownerId: string | null;
  loading: boolean;
}

export function useTruckingRole(): TruckingRoleInfo {
  const [role, setRole] = useState<TruckingRole>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
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

      // Check if user is in trucking_admin_users (authorized)
      const { data: adminRecord } = await supabase
        .from("trucking_admin_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminRecord) {
        // User is an admin - they're authorized and are owners
        setIsAuthorized(true);
        setRole("owner");
        setOwnerId(user.id);
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
        // User is an agent - authorized
        setIsAuthorized(true);
        setRole("agent");
        setOwnerId(agentRecord.owner_id);
        setLoading(false);
        return;
      }

      // User is not authorized
      setIsAuthorized(false);
      setRole(null);
      setOwnerId(null);
    } catch (error) {
      console.error("Error checking trucking role:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    role,
    isOwner: role === "owner",
    isAgent: role === "agent",
    isAuthorized,
    ownerId,
    loading,
  };
}
