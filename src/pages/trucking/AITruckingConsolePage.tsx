import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, PhoneIncoming, PhoneOutgoing, Play, MessageSquare, Clock, User, CheckCircle, XCircle, TrendingUp, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface CallLog {
  id: string;
  carrier_phone: string | null;
  load_id: string | null;
  call_direction: string | null;
  summary: string | null;
  transcript_url: string | null;
  recording_url: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  created_at: string | null;
  language: string | null;
  outcome: string | null;
  lead_id: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
  trucking_loads?: { load_number: string } | null;
}

export default function AITruckingConsolePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all_calls");
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  // Fetch call logs with filters
  const { data: callLogs = [], isLoading } = useQuery({
    queryKey: ['trucking-call-logs', activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('trucking_call_logs')
        .select(`*, trucking_loads(load_number)`)
        .eq('owner_id', user.id)
        .order('call_started_at', { ascending: false });

      if (activeTab === 'successful_calls') {
        query = query.eq('outcome', 'lead_created');
      } else if (activeTab === 'incomplete_calls') {
        query = query.in('outcome', ['caller_hung_up', 'no_load_found', 'error', 'other']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CallLog[];
    }
  });

  // Fetch analytics for today
  const { data: analytics } = useQuery({
    queryKey: ['trucking-call-analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalCalls: 0, successfulLeads: 0, incompleteCalls: 0, successRate: 0 };

      const today = new Date().toISOString().split('T')[0];
      
      const { data: allCalls } = await supabase
        .from('trucking_call_logs')
        .select('id, outcome')
        .eq('owner_id', user.id)
        .gte('call_started_at', today);

      const totalCalls = allCalls?.length || 0;
      const successfulLeads = allCalls?.filter(c => c.outcome === 'lead_created').length || 0;
      const incompleteCalls = allCalls?.filter(c => 
        ['caller_hung_up', 'no_load_found', 'error', 'other'].includes(c.outcome || '')
      ).length || 0;
      const successRate = totalCalls > 0 ? Math.round((successfulLeads / totalCalls) * 100) : 0;

      return { totalCalls, successfulLeads, incompleteCalls, successRate };
    }
  });

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'lead_created':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Lead Created</Badge>;
      case 'caller_hung_up':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Hung Up</Badge>;
      case 'no_load_found':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">No Load</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Error</Badge>;
      case 'call_completed':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{outcome || 'Pending'}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null, start?: string | null, end?: string | null) => {
    if (seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    if (start && end) {
      const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    return '—';
  };

  const handleRowClick = (call: CallLog) => {
    setSelectedCall(call);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/trucking/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Call Console</h1>
            <p className="text-muted-foreground">Monitor Jess's call activity and performance</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls (Today)</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Created</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.successfulLeads || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Incomplete Calls</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{analytics?.incompleteCalls || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics?.successRate || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Call Logs Table */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all_calls">All Calls</TabsTrigger>
                <TabsTrigger value="successful_calls">Successful</TabsTrigger>
                <TabsTrigger value="incomplete_calls">Incomplete</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : callLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No calls yet</p>
                <p className="text-sm mt-2">Calls will appear here when carriers contact Jess</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((call) => (
                    <TableRow 
                      key={call.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(call)}
                    >
                      <TableCell>
                        {call.call_started_at 
                          ? format(new Date(call.call_started_at), 'MMM d, h:mm a')
                          : call.created_at 
                            ? format(new Date(call.created_at), 'MMM d, h:mm a')
                            : '—'}
                      </TableCell>
                      <TableCell className="font-mono">{call.carrier_phone || '—'}</TableCell>
                      <TableCell>{call.trucking_loads?.load_number || '—'}</TableCell>
                      <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                      <TableCell>
                        {formatDuration(call.duration_seconds, call.call_started_at, call.call_ended_at)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {call.failure_reason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Call Detail Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Call Details</SheetTitle>
            </SheetHeader>
            {selectedCall && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Caller</label>
                    <p className="font-mono font-medium">{selectedCall.carrier_phone || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Direction</label>
                    <p className="capitalize">{selectedCall.call_direction || 'Inbound'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Outcome</label>
                  <div className="mt-1">{getOutcomeBadge(selectedCall.outcome)}</div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Language</label>
                  <p>{selectedCall.language === 'es' ? 'Spanish' : 'English'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <p>{formatDuration(selectedCall.duration_seconds, selectedCall.call_started_at, selectedCall.call_ended_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Summary</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedCall.summary || 'No summary available'}
                  </p>
                </div>
                
                {selectedCall.failure_reason && (
                  <div>
                    <label className="text-sm text-muted-foreground">Failure Reason</label>
                    <p className="text-sm text-yellow-600 mt-1">{selectedCall.failure_reason}</p>
                  </div>
                )}
                
                {selectedCall.recording_url && (
                  <div>
                    <label className="text-sm text-muted-foreground">Recording</label>
                    <audio controls className="w-full mt-2">
                      <source src={selectedCall.recording_url} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
                
                {selectedCall.transcript_url && (
                  <div>
                    <Button variant="outline" asChild className="w-full">
                      <a href={selectedCall.transcript_url} target="_blank" rel="noopener noreferrer">
                        View Full Transcript
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
