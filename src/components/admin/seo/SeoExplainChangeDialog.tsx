import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SeoBaseline, BaselinesMap } from "@/hooks/useSeoBaselines";
import { GscMetrics, Ga4Metrics } from "@/hooks/useSeoAnalyticsMetrics";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seoPageId: string;
  pageName: string;
  routePath: string;
  baseline?: BaselinesMap;
  metrics7d?: { gsc: GscMetrics | null; ga4: Ga4Metrics | null };
  metrics28d?: { gsc: GscMetrics | null; ga4: Ga4Metrics | null };
  gbpLocationId?: string;
}

interface ExplanationResult {
  summary: string;
  likely_causes: string[];
  recommended_actions: string[];
}

export function SeoExplainChangeDialog({
  open,
  onOpenChange,
  seoPageId,
  pageName,
  routePath,
  baseline,
  metrics7d,
  metrics28d,
  gbpLocationId
}: Props) {
  const { toast } = useToast();
  const [result, setResult] = useState<ExplanationResult | null>(null);

  const explainMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      // Build context for AI
      const context = {
        page_name: pageName,
        route_path: routePath,
        baseline: baseline ? {
          gsc: baseline.gsc ? {
            clicks: baseline.gsc.baseline_clicks,
            impressions: baseline.gsc.baseline_impressions,
            ctr: baseline.gsc.baseline_ctr,
            position: baseline.gsc.baseline_position,
            captured_at: baseline.gsc.captured_at
          } : null,
          ga4: baseline.ga4 ? {
            users: baseline.ga4.baseline_users,
            sessions: baseline.ga4.baseline_sessions,
            captured_at: baseline.ga4.captured_at
          } : null
        } : null,
        metrics_7d: metrics7d ? {
          gsc: metrics7d.gsc,
          ga4: metrics7d.ga4
        } : null,
        metrics_28d: metrics28d ? {
          gsc: metrics28d.gsc,
          ga4: metrics28d.ga4
        } : null,
        gbp_location_id: gbpLocationId
      };

      // Call the existing SEO AI function (reuse pipeline)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-ai-explain-change`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            seo_page_id: seoPageId,
            context
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get explanation');
      }

      return response.json() as Promise<ExplanationResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to explain",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleExplain = () => {
    setResult(null);
    explainMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Explain Performance Change
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <strong>{pageName}</strong>
            <span className="ml-2 font-mono text-xs">{routePath}</span>
          </div>

          {!result && !explainMutation.isPending && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                AI will analyze baseline, 7-day, and 28-day metrics to explain performance changes.
              </p>
              <Button onClick={handleExplain}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Changes
              </Button>
            </div>
          )}

          {explainMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing...</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm">{result.summary}</p>
              </div>

              {/* Likely Causes */}
              {result.likely_causes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    Likely Causes
                  </h4>
                  <ul className="space-y-1">
                    {result.likely_causes.map((cause, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {result.recommended_actions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Suggested Actions
                  </h4>
                  <ul className="space-y-1">
                    {result.recommended_actions.map((action, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleExplain}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Re-analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
