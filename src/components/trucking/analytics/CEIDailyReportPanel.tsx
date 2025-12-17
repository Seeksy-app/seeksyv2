import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Send, RefreshCw, Sparkles } from 'lucide-react';
import { TruckingDailyReport, useTruckingDailyReport } from '@/hooks/trucking/useTruckingCalls';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CEIDailyReportPanelProps {
  date: Date;
}

export function CEIDailyReportPanel({ date }: CEIDailyReportPanelProps) {
  const { data: report, isLoading, refetch } = useTruckingDailyReport(date);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-trucking-generate-cei-report', {
        body: { report_date: format(date, 'yyyy-MM-dd') },
      });
      
      if (error) throw error;
      
      toast({ title: 'Report generated successfully' });
      refetch();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ 
        title: 'Failed to generate report', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToDispatch = async () => {
    if (!report) return;
    
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('ai-trucking-send-report-email', {
        body: { report_id: report.id },
      });
      
      if (error) throw error;
      
      toast({ title: 'Report sent to dispatch' });
      refetch();
    } catch (error) {
      console.error('Error sending report:', error);
      toast({ 
        title: 'Failed to send report', 
        variant: 'destructive' 
      });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            End-of-Day Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReport}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : report ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {report ? 'Regenerate' : 'Generate Report'}
            </Button>
            {report && (
              <Button
                size="sm"
                onClick={handleSendToDispatch}
                disabled={sending || !!report.sent_to_dispatch_at}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {report.sent_to_dispatch_at ? 'Sent' : 'Send to Dispatch'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {report ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {/* Parse and display the AI summary */}
              <ReportSection title="AI Summary" content={report.ai_summary_text} />
              
              {/* Display insights if available */}
              {report.ai_insights_json && Object.keys(report.ai_insights_json).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Insights</h4>
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {JSON.stringify(report.ai_insights_json, null, 2)}
                    </div>
                  </div>
                </>
              )}

              {/* Top signals */}
              {((report.top_frustration_phrases?.length || 0) > 0 || 
                (report.top_success_signals?.length || 0) > 0) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {report.top_frustration_phrases && report.top_frustration_phrases.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-amber-500">Top Frustration Phrases</h4>
                        <div className="flex flex-wrap gap-1">
                          {report.top_frustration_phrases.map((phrase, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                              {phrase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.top_success_signals && report.top_success_signals.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-green-500">Top Success Signals</h4>
                        <div className="flex flex-wrap gap-1">
                          {report.top_success_signals.map((signal, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-green-500/50 text-green-600">
                              {signal.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Metadata */}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Generated: {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                {report.sent_to_dispatch_at && (
                  <> · Sent: {format(new Date(report.sent_to_dispatch_at), 'MMM d, yyyy HH:mm')}</>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No report generated for this date.</p>
            <p className="text-xs">Click "Generate Report" to create one.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportSection({ title, content }: { title: string; content: string }) {
  // Parse markdown-like sections from the AI output
  const sections = content.split(/(?=\d\)|\n##|\n\*\*)/);
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
        {content}
      </div>
    </div>
  );
}
