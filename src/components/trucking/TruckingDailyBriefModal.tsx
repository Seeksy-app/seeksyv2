import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Sparkles, Phone, Clock, CheckCircle2, TrendingUp, 
  Lightbulb, AlertTriangle, RefreshCw 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DailyBrief {
  id: string;
  date_local: string;
  executive_summary: string;
  insights: any[];
  short_term_recs: any[];
  flags: any[];
  long_term_index?: { close_rate_trend?: string; engagement_quality?: string; rate_acceptance?: string };
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  voicemails: number;
  avg_call_seconds: number;
  loads_active: number;
  loads_confirmed: number;
  loads_pending: number;
  created_at: string;
}

interface TruckingDailyBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TruckingDailyBriefModal({ open, onOpenChange }: TruckingDailyBriefModalProps) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchBrief();
    }
  }, [open]);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("ai_daily_briefs")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setBrief(data as DailyBrief | null);
      }
    } catch (error) {
      console.error("Failed to fetch brief:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBrief = async () => {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate a brief");
        return;
      }
      setUserId(user.id);
    }
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-trucking-generate-daily-brief", { 
        body: { owner_id: userId } 
      });
      if (error) throw error;
      if (data?.brief) { 
        setBrief(data.brief); 
        toast.success("Daily brief generated"); 
      }
    } catch (err) {
      toast.error("Failed to generate brief");
    } finally {
      setGenerating(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Daily Brief
              </DialogTitle>
              <DialogDescription>
                {brief ? format(new Date(brief.date_local), "EEEE, MMMM d, yyyy") : "AI-powered call intelligence"}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateBrief}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {generating ? "Generating..." : "Refresh"}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : !brief ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Brief Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Generate a daily brief to get AI-powered insights about your call performance and load bookings.
              </p>
              <Button onClick={generateBrief} disabled={generating} className="gap-2">
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Brief
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Calls</p>
                      <p className="text-lg font-semibold">{brief.total_calls || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Answered</p>
                      <p className="text-lg font-semibold">{brief.answered_calls || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Duration</p>
                      <p className="text-lg font-semibold">{formatDuration(brief.avg_call_seconds)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmed</p>
                      <p className="text-lg font-semibold">{brief.loads_confirmed || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Active Loads</p>
                      <p className="text-lg font-semibold">{brief.loads_active || 0}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Executive Summary */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brief.executive_summary || "No summary available."}
                </p>
                {brief.long_term_index && (
                  <div className="mt-4 pt-3 border-t flex flex-wrap gap-4 text-xs">
                    {brief.long_term_index.close_rate_trend && (
                      <span><span className="text-muted-foreground">Close Rate:</span> {brief.long_term_index.close_rate_trend}</span>
                    )}
                    {brief.long_term_index.engagement_quality && (
                      <span><span className="text-muted-foreground">Engagement:</span> {brief.long_term_index.engagement_quality}</span>
                    )}
                    {brief.long_term_index.rate_acceptance && (
                      <span><span className="text-muted-foreground">Rate Acceptance:</span> {brief.long_term_index.rate_acceptance}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Insights */}
              {brief.insights?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {brief.insights.slice(0, 5).map((ins: any, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                        <TrendingUp className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <span>{ins.title ? `${ins.title}: ` : ""}{ins.detail || ins.text || ins.message || ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {brief.short_term_recs?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {brief.short_term_recs.slice(0, 5).map((rec: any, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                        <span className="text-green-600 font-medium">{rec.priority || i + 1}.</span>
                        <span>{rec.action || rec.text || rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alerts/Flags */}
              {brief.flags?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Alerts
                  </h4>
                  <div className="space-y-2">
                    {brief.flags.map((flag: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                        <Badge 
                          variant="outline" 
                          className={
                            flag.type === "warning" ? "text-orange-600 border-orange-300" : 
                            flag.type === "success" ? "text-green-600 border-green-300" : 
                            "text-blue-600 border-blue-300"
                          }
                        >
                          {flag.type || "info"}
                        </Badge>
                        <span className="text-sm">{flag.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}