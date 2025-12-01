import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCredits();
  }, []);

  useEffect(() => {
    if (credits === null) return;

    // Check if we should animate based on localStorage tracking
    const lowestSeenCredits = localStorage.getItem("creditsLowestSeen");
    const lowestSeen = lowestSeenCredits ? parseInt(lowestSeenCredits, 10) : Infinity;

    // Animate if this is a new low threshold (credits dropped below what user has seen)
    if (credits <= 4 && credits < lowestSeen) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [credits]);

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stub: Default to 4 credits to show low state
      // TODO: Load from billing table when implemented
      setCredits(4);
    } catch (error) {
      console.error("Error loading credits:", error);
      setCredits(4);
    }
  };

  const handleClick = () => {
    // Mark current credits level as viewed
    if (credits !== null) {
      const lowestSeenCredits = localStorage.getItem("creditsLowestSeen");
      const lowestSeen = lowestSeenCredits ? parseInt(lowestSeenCredits, 10) : Infinity;
      
      // Update localStorage with the lowest credits level user has seen
      if (credits < lowestSeen) {
        localStorage.setItem("creditsLowestSeen", credits.toString());
      }
      
      // Stop animation after click
      setShouldAnimate(false);
    }
    
    navigate("/settings/billing");
  };

  if (credits === null) return null;

  // Color logic: >20 blue, 5-20 yellow, ≤4 red
  const getVariant = () => {
    if (credits > 20) return "default"; // blue
    if (credits >= 5) return "secondary"; // yellow
    return "destructive"; // red
  };

  const isLow = credits <= 4;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getVariant()}
            className={`cursor-pointer hover:scale-105 transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 ${
              shouldAnimate ? 'animate-pulse' : ''
            }`}
            onClick={handleClick}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="font-semibold">{credits}</span>
            {isLow && <span className="text-xs opacity-90">Low!</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Credits power your AI, email, and media tools.</p>
          <p className="text-sm font-semibold mt-1">You have {credits} credits remaining.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
