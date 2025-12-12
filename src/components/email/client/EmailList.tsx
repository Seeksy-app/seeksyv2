import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Circle, Mail, Trash2 } from "lucide-react";
import { EmailTrackingPills } from "./EmailTrackingPills";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  deleted_at?: string | null;
  original_event_type?: string | null;
  is_inbox?: boolean;
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

const getStatusLabel = (eventType: string, deletedAt?: string | null) => {
  if (deletedAt) return "Trashed";
  const normalized = eventType.replace("email.", "");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

interface EmailListActions {
  onCompose: () => void;
  onOpenTimeline?: () => void;
  emailEvents?: any[];
}

const DONT_SHOW_DELETE_CONFIRM_KEY = "seeksy_email_delete_dont_show";

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
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DONT_SHOW_DELETE_CONFIRM_KEY);
    if (stored === "true") {
      setSkipConfirmation(true);
    }
  }, []);

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      for (const emailId of emailIds) {
        const email = emails.find((e: any) => e.id === emailId);
        
        if (email?.event_type === "draft") {
          // Drafts are permanently deleted
          const { error } = await supabase
            .from("email_campaigns")
            .delete()
            .eq("id", emailId);
          if (error) throw error;
        } else if (email?.is_inbox || email?.event_type === "received") {
          // Inbox messages use inbox_messages table - soft delete
          const { error } = await supabase
            .from("inbox_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", emailId);
          if (error) throw error;
        } else {
          // Sent/other emails use email_events table - soft delete
          const { error } = await supabase
            .from("email_events")
            .update({ 
              deleted_at: new Date().toISOString(),
              original_event_type: email?.event_type 
            })
            .eq("id", emailId);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, emailIds) => {
      toast.success(
        emailIds.length === 1 ? "Email moved to trash" : `${emailIds.length} emails moved to trash`,
        { duration: 1500 }
      );
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast.error("Failed to delete email", {
        description: error.message,
      });
    },
  });

  const handleDeleteRequest = (emailIds: string[]) => {
    if (skipConfirmation) {
      deleteEmailMutation.mutate(emailIds);
    } else {
      setPendingDeleteIds(emailIds);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_DELETE_CONFIRM_KEY, "true");
      setSkipConfirmation(true);
    }
    deleteEmailMutation.mutate(pendingDeleteIds);
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
    setDontShowAgain(false);
  };

  const handleSingleDelete = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    handleDeleteRequest([emailId]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      handleDeleteRequest(Array.from(selectedIds));
    }
  };

  const toggleSelection = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  };

  return (
    <>
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={emails.length > 0 && selectedIds.size === emails.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all emails"
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${emails.length} email${emails.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleteEmailMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedIds.size})
              </Button>
            )}
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
                <div
                  key={email.id}
                  onClick={() => onEmailSelect(email.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors group cursor-pointer",
                    selectedEmailId === email.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(email.id)}
                        onCheckedChange={() => {}}
                        onClick={(e) => toggleSelection(e, email.id)}
                        aria-label={`Select email from ${email.to_email}`}
                      />
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>
                          {email.to_email?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
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
                            onClick={(e) => handleSingleDelete(e, email.id)}
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
                          variant={email.deleted_at ? "destructive" : "secondary"} 
                          className="text-xs"
                        >
                          {getStatusLabel(email.event_type, email.deleted_at)}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteIds.length === 1 
                ? "This email will be moved to trash. It will still be in your Gmail."
                : `${pendingDeleteIds.length} emails will be moved to trash. They will still be in your Gmail.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Don't show this again
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
