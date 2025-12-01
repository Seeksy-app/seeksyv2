import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stub: Default to 100 credits
      // TODO: Load from billing table when implemented
      setCredits(100);
    } catch (error) {
      console.error("Error loading credits:", error);
      setCredits(100);
    }
  };

  const handleClick = () => {
    navigate("/settings/billing");
  };

  if (credits === null) return null;

  return (
    <Badge
      variant="destructive"
      className="cursor-pointer hover:scale-105 transition-transform flex items-center gap-1.5 px-3 py-1.5"
      onClick={handleClick}
    >
      <Zap className="h-3.5 w-3.5" />
      <span className="font-semibold">{credits}</span>
      <span className="text-xs opacity-90">credits</span>
    </Badge>
  );
}
