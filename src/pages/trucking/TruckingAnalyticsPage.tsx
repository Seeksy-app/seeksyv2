import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import TruckingAnalytics from "@/components/trucking/TruckingAnalytics";
import { cn } from "@/lib/utils";
import { TruckingPageWrapper } from "@/components/trucking/TruckingPageWrapper";

type DatePreset = "all" | "today" | "7d" | "30d" | "custom";

export default function TruckingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    switch (preset) {
      case "all":
        setDateRange(undefined);
        break;
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "7d":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "30d":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
    }
  };

  return (
    <TruckingPageWrapper
      title="Analytics & Insights"
      description="Master analytics and call behavior metrics"
      action={
        <div className="flex items-center gap-2">
          {/* Date Range Presets */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[
              { key: "all", label: "All Time" },
              { key: "today", label: "Today" },
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={datePreset === key ? "secondary" : "ghost"}
                className={cn("h-7 text-xs", datePreset === key && "bg-background shadow-sm")}
                onClick={() => handlePresetChange(key as DatePreset)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      }
    >
      <TruckingAnalytics dateRange={dateRange} />
    </TruckingPageWrapper>
  );
}
