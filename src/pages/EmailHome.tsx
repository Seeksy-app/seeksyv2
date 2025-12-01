import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { EmailFolderList } from "@/components/email/client/EmailFolderList";
import { EmailList } from "@/components/email/client/EmailList";
import { EmailViewer } from "@/components/email/client/EmailViewer";
import { EmailComposer } from "@/components/email/client/EmailComposer";
import { useToast } from "@/hooks/use-toast";

export default function EmailHome() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editDraftId, setEditDraftId] = useState<string | null>(null);

  // Keyboard shortcut: C to compose
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setComposerOpen(true);
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);
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
      
      // Drafts are stored in email_campaigns table
      if (selectedFolder === "drafts") {
        const { data } = await supabase
          .from("email_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_draft", true)
          .order("updated_at", { ascending: false });
        
        // Transform drafts to match email event format
        return (data || []).map(draft => ({
          id: draft.id,
          to_email: (draft.draft_data as any)?.to || "Draft",
          email_subject: draft.subject || "Untitled Draft",
          event_type: "draft",
          created_at: draft.created_at,
          from_email: "",
          campaign_name: draft.campaign_name,
        }));
      }
      
      let query = supabase
        .from("email_events")
        .select("*, email_campaigns(campaign_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Apply folder filter
      if (selectedFolder === "sent") {
        query = query.eq("event_type", "email.sent");
      } else if (selectedFolder === "bounced") {
        query = query.eq("event_type", "email.bounced");
      } else if (selectedFolder === "unsubscribed") {
        query = query.eq("event_type", "email.unsubscribed");
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
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "email.sent"),
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "email.bounced"),
        supabase.from("email_events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "email.unsubscribed"),
        supabase.from("email_campaigns").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_draft", true),
      ]);

      return {
        inbox: queries[0].count || 0,
        sent: queries[1].count || 0,
        scheduled: 0, // TODO: Implement
        drafts: queries[4].count || 0,
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
            onEmailSelect={(id) => {
              // If it's a draft, open composer instead of viewer
              const email = emails.find((e: any) => e.id === id);
              if (email?.event_type === "draft") {
                setEditDraftId(id);
                setComposerOpen(true);
              } else {
                setSelectedEmailId(id);
              }
            }}
            filter={filter}
            onFilterChange={setFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onCompose={() => setComposerOpen(true)}
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

      {/* Email Composer */}
      <EmailComposer
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditDraftId(null);
        }}
        draftId={editDraftId}
      />
    </div>
  );
}
