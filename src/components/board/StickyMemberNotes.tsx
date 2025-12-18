import { useState } from "react";
import { format } from "date-fns";
import { MessageSquarePlus, Send, User, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MemberNote {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface StickyMemberNotesProps {
  meetingId: string;
  memberNotes: MemberNote[];
  onNotesUpdated: () => void;
}

export const StickyMemberNotes: React.FC<StickyMemberNotesProps> = ({
  meetingId,
  memberNotes = [],
  onNotesUpdated,
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, account_full_name")
        .eq("id", user.id)
        .single();

      const authorName = profile?.full_name || profile?.account_full_name || user.email?.split("@")[0] || "Board Member";

      const newMemberNote: MemberNote = {
        id: crypto.randomUUID(),
        author_id: user.id,
        author_name: authorName,
        content: newNote.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedNotes = [...memberNotes, newMemberNote];

      const { error } = await supabase
        .from("board_meeting_notes")
        .update({ member_notes: updatedNotes as any })
        .eq("id", meetingId);

      if (error) throw error;

      setNewNote("");
      onNotesUpdated();
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sticky top-4 h-fit max-h-[calc(100vh-2rem)]">
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <StickyNote className="w-4 h-4 text-blue-600" />
            </div>
            My Notes
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Add notes as you review
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add New Note - Always visible at top */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSubmitNote();
                }
              }}
            />
            <Button
              onClick={handleSubmitNote}
              disabled={!newNote.trim() || isSubmitting}
              size="sm"
              className="w-full gap-2"
            >
              <Send className="w-3 h-3" />
              {isSubmitting ? "Saving..." : "Add Note"}
            </Button>
          </div>

          {/* Existing Notes */}
          {memberNotes.length > 0 && (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">
                  {memberNotes.length} note{memberNotes.length !== 1 ? 's' : ''}
                </p>
                {memberNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-card border rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-foreground">{note.author_name}</span>
                      <span>•</span>
                      <span>{format(new Date(note.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
