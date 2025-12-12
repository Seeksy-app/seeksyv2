import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, FileText, Mail, Trash2, RotateCcw, Reply } from "lucide-react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailTrackingPills } from "./EmailTrackingPills";
import { useState } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { EngagementTimelinePanel } from "./EngagementTimelinePanel";
import { EmailRepliesPanel } from "./EmailRepliesPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  clicked_url?: string;
  bounce_reason?: string;
}

interface EmailViewerProps {
  email: {
    id: string;
    to_email: string;
    from_email: string;
    email_subject: string;
    event_type: string;
    created_at: string;
    campaign_name?: string;
    template_name?: string;
    html_content?: string;
    device_type?: string;
    user_agent?: string;
    ip_address?: string;
    is_inbox?: boolean;
  } | null;
  events: EmailEvent[];
  onResend?: () => void;
  onDuplicate?: () => void;
  onReply?: () => void;
  onViewTemplate?: () => void;
  onViewCampaign?: () => void;
  onDelete?: () => void;
}

const getStatusColor = (eventType: string) => {
  // Normalize event type by removing "email." prefix if present
  const normalizedType = eventType.replace("email.", "");
  
  switch (normalizedType) {
    case "delivered":
      return "text-green-500";
    case "opened":
      return "text-blue-500";
    case "clicked":
      return "text-purple-500";
    case "bounced":
      return "text-red-500";
    case "unsubscribed":
      return "text-orange-500";
    case "sent":
      return "text-blue-400";
    default:
      return "text-muted-foreground";
  }
};

const eventOrder = ["email.sent", "email.delivered", "email.opened", "email.clicked"];

export function EmailViewer({
  email,
  events,
  onResend,
  onDuplicate,
  onReply,
  onViewTemplate,
  onViewCampaign,
  onDelete,
}: EmailViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timelinePanelOpen, setTimelinePanelOpen] = useState(false);

  // Check if email is trashed using deleted_at field
  const isTrashed = !!(email as any)?.deleted_at;

  const deleteForeverMutation = useMutation({
    mutationFn: async () => {
      if (!email) return;
      
      // Check if this is an inbox message
      const isInboxEmail = (email as any).is_inbox || email.event_type === "received";
      
      if (isInboxEmail) {
        // Permanently delete from inbox_messages
        const { error } = await supabase
          .from("inbox_messages")
          .delete()
          .eq("id", email.id);
        if (error) throw error;
      } else {
        // Permanently delete from email_events
        const { error } = await supabase
          .from("email_events")
          .delete()
          .eq("id", email.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Email permanently deleted" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      if (onDelete) onDelete();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreEmailMutation = useMutation({
    mutationFn: async () => {
      if (!email) return;
      
      // Check if this is an inbox message
      const isInboxEmail = (email as any).is_inbox || email.event_type === "received";
      
      if (isInboxEmail) {
        // Restore inbox message by clearing deleted_at
        const { error } = await supabase
          .from("inbox_messages")
          .update({ deleted_at: null })
          .eq("id", email.id);
        if (error) throw error;
      } else {
        // Restore email_events by clearing deleted_at
        const { error } = await supabase
          .from("email_events")
          .update({ 
            deleted_at: null,
            original_event_type: null
          })
          .eq("id", email.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Email restored" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      if (onDelete) onDelete(); // Clears selection
    },
    onError: (error: any) => {
      toast({
        title: "Failed to restore email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteForever = () => {
    if (confirm("Permanently delete this email? This action cannot be undone.")) {
      deleteForeverMutation.mutate();
    }
  };

  const handleRestore = () => {
    restoreEmailMutation.mutate();
  };

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select an email to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold">{email.email_subject || "(No subject)"}</h2>
            {isTrashed && (
              <Badge variant="destructive" className="text-xs">
                Trashed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            {email.is_inbox ? (
              <>
                <span>From: {email.from_email}</span>
                <span>•</span>
                <span>To: {email.to_email}</span>
              </>
            ) : (
              <>
                <span>To: {email.to_email}</span>
                <span>•</span>
                <span>From: {email.from_email}</span>
              </>
            )}
            <span>•</span>
            <span>{email.is_inbox ? "Received" : "Sent"} at {new Date(email.created_at).toLocaleString()}</span>
          </div>
          
          {/* Tracking Pills in Header */}
          <div className="mb-2">
            <EmailTrackingPills
              events={events}
              sentAt={email.created_at}
              onClick={() => setTimelinePanelOpen(true)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isTrashed ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestore}
                disabled={restoreEmailMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteForever}
                disabled={deleteForeverMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Forever
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={onReply}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline" size="sm" onClick={onResend}>
                <Copy className="h-4 w-4 mr-2" />
                Resend
              </Button>
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              {email.template_name && (
                <Button variant="outline" size="sm" onClick={onViewTemplate}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Template
                </Button>
              )}
              {email.campaign_name && (
                <Button variant="outline" size="sm" onClick={onViewCampaign}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Campaign
                </Button>
              )}
            </>
          )}
        </div>

        {/* Message Content */}
        {email.html_content && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Message</h3>
            <div 
              className="border rounded-md p-4 bg-background"
              dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.html_content) }}
            />
          </Card>
        )}


        {/* Device & Location Info */}
        {(email.device_type || email.user_agent || email.ip_address) && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Device & Location</h3>
            <div className="space-y-2 text-sm">
              {email.device_type && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Device:</span>
                  <Badge variant="secondary">{email.device_type}</Badge>
                </div>
              )}
              {email.user_agent && (
                <div>
                  <span className="text-muted-foreground block mb-1">Browser:</span>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {email.user_agent}
                  </code>
                </div>
              )}
              {email.ip_address && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{email.ip_address}</code>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Replies Panel */}
        {email.event_type !== "draft" && (
          <EmailRepliesPanel
            emailEventId={email.id}
            userEmail={email.from_email}
          />
        )}

      </div>

      {/* Engagement Timeline Panel */}
      <EngagementTimelinePanel
        open={timelinePanelOpen}
        onClose={() => setTimelinePanelOpen(false)}
        email={email ? {
          to_email: email.to_email,
          email_subject: email.email_subject,
          created_at: email.created_at,
        } : null}
        events={events}
      />
    </div>
  );
}