import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, PhoneOff, Voicemail, Clock, Search, AlertCircle, CheckCircle2, FileText, Headphones, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TruckingPageWrapper, TruckingContentCard } from "@/components/trucking/TruckingPageWrapper";
import { formatDistanceToNow, format } from "date-fns";
import { getOutcomeLabel, getOutcomeTooltip } from "@/constants/truckingOutcomes";
import { CallDetailDrawer } from "@/components/trucking/CallDetailDrawer";

interface CallLog {
  id: string;
  carrier_phone: string | null;
  call_direction: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  duration_seconds: number | null;
  outcome: string | null;
  call_outcome: string | null;
  summary: string | null;
  transcript_url: string | null;
  recording_url: string | null;
  routed_to_voicemail: boolean | null;
  voicemail_transcript: string | null;
  estimated_cost_usd: number | null;
  is_demo: boolean | null;
  failure_reason: string | null;
  load_id: string | null;
  lead_id: string | null;
  language: string | null;
  total_characters: number | null;
  trucking_loads?: { load_number: string } | null;
  trucking_call_transcripts?: {
    transcript_text: string | null;
    sentiment: string | null;
    key_topics: string[] | null;
    negotiation_outcome: string | null;
    rate_discussed: number | null;
  }[] | null;
}

const outcomeColors: Record<string, string> = {
  interested: "bg-green-500/10 text-green-600",
  booked: "bg-blue-500/10 text-blue-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  countered: "bg-yellow-500/10 text-yellow-600",
  declined: "bg-red-500/10 text-red-600",
  no_answer: "bg-gray-500/10 text-gray-600",
  voicemail: "bg-purple-500/10 text-purple-600",
  failed: "bg-red-500/10 text-red-600",
  error: "bg-red-500/10 text-red-600",
  completed: "bg-green-500/10 text-green-600",
  callback_requested: "bg-orange-500/10 text-orange-600",
  unconfirmed: "bg-yellow-500/10 text-yellow-600",
  lead_created: "bg-green-500/10 text-green-600",
  caller_hung_up: "bg-yellow-500/10 text-yellow-600",
  no_load_found: "bg-orange-500/10 text-orange-600",
  call_completed: "bg-blue-500/10 text-blue-600",
  unknown: "bg-gray-500/10 text-gray-600",
  pending: "bg-gray-500/10 text-gray-600",
};

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("trucking_call_logs")
        .select(`
          *, 
          trucking_loads(load_number),
          trucking_call_transcripts(transcript_text, sentiment, key_topics, negotiation_outcome, rate_discussed)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs((data as CallLog[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading call logs", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-backfill-calls', {
        body: { limit: 100 }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        const results = data.results;
        toast({ 
          title: "Backfill Complete", 
          description: `Processed ${results.processed} calls. Updated: ${results.updated}, Errors: ${results.errors}` 
        });
        // Refresh the logs
        await fetchLogs();
      } else {
        throw new Error(data?.error || 'Backfill failed');
      }
    } catch (error: any) {
      toast({ title: "Backfill failed", description: error.message, variant: "destructive" });
    } finally {
      setBackfilling(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getOutcome = (log: CallLog): string => {
    if (log.routed_to_voicemail) return "voicemail";
    if (log.failure_reason) return "failed";
    return log.outcome || log.call_outcome || "unknown";
  };

  const filteredLogs = logs.filter((log) => {
    const outcome = getOutcome(log);
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "confirmed" && log.lead_id && ["interested", "booked", "countered"].includes(outcome)) ||
      (activeTab === "unconfirmed" && !log.lead_id && outcome !== "voicemail" && outcome !== "failed") ||
      (activeTab === "voicemail" && log.routed_to_voicemail);
    
    const matchesSearch = 
      !searchQuery ||
      log.carrier_phone?.includes(searchQuery) ||
      log.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.trucking_loads?.load_number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const stats = {
    total: logs.length,
    confirmed: logs.filter(l => l.lead_id && ["interested", "booked", "countered"].includes(getOutcome(l))).length,
    voicemails: logs.filter(l => l.routed_to_voicemail).length,
    unconfirmed: logs.filter(l => !l.lead_id && !l.routed_to_voicemail && !l.failure_reason).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <TruckingPageWrapper
      title="Call Logs"
      description="View all AI call history and outcomes"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackfill}
          disabled={backfilling}
          className="gap-2"
        >
          {backfilling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Backfill from ElevenLabs
        </Button>
      }
    >
      {/* Stats Summary */}
      <div className="text-xs text-slate-500 mb-4 flex items-center gap-6">
        <span>Total: {stats.total}</span>
        <span>•</span>
        <span className="text-green-600">Confirmed: {stats.confirmed}</span>
        <span>•</span>
        <span className="text-purple-600">Voicemails: {stats.voicemails}</span>
        <span>•</span>
        <span className="text-amber-600">Unconfirmed: {stats.unconfirmed}</span>
      </div>

      <TruckingContentCard>
        <div className="space-y-4">
          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Calls</TabsTrigger>
                <TabsTrigger value="confirmed" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Confirmed
                </TabsTrigger>
                <TabsTrigger value="unconfirmed" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Unconfirmed
                </TabsTrigger>
                <TabsTrigger value="voicemail">Voicemails</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search phone, load..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>

          {/* Table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Phone className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No call logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const outcome = getOutcome(log);
                  const transcript = log.trucking_call_transcripts?.[0];
                  const hasTranscript = transcript?.transcript_text || log.voicemail_transcript;
                  const hasRecording = log.recording_url;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {log.routed_to_voicemail ? (
                            <Voicemail className="h-4 w-4 text-purple-500" />
                          ) : outcome === "failed" ? (
                            <PhoneOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Phone className="h-4 w-4 text-green-500" />
                          )}
                          {log.carrier_phone || "Unknown"}
                        </div>
                        {log.language && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {log.language === 'es' ? 'Spanish' : 'English'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.trucking_loads?.load_number || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {log.call_started_at 
                            ? formatDistanceToNow(new Date(log.call_started_at), { addSuffix: true })
                            : "—"
                          }
                        </div>
                        {log.call_started_at && (
                          <div className="text-xs text-slate-400">
                            {format(new Date(log.call_started_at), "MMM d, h:mm a")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(log.duration_seconds)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={`cursor-help ${outcomeColors[outcome] || "bg-gray-500/10 text-gray-600"}`}>
                                {getOutcomeLabel(outcome)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{getOutcomeTooltip(outcome)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {log.is_demo && (
                          <Badge variant="outline" className="ml-1 text-xs">DEMO</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedLog(log);
                              setDrawerOpen(true);
                            }}
                            title="View call details"
                          >
                            <FileText className={`h-4 w-4 ${hasTranscript ? 'text-blue-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedLog(log);
                              setDrawerOpen(true);
                            }}
                            title={hasRecording ? "Play recording" : "View details"}
                          >
                            <Headphones className={`h-4 w-4 ${hasRecording ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </TruckingContentCard>

      {/* Call Detail Drawer */}
      <CallDetailDrawer 
        call={selectedLog} 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
      />
    </TruckingPageWrapper>
  );
}
