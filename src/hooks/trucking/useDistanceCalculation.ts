import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DistanceResult {
  distance_miles: number;
  duration_hours: number;
}

export function useDistanceCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = useCallback(async (
    pickup: { city: string; state: string; zip?: string },
    delivery: { city: string; state: string; zip?: string }
  ): Promise<DistanceResult | null> => {
    if (!pickup.city || !pickup.state || !delivery.city || !delivery.state) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("trucking-distance", {
        body: { pickup, delivery },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.message || "Distance lookup failed");

      return {
        distance_miles: data.distance_miles,
        duration_hours: data.duration_hours,
      };
    } catch (err: any) {
      setError(err.message || "Failed to calculate distance");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculateDistance, loading, error };
}
