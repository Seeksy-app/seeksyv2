import { useState } from "react";
import { Clock, MessageSquare, Send, CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AgendaItem {
  text: string;
  checked: boolean;
}

interface MemberQuestion {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

interface WaitingForHostScreenProps {
  meeting: {
    id: string;
    title: string;
    meeting_date: string;
    start_time: string | null;
    duration_minutes: number;
    agenda_items: AgendaItem[];
    memo: any;
    member_questions: MemberQuestion[];
  };
  currentUserName: string;
  onAddQuestion: (question: string) => void;
}

export function WaitingForHostScreen({
  meeting,
  currentUserName,
  onAddQuestion,
}: WaitingForHostScreenProps) {
  const [newQuestion, setNewQuestion] = useState("");

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    onAddQuestion(newQuestion.trim());
    setNewQuestion("");
  };

  const formatMeetingDate = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00"), "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Waiting banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            Waiting for Host to Start
          </h2>
          <p className="text-amber-700">
            The meeting will begin when the host starts it. You can review the agenda and add pre-meeting questions below.
          </p>
        </CardContent>
      </Card>

      {/* Meeting details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {meeting.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <strong>Date:</strong> {formatMeetingDate(meeting.meeting_date)}
            </span>
            {meeting.start_time && (
              <span>
                <strong>Time:</strong> {meeting.start_time.substring(0, 5)}
              </span>
            )}
            <span>
              <strong>Duration:</strong> {meeting.duration_minutes} minutes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Agenda (read-only) */}
      {meeting.agenda_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meeting.agenda_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground font-mono text-sm">
                    {i + 1}.
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Board Memo (read-only) */}
      {meeting.memo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Board Memo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.memo.purpose && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Purpose</h4>
                <p>{meeting.memo.purpose}</p>
              </div>
            )}
            {meeting.memo.objective && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Objective</h4>
                <p>{meeting.memo.objective}</p>
              </div>
            )}
            {meeting.memo.key_questions?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Key Questions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {meeting.memo.key_questions.map((q: string, i: number) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pre-meeting questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Pre-Meeting Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing questions */}
            {meeting.member_questions.length > 0 && (
              <div className="space-y-2">
                {meeting.member_questions.map((q) => (
                  <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {q.author}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(q.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm">{q.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add new question */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a question for the meeting..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
              />
              <Button onClick={handleSubmitQuestion} disabled={!newQuestion.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your questions will be visible to all participants when the meeting starts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
