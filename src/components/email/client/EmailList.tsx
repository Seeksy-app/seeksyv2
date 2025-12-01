import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Circle, Mail, Trash2 } from "lucide-react";
import { EmailTrackingPills } from "./EmailTrackingPills";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Email {
  id: string;
  to_email: string;
  email_subject: string;
  event_type: string;
  created_at: string;
  campaign_name?: string;
  from_email?: string;
  reply_count?: number;
  opened?: boolean;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (emailId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const getStatusColor = (eventType: string) => {
  const normalized = eventType.replace("email.", "");
  
  switch (normalized) {
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
    case "draft":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
};

const getStatusLabel = (eventType: string) => {
  const normalized = eventType.replace("email.", "");
  if (normalized === "trashed") return "Trashed";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

interface EmailListActions {
  onCompose: () => void;
  onOpenTimeline?: () => void;
  emailEvents?: any[];
}

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  onCompose,
  onOpenTimeline,
  emailEvents = [],
}: EmailListProps & EmailListActions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const email = emails.find((e: any) => e.id === emailId);
      
      if (email?.event_type === "draft") {
        // Delete from email_campaigns
        const { error } = await supabase
          .from("email_campaigns")
          .delete()
          .eq("id", emailId);
        if (error) throw error;
      } else {
        // Move to trash by updating status
        const { error } = await supabase
          .from("email_events")
          .update({ event_type: "email.trashed" })
          .eq("id", emailId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Email moved to trash" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    if (confirm("Move this email to trash?")) {
      deleteEmailMutation.mutate(emailId);
    }
  };

  return (
    <div className="h-full border-r flex flex-col">
      
      {/* Filters and Sorting */}
      <div className="p-4 border-b bg-background">
        <div className="flex gap-2 mb-3">
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {emails.length} email{emails.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No emails found
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => onEmailSelect(email.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors group",
                  selectedEmailId === email.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {email.to_email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {email.opened === false && (
                          <Circle className="h-2 w-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">
                          {email.to_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, email.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                        <Circle
                          className={cn("h-2 w-2 fill-current flex-shrink-0", getStatusColor(email.event_type))}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-foreground mb-1 truncate">
                      {email.email_subject || "(No subject)"}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={email.event_type === "email.trashed" ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {getStatusLabel(email.event_type)}
                      </Badge>
                      {email.campaign_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          {email.campaign_name}
                        </span>
                      )}
                      {email.reply_count !== undefined && email.reply_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          {email.reply_count} {email.reply_count === 1 ? 'reply' : 'replies'}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Tracking Pills */}
                    {email.event_type !== "draft" && (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <EmailTrackingPills
                          events={emailEvents.filter((e: any) => e.resend_email_id === (email as any).resend_email_id)}
                          sentAt={email.created_at}
                          onClick={() => onOpenTimeline?.()}
                        />
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(email.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}