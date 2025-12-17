import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, TrendingUp, Lightbulb, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import TruckingAnalytics from "@/components/trucking/TruckingAnalytics";

interface DailyBrief {
  id: string;
  date_local: string;
  executive_summary: string;
  insights: any;
  short_term_recs: any;
  flags: any;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  loads_confirmed: number;
  loads_pending: number;
  created_at: string;
}

export default function TruckingAnalyticsPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLatestBrief();
  }, []);

  const fetchLatestBrief = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_daily_briefs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setBrief(data);
    } catch (err) {
      console.error("Error fetching daily brief:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateBrief = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("ai-trucking-generate-daily-brief");
      if (error) throw error;
      await fetchLatestBrief();
    } catch (err) {
      console.error("Error generating brief:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and AI insights</p>
        </div>
        <Button 
          onClick={generateBrief} 
          disabled={generating}
          variant="outline"
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate Daily Brief
        </Button>
      </div>

      {/* AI Daily Brief Section */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : brief ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Executive Summary */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI Daily Brief
                </CardTitle>
                <Badge variant="secondary">
                  {format(new Date(brief.date_local), "MMM d, yyyy")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {brief.executive_summary || "No summary available for this period."}
              </p>
            </CardContent>
          </Card>

          {/* Insights */}
          {brief.insights && Array.isArray(brief.insights) && brief.insights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brief.insights.slice(0, 5).map((insight: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                      <span>{typeof insight === 'string' ? insight : insight.text || insight.message}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {brief.short_term_recs && Array.isArray(brief.short_term_recs) && brief.short_term_recs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brief.short_term_recs.slice(0, 5).map((rec: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      <span>{typeof rec === 'string' ? rec : rec.text || rec.action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Flags/Alerts */}
          {brief.flags && typeof brief.flags === 'object' && Object.keys(brief.flags).length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Alerts & Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(brief.flags).map(([key, value]) => (
                    value && (
                      <Badge key={key} variant="outline" className="text-orange-600 border-orange-200">
                        {key.replace(/_/g, ' ')}
                      </Badge>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No AI daily brief available yet.</p>
            <Button onClick={generateBrief} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate First Brief
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analytics Overview */}
      <TruckingAnalytics />
    </div>
  );
}
