import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePageTitle = (pageTitle?: string) => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-email-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count } = await supabase
        .from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_type", "email.delivered")
        .is("read_at", null);
      
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    const title = pageTitle || "My Day";
    const unreadPrefix = unreadCount > 0 ? `(${unreadCount}) ` : "";
    document.title = `${unreadPrefix}${title} — Seeksy`;
  }, [pageTitle, unreadCount]);
};
