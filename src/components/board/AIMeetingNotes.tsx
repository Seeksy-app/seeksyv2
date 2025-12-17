import { useState } from "react";
import { format } from "date-fns";
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ListTodo, 
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Square,
  CheckSquare,
  User,
  Calendar,
  Volume2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ActionItem {
  task: string;
  owner?: string;
  timeline?: string;
  completed?: boolean;
}

interface AgendaRecap {
  item: string;
  summary: string;
}

interface AIMeetingNotesProps {
  aiSummary: string | null;
  aiDecisions: any[] | null;
  aiActionItems: ActionItem[] | null;
  aiAgendaRecap: AgendaRecap[] | null;
  aiRisks: string | null;
  aiNextMeetingPrep: string | null;
  transcript: string | null;
  aiNotesStatus: string | null;
  generatedAt: string | null;
  audioUrl?: string | null;
  onActionItemToggle?: (index: number, completed: boolean) => void;
}

export const AIMeetingNotes: React.FC<AIMeetingNotesProps> = ({
  aiSummary,
  aiDecisions,
  aiActionItems,
  aiAgendaRecap,
  aiRisks,
  aiNextMeetingPrep,
  transcript,
  aiNotesStatus,
  generatedAt,
  audioUrl,
  onActionItemToggle,
}) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localActionItems, setLocalActionItems] = useState<ActionItem[]>(aiActionItems || []);

  // Format transcript with better structure
  const formatTranscript = (text: string) => {
    if (!text) return [];
    
    // Split by common speaker patterns or double newlines
    const lines = text.split(/\n\n|\n(?=[A-Z][a-z]*:)|(?<=\.)\s*(?=[A-Z][a-z]*\s+[A-Z][a-z]*:)/g);
    
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      // Check if line starts with a speaker name pattern (e.g., "John:", "Speaker 1:", "John Smith:")
      const speakerMatch = trimmed.match(/^([A-Z][a-zA-Z\s]*?):\s*(.*)$/s);
      
      if (speakerMatch) {
        return {
          type: 'speaker' as const,
          speaker: speakerMatch[1].trim(),
          content: speakerMatch[2].trim(),
          key: index,
        };
      }
      
      return {
        type: 'text' as const,
        content: trimmed,
        key: index,
      };
    }).filter(Boolean);
  };

  const hasAnyNotes = aiSummary || (aiDecisions && aiDecisions.length > 0) || 
    (aiActionItems && aiActionItems.length > 0) || transcript;

  if (!hasAnyNotes || aiNotesStatus === 'none') {
    return null;
  }

  const handleActionItemToggle = (index: number) => {
    const updated = [...localActionItems];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    setLocalActionItems(updated);
    onActionItemToggle?.(index, updated[index].completed || false);
  };

  const completedCount = localActionItems.filter(i => i.completed).length;
  const totalActionItems = localActionItems.length;

  const copyAllNotes = () => {
    let content = "# AI Meeting Notes\n\n";
    
    if (aiSummary) {
      content += "## Executive Summary\n" + aiSummary + "\n\n";
    }
    
    if (aiDecisions && aiDecisions.length > 0) {
      content += "## Decisions\n";
      aiDecisions.forEach((d: any, i) => {
        const text = typeof d === 'string' ? d : (d.statement || d.decision || JSON.stringify(d));
        content += `${i + 1}. ${text}`;
        if (d.owner) content += ` (Owner: ${d.owner})`;
        if (d.status) content += ` [${d.status}]`;
        content += "\n";
      });
      content += "\n";
    }
    
    if (localActionItems.length > 0) {
      content += "## Action Items\n";
      localActionItems.forEach((item, i) => {
        const checkbox = item.completed ? "[x]" : "[ ]";
        content += `${checkbox} ${item.task}`;
        if (item.owner) content += ` (Owner: ${item.owner})`;
        if (item.timeline) content += ` - Due: ${item.timeline}`;
        content += "\n";
      });
      content += "\n";
    }
    
    if (aiRisks) {
      content += "## Risks & Blockers\n" + aiRisks + "\n\n";
    }
    
    if (aiNextMeetingPrep) {
      content += "## Next Meeting Prep\n" + aiNextMeetingPrep + "\n\n";
    }
    
    if (transcript) {
      content += "## Full Transcript\n" + transcript + "\n";
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Notes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            AI Meeting Notes
            <Badge variant="outline" className={`ml-2 ${aiNotesStatus === 'draft' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'}`}>
              {aiNotesStatus === 'draft' ? 'Draft' : 'Generated'}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-xs text-muted-foreground">
                Generated {format(new Date(generatedAt), "MMM d 'at' h:mm a")}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={copyAllNotes}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copied!" : "Copy All"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        {aiSummary && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              Executive Summary
            </h4>
            <div className="bg-card border rounded-xl p-4 text-sm leading-relaxed">
              {aiSummary.split('\n').map((line, i) => (
                <p key={i} className={`${line.startsWith('•') || line.startsWith('-') ? 'ml-4 text-muted-foreground' : 'text-foreground'} ${i > 0 ? 'mt-2' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Decisions */}
        {aiDecisions && aiDecisions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              Decisions Made
              <Badge variant="secondary" className="ml-auto">{aiDecisions.length}</Badge>
            </h4>
            <div className="grid gap-3">
              {aiDecisions.map((decision: any, i) => {
                const text = typeof decision === 'string' ? decision : (decision.statement || decision.decision || '');
                return (
                  <div key={i} className="bg-card border rounded-xl p-4 hover:border-green-500/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{text}</p>
                        {(decision.owner || decision.status || decision.notes) && (
                          <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                            {decision.owner && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-3 h-3" />
                                {decision.owner}
                              </span>
                            )}
                            {decision.status && (
                              <Badge variant="outline" className="text-xs">
                                {decision.status}
                              </Badge>
                            )}
                            {decision.notes && (
                              <span className="text-muted-foreground/70 italic">{decision.notes}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Items with Checkboxes */}
        {localActionItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/10">
                  <ListTodo className="w-4 h-4 text-blue-600" />
                </div>
                Action Items
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {completedCount} of {totalActionItems} completed
                </span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${totalActionItems > 0 ? (completedCount / totalActionItems) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {localActionItems.map((item, i) => (
                <div 
                  key={i} 
                  className={`bg-card border rounded-xl p-4 transition-all duration-200 ${item.completed ? 'opacity-60 bg-muted/30' : 'hover:border-blue-500/30'}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed || false}
                      onCheckedChange={() => handleActionItemToggle(i)}
                      className="mt-0.5 h-5 w-5 rounded border-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {item.task}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                        {item.owner && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3 h-3" />
                            {item.owner}
                          </span>
                        )}
                        {item.timeline && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {item.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agenda Recap */}
        {aiAgendaRecap && aiAgendaRecap.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-purple-500/10">
                <ClipboardList className="w-4 h-4 text-purple-600" />
              </div>
              Agenda Item Recap
              <Badge variant="secondary" className="ml-auto">{aiAgendaRecap.length}</Badge>
            </h4>
            <div className="grid gap-3">
              {aiAgendaRecap.map((recap, i) => (
                <div key={i} className="bg-card border rounded-xl p-4">
                  <p className="font-medium text-sm text-foreground">{recap.item}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{recap.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks & Blockers */}
        {aiRisks && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              Risks & Blockers
            </h4>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm leading-relaxed text-foreground">
              {aiRisks.split('\n').map((line, i) => (
                <p key={i} className={`${line.startsWith('•') || line.startsWith('-') ? 'ml-4 text-amber-700 dark:text-amber-400' : ''} ${i > 0 ? 'mt-2' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Next Meeting Prep */}
        {aiNextMeetingPrep && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Next Meeting Prep
            </h4>
            <div className="bg-card border rounded-xl p-4 text-sm leading-relaxed text-muted-foreground">
              {aiNextMeetingPrep.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Audio Player + Transcript (Collapsible) */}
        {transcript && (
          <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Full Transcript
                </span>
                {transcriptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-2">
              {/* Audio Player */}
              {audioUrl && (
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Volume2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Meeting Recording</span>
                  </div>
                  <audio
                    controls
                    className="w-full h-10 rounded-lg"
                    src={audioUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {/* Formatted Transcript */}
              <ScrollArea className="h-[400px]">
                <div className="bg-muted/30 border rounded-xl p-4 space-y-4">
                  {formatTranscript(transcript).map((segment) => {
                    if (!segment) return null;
                    
                    if (segment.type === 'speaker') {
                      return (
                        <div key={segment.key} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-primary/10">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {segment.speaker}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                            {segment.content}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <p key={segment.key} className="text-sm text-muted-foreground leading-relaxed">
                        {segment.content}
                      </p>
                    );
                  })}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
