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
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ActionItem {
  task: string;
  owner?: string;
  timeline?: string;
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
}) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasAnyNotes = aiSummary || (aiDecisions && aiDecisions.length > 0) || 
    (aiActionItems && aiActionItems.length > 0) || transcript;

  if (!hasAnyNotes || aiNotesStatus === 'none') {
    return null;
  }

  const copyAllNotes = () => {
    let content = "# AI Meeting Notes\n\n";
    
    if (aiSummary) {
      content += "## Executive Summary\n" + aiSummary + "\n\n";
    }
    
    if (aiDecisions && aiDecisions.length > 0) {
      content += "## Decisions\n";
      aiDecisions.forEach((d: any, i) => {
        content += `${i + 1}. ${d.decision || d}\n`;
      });
      content += "\n";
    }
    
    if (aiActionItems && aiActionItems.length > 0) {
      content += "## Action Items\n";
      aiActionItems.forEach((item, i) => {
        content += `${i + 1}. ${item.task}`;
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
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            AI Meeting Notes
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
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
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Executive Summary
            </h4>
            <div className="bg-background/50 rounded-lg p-3 text-sm text-muted-foreground">
              {aiSummary.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Decisions */}
        {aiDecisions && aiDecisions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Decisions Made
            </h4>
            <ul className="space-y-2">
              {aiDecisions.map((decision: any, i) => (
                <li key={i} className="flex items-start gap-2 bg-background/50 rounded-lg p-3 text-sm">
                  <span className="text-green-600 font-medium">{i + 1}.</span>
                  <span className="text-muted-foreground">{decision.decision || decision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {aiActionItems && aiActionItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <ListTodo className="w-4 h-4 text-blue-600" />
              Action Items
            </h4>
            <ul className="space-y-2">
              {aiActionItems.map((item, i) => (
                <li key={i} className="bg-background/50 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-medium">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-foreground">{item.task}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {item.owner && <span>Owner: <strong>{item.owner}</strong></span>}
                        {item.timeline && <span>Due: <strong>{item.timeline}</strong></span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Agenda Recap */}
        {aiAgendaRecap && aiAgendaRecap.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              Agenda Item Recap
            </h4>
            <ul className="space-y-2">
              {aiAgendaRecap.map((recap, i) => (
                <li key={i} className="bg-background/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground">{recap.item}</p>
                  <p className="text-muted-foreground mt-1">{recap.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks & Blockers */}
        {aiRisks && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Risks & Blockers
            </h4>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-muted-foreground">
              {aiRisks}
            </div>
          </div>
        )}

        {/* Next Meeting Prep */}
        {aiNextMeetingPrep && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Next Meeting Prep
            </h4>
            <div className="bg-background/50 rounded-lg p-3 text-sm text-muted-foreground">
              {aiNextMeetingPrep}
            </div>
          </div>
        )}

        <Separator />

        {/* Transcript (Collapsible) */}
        {transcript && (
          <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Full Transcript
                </span>
                {transcriptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[300px] mt-2">
                <div className="bg-background/50 rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                  {transcript}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
