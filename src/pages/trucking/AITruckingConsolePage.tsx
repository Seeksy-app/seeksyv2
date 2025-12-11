import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, PhoneIncoming, PhoneOutgoing, Play, MessageSquare, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CallLog {
  id: string;
  carrier_phone: string;
  call_direction: string;
  summary: string;
  transcript_url: string;
  recording_url: string;
  call_started_at: string;
  call_ended_at: string;
  created_at: string;
  trucking_loads?: { load_number: string } | null;
}

export default function AITruckingConsolePage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trucking_call_logs")
        .select("*, trucking_loads(load_number)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getCallDuration = (start: string, end: string) => {
    if (!start || !end) return "—";
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Console</h1>
        <p className="text-muted-foreground">Monitor AI-handled carrier calls and conversations</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Call List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Recent Calls
            </CardTitle>
            <CardDescription>{calls.length} calls logged</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {calls.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calls yet</p>
                  <p className="text-sm mt-2">
                    Calls will appear here when carriers contact your AI dispatcher
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {calls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedCall?.id === call.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {call.call_direction === "inbound" ? (
                            <PhoneIncoming className="h-4 w-4 text-green-500" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{call.carrier_phone}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(call.created_at), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {call.summary || "No summary"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {call.trucking_loads?.load_number || "No load"}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getCallDuration(call.call_started_at, call.call_ended_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Call Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCall ? (
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="recording">Recording</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Carrier Phone</Label>
                      <p className="font-medium">{selectedCall.carrier_phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Direction</Label>
                      <p className="font-medium capitalize">{selectedCall.call_direction}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Duration</Label>
                      <p className="font-medium">
                        {getCallDuration(selectedCall.call_started_at, selectedCall.call_ended_at)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Load</Label>
                      <p className="font-medium">
                        {selectedCall.trucking_loads?.load_number || "Not identified"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">AI Summary</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">
                      {selectedCall.summary || "No summary available for this call."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="mt-4">
                  {selectedCall.transcript_url ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Transcript available at: {selectedCall.transcript_url}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transcript available for this call</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recording" className="mt-4">
                  {selectedCall.recording_url ? (
                    <div className="space-y-4">
                      <audio controls className="w-full">
                        <source src={selectedCall.recording_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recording available for this call</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a call to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium ${className}`}>{children}</p>;
}
