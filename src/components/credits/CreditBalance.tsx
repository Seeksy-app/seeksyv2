import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CreditBalance() {
  const { data: userCredits } = useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!userCredits) return null;

  const isLowBalance = userCredits.balance < 5;

  return (
    <Link to="/credits">
      <Button
        variant={isLowBalance ? "destructive" : "outline"}
        size="sm"
        className="gap-2"
      >
        <Coins className="h-4 w-4" />
        <span className="font-semibold">{userCredits.balance}</span>
        {isLowBalance && <span className="text-xs">Low!</span>}
      </Button>
    </Link>
  );
}