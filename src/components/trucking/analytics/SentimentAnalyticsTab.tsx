import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { MessageSquare, ThumbsUp, ThumbsDown, Meh, TrendingUp, Phone, Repeat, Users, Loader2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface SentimentAnalyticsTabProps {
  dateRange?: { from: Date; to: Date };
}

interface SentimentData {
  // Sentiment breakdown
  positiveCalls: number;
  neutralCalls: number;
  negativeCalls: number;
  totalAnalyzedCalls: number;
  
  // Repeat callers
  repeatCallers: { phone: string; callCount: number; lastCallDate: string }[];
  totalRepeatCallers: number;
  repeatCallRate: number;
  
  // Common topics/issues
  topIssues: { issue: string; count: number }[];
  
  // Call outcomes sentiment correlation
  outcomesSentiment: { outcome: string; positive: number; neutral: number; negative: number }[];
}

const TIMEZONE = 'America/Chicago';
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#f59e0b', 
  negative: '#ef4444'
};

export function SentimentAnalyticsTab({ dateRange }: SentimentAnalyticsTabProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const zonedNow = toZonedTime(now, TIMEZONE);
      
      const rangeStart = dateRange?.from 
        ? fromZonedTime(startOfDay(dateRange.from), TIMEZONE).toISOString() 
        : fromZonedTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), TIMEZONE).toISOString(); // Default last 30 days
      const rangeEnd = dateRange?.to 
        ? fromZonedTime(endOfDay(dateRange.to), TIMEZONE).toISOString()
        : fromZonedTime(endOfDay(zonedNow), TIMEZONE).toISOString();

      // Fetch calls with analysis data
      const { data: calls } = await supabase
        .from('trucking_call_logs')
        .select('id, carrier_phone, call_outcome, call_started_at, summary, analysis_summary, transcript, data_collection_results')
        .is('deleted_at', null)
        .gte('call_started_at', rangeStart)
        .lte('call_started_at', rangeEnd);

      const callsData = calls || [];

      // Analyze sentiment from transcripts/summaries
      const analyzeSentiment = (call: typeof callsData[0]): 'positive' | 'neutral' | 'negative' => {
        const text = `${call.summary || ''} ${call.analysis_summary || ''} ${call.transcript || ''}`.toLowerCase();
        
        const positiveWords = ['thank', 'great', 'perfect', 'excellent', 'appreciate', 'confirmed', 'book', 'deal', 'interested', 'sounds good'];
        const negativeWords = ['frustrated', 'angry', 'disappointed', 'terrible', 'hung up', 'declined', 'refused', 'no thanks', 'not interested', 'too low', 'waste'];
        
        let positiveScore = positiveWords.filter(w => text.includes(w)).length;
        let negativeScore = negativeWords.filter(w => text.includes(w)).length;
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
      };

      const sentiments = callsData.map(c => ({ ...c, analyzedSentiment: analyzeSentiment(c) }));
      
      const positiveCalls = sentiments.filter(c => c.analyzedSentiment === 'positive').length;
      const negativeCalls = sentiments.filter(c => c.analyzedSentiment === 'negative').length;
      const neutralCalls = sentiments.filter(c => c.analyzedSentiment === 'neutral').length;

      // Repeat callers analysis
      const callerCounts: Record<string, { count: number; lastCall: string }> = {};
      callsData.forEach(call => {
        const phone = call.carrier_phone || 'Unknown';
        if (!callerCounts[phone]) {
          callerCounts[phone] = { count: 0, lastCall: call.call_started_at || '' };
        }
        callerCounts[phone].count++;
        if (call.call_started_at && call.call_started_at > callerCounts[phone].lastCall) {
          callerCounts[phone].lastCall = call.call_started_at;
        }
      });

      const repeatCallers = Object.entries(callerCounts)
        .filter(([_, data]) => data.count > 1)
        .map(([phone, data]) => ({
          phone: phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
          callCount: data.count,
          lastCallDate: data.lastCall ? format(new Date(data.lastCall), 'MMM d, yyyy') : 'N/A'
        }))
        .sort((a, b) => b.callCount - a.callCount)
        .slice(0, 10);

      const totalRepeatCallers = Object.values(callerCounts).filter(c => c.count > 1).length;
      const uniqueCallers = Object.keys(callerCounts).length;
      const repeatCallRate = uniqueCallers > 0 ? (totalRepeatCallers / uniqueCallers) * 100 : 0;

      // Common issues/topics from summaries
      const issueKeywords = [
        { keyword: 'rate', label: 'Rate Discussion' },
        { keyword: 'too low', label: 'Rate Too Low' },
        { keyword: 'equipment', label: 'Equipment Questions' },
        { keyword: 'pickup', label: 'Pickup Timing' },
        { keyword: 'delivery', label: 'Delivery Questions' },
        { keyword: 'callback', label: 'Callback Requested' },
        { keyword: 'not available', label: 'Load Not Available' },
        { keyword: 'detention', label: 'Detention Concerns' },
      ];

      const topIssues = issueKeywords.map(({ keyword, label }) => ({
        issue: label,
        count: callsData.filter(c => 
          `${c.summary || ''} ${c.transcript || ''}`.toLowerCase().includes(keyword)
        ).length
      })).filter(i => i.count > 0).sort((a, b) => b.count - a.count);

      // Outcomes with sentiment correlation
      const outcomes = ['completed', 'callback_requested', 'declined', 'no_answer'];
      const outcomesSentiment = outcomes.map(outcome => {
        const outcomeCalls = sentiments.filter(c => c.call_outcome === outcome);
        return {
          outcome: outcome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          positive: outcomeCalls.filter(c => c.analyzedSentiment === 'positive').length,
          neutral: outcomeCalls.filter(c => c.analyzedSentiment === 'neutral').length,
          negative: outcomeCalls.filter(c => c.analyzedSentiment === 'negative').length,
        };
      }).filter(o => o.positive + o.neutral + o.negative > 0);

      setData({
        positiveCalls,
        neutralCalls,
        negativeCalls,
        totalAnalyzedCalls: callsData.length,
        repeatCallers,
        totalRepeatCallers,
        repeatCallRate,
        topIssues,
        outcomesSentiment
      });
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const sentimentPieData = [
    { name: 'Positive', value: data.positiveCalls, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: data.neutralCalls, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: data.negativeCalls, color: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Sentiment KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Positive Calls</p>
                <p className="text-2xl font-bold text-green-600">{data.positiveCalls}</p>
                <p className="text-xs text-muted-foreground">
                  {data.totalAnalyzedCalls > 0 ? Math.round((data.positiveCalls / data.totalAnalyzedCalls) * 100) : 0}% of calls
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Neutral Calls</p>
                <p className="text-2xl font-bold text-amber-600">{data.neutralCalls}</p>
                <p className="text-xs text-muted-foreground">
                  {data.totalAnalyzedCalls > 0 ? Math.round((data.neutralCalls / data.totalAnalyzedCalls) * 100) : 0}% of calls
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Meh className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Negative Calls</p>
                <p className="text-2xl font-bold text-red-600">{data.negativeCalls}</p>
                <p className="text-xs text-muted-foreground">
                  {data.totalAnalyzedCalls > 0 ? Math.round((data.negativeCalls / data.totalAnalyzedCalls) * 100) : 0}% of calls
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ThumbsDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Repeat Callers</p>
                <p className="text-2xl font-bold text-blue-600">{data.totalRepeatCallers}</p>
                <p className="text-xs text-muted-foreground">{Math.round(data.repeatCallRate)}% return rate</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Repeat className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Call Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {sentimentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {sentimentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  No sentiment data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Outcome Sentiment Correlation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sentiment by Call Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.outcomesSentiment.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.outcomesSentiment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="outcome" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" />
                    <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
                    <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No outcome data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Common Call Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topIssues.length > 0 ? (
                data.topIssues.slice(0, 6).map((issue, index) => (
                  <div key={issue.issue} className="flex items-center justify-between">
                    <span className="text-sm">{issue.issue}</span>
                    <Badge variant="secondary">{issue.count} calls</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No topic data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Repeat Callers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Repeat Callers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.repeatCallers.length > 0 ? (
                data.repeatCallers.slice(0, 6).map((caller, index) => (
                  <div key={caller.phone} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{caller.phone}</p>
                      <p className="text-xs text-muted-foreground">Last call: {caller.lastCallDate}</p>
                    </div>
                    <Badge variant={caller.callCount > 3 ? 'default' : 'secondary'}>
                      {caller.callCount} calls
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No repeat callers in this period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
