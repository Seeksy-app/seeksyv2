import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface TicketDetailDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TicketDetailDialog = ({ ticketId, open, onOpenChange, onSuccess }: TicketDetailDialogProps) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: ticket, refetch: refetchTicket } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          client:clients(contact_name, company_name)
        `)
        .eq("id", ticketId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["ticket-comments", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: ticketId,
        user_id: user.id,
        comment_text: comment,
      });

      if (error) throw error;

      toast.success("Comment added");
      setComment("");
      refetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Status updated");
      refetchTicket();
      onSuccess();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DialogTitle>{ticket.ticket_number}</DialogTitle>
              <Badge>{ticket.priority}</Badge>
            </div>
            <h2 className="text-xl font-semibold">{ticket.title}</h2>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Update */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            <Select value={ticket.status} onValueChange={handleUpdateStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          {ticket.description && (
            <Card className="p-4">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </Card>
          )}

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversation ({comments?.length || 0})
            </h3>

            <div className="space-y-3">
              {comments?.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">User</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.comment_text}</p>
                </Card>
              ))}

              {comments?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Start the conversation below.
                </p>
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={loading || !comment.trim()}>
                  {loading ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
