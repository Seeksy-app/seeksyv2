import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { EmailFolderList } from "@/components/email/client/EmailFolderList";
import { EmailList } from "@/components/email/client/EmailList";
import { EmailViewer } from "@/components/email/client/EmailViewer";
import { useToast } from "@/hooks/use-toast";

export default function EmailHome() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch all emails for the selected folder
  const { data: emails = [] } = useQuery({
    queryKey: ["email-events", user?.id, selectedFolder, filter],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("email_events")
        .select("*, email_campaigns(campaign_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Apply folder filter
      if (selectedFolder === "sent") {
        query = query.eq("event_type", "sent");
      } else if (selectedFolder === "bounced") {
        query = query.eq("event_type", "bounced");
      } else if (selectedFolder === "unsubscribed") {
        query = query.eq("event_type", "unsubscribed");
      }

      // Apply status filter
      if (filter !== "all") {
        query = query.eq("event_type", filter);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch folder counts
  const { data: counts } = useQuery({
    queryKey: ["email-counts", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const queries = await Promise.all([
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "sent"),
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "bounced"),
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "unsubscribed"),
      ]);

      return {
        inbox: queries[0].count || 0,
        sent: queries[1].count || 0,
        scheduled: 0, // TODO: Implement
        drafts: 0, // TODO: Implement
        archived: 0, // TODO: Implement
        bounced: queries[2].count || 0,
        suppressed: 0, // TODO: Implement
        automated: 0, // TODO: Implement
        unsubscribed: queries[3].count || 0,
      };
    },
    enabled: !!user,
  });

  // Fetch selected email details
  const { data: selectedEmail } = useQuery({
    queryKey: ["email-detail", selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      
      const { data } = await supabase
        .from("email_events")
        .select("*, email_campaigns(campaign_name, html_content)")
        .eq("id", selectedEmailId)
        .single();
      
      return data;
    },
    enabled: !!selectedEmailId,
  });

  // Fetch all events for selected email
  const { data: emailEvents = [] } = useQuery({
    queryKey: ["email-timeline", selectedEmail?.resend_email_id],
    queryFn: async () => {
      if (!selectedEmail?.resend_email_id) return [];
      
      const { data } = await supabase
        .from("email_events")
        .select("*")
        .eq("resend_email_id", selectedEmail.resend_email_id)
        .order("occurred_at", { ascending: true });
      
      return data || [];
    },
    enabled: !!selectedEmail?.resend_email_id,
  });

  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Folders */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <EmailFolderList
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            counts={counts || {
              inbox: 0,
              sent: 0,
              scheduled: 0,
              drafts: 0,
              archived: 0,
              bounced: 0,
              suppressed: 0,
              automated: 0,
              unsubscribed: 0,
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Email List */}
        <ResizablePanel defaultSize={35} minSize={30}>
          <EmailList
            emails={emails.map((e: any) => ({
              ...e,
              campaign_name: e.email_campaigns?.campaign_name,
            }))}
            selectedEmailId={selectedEmailId}
            onEmailSelect={setSelectedEmailId}
            filter={filter}
            onFilterChange={setFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Email Viewer */}
        <ResizablePanel defaultSize={45} minSize={35}>
          <EmailViewer
            email={
              selectedEmail
                ? {
                    ...selectedEmail,
                    campaign_name: selectedEmail.email_campaigns?.campaign_name,
                    html_content: selectedEmail.email_campaigns?.html_content,
                  }
                : null
            }
            events={emailEvents}
            onResend={() => {
              toast({
                title: "Resend email",
                description: "This feature will be implemented soon.",
              });
            }}
            onDuplicate={() => {
              toast({
                title: "Duplicate email",
                description: "This feature will be implemented soon.",
              });
            }}
            onViewTemplate={() => {
              toast({
                title: "View template",
                description: "This feature will be implemented soon.",
              });
            }}
            onViewCampaign={() => {
              if (selectedEmail?.campaign_id) {
                window.location.href = `/email-campaigns/${selectedEmail.campaign_id}`;
              }
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
