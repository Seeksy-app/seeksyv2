import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Save, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactAutocomplete } from "../ContactAutocomplete";

interface FloatingEmailComposerProps {
  open: boolean;
  onClose: () => void;
  draftId?: string | null;
  initialRecipients?: string;
}

export function FloatingEmailComposer({ open, onClose, draftId, initialRecipients }: FloatingEmailComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch connected email accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      return data || [];
    },
  });

  // Set default account
  useEffect(() => {
    if (accounts.length > 0 && !fromAccountId) {
      const defaultAccount = accounts.find(acc => acc.is_default) || accounts[0];
      setFromAccountId(defaultAccount.id);
    }
  }, [accounts, fromAccountId]);

  // Set initial recipients when composer opens
  useEffect(() => {
    if (open && initialRecipients && !to) {
      setTo(initialRecipients);
    }
  }, [open, initialRecipients, to]);

  // Auto-save draft every 3 seconds
  useEffect(() => {
    if (!open || (!to && !subject && !body)) return;

    const timer = setTimeout(() => {
      if (to || subject || body) {
        autoSaveDraftMutation.mutate();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [to, subject, body, open]);

  // Load draft if editing
  useEffect(() => {
    if (draftId && open) {
      const loadDraft = async () => {
        const { data: draft } = await supabase
          .from("email_campaigns")
          .select("*")
          .eq("id", draftId)
          .single();
        
        if (draft && draft.draft_data) {
          const draftData = draft.draft_data as any;
          setFromAccountId(draftData.fromAccountId || accounts[0]?.id || "");
          setTo(draftData.to || "");
          setCc(draftData.cc || "");
          setBcc(draftData.bcc || "");
          setSubject(draft.subject || "");
          setBody(draft.html_content || "");
          if (draftData.cc) setShowCc(true);
          if (draftData.bcc) setShowBcc(true);
        }
      };
      loadDraft();
    }
  }, [draftId, open, accounts]);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: to.split(",").map(e => e.trim()),
          cc: cc ? cc.split(",").map(e => e.trim()) : undefined,
          bcc: bcc ? bcc.split(",").map(e => e.trim()) : undefined,
          subject,
          htmlContent: body,
          fromAccountId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "✅ Email sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-save mutation (silent, doesn't close composer)
  const autoSaveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const draftData = { fromAccountId, to, cc, bcc };

      if (draftId) {
        const { error } = await supabase
          .from("email_campaigns")
          .update({
            subject,
            html_content: body,
            draft_data: draftData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_campaigns")
          .insert({
            campaign_name: subject || "Untitled Draft",
            subject,
            html_content: body,
            draft_data: draftData,
            is_draft: true,
            draft_status: "draft",
            user_id: user.id,
            from_email_account_id: fromAccountId || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Silent save - no toast, no close
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
    },
    onError: () => {
      // Silent failure for auto-save
    },
  });

  // Manual save mutation (shows toast, closes composer)
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const draftData = { fromAccountId, to, cc, bcc };

      if (draftId) {
        const { error } = await supabase
          .from("email_campaigns")
          .update({
            subject,
            html_content: body,
            draft_data: draftData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_campaigns")
          .insert({
            campaign_name: subject || "Untitled Draft",
            subject,
            html_content: body,
            draft_data: draftData,
            is_draft: true,
            draft_status: "draft",
            user_id: user.id,
            from_email_account_id: fromAccountId || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "💾 Draft saved" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setShowCc(false);
    setShowBcc(false);
  };

  const handleClose = () => {
    if (to || subject || body) {
      if (confirm("Save draft before closing?")) {
        saveDraftMutation.mutate();
      } else {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  if (!open) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="shadow-2xl"
          size="lg"
        >
          ✉️ New Email - {to || "No recipient"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border rounded-xl shadow-2xl flex flex-col transition-all duration-200",
        isFullscreen
          ? "inset-0 m-4"
          : "bottom-4 right-4 w-[680px] h-[720px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">New Email</h3>
          {to && (
            <p className="text-xs text-muted-foreground">To: {to}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* From */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-sm text-muted-foreground">From</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select email account" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-[60]">
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.email_address}</span>
                    {account.is_default && (
                      <span className="text-xs text-muted-foreground ml-2">(default)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-sm text-muted-foreground">To</Label>
          <ContactAutocomplete
            value={to}
            onChange={setTo}
            placeholder="Recipients (comma-separated)"
            className="flex-1"
          />
          <div className="flex gap-1">
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs"
              >
                Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                className="text-xs"
              >
                Bcc
              </Button>
            )}
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-sm text-muted-foreground">Cc</Label>
            <Input
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="flex-1"
            />
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-sm text-muted-foreground">Bcc</Label>
            <Input
              type="email"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="flex-1"
            />
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-sm text-muted-foreground">Subject</Label>
          <Input
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Body */}
        <Textarea
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[320px] resize-none"
        />
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between bg-muted/30">
        <div className="flex gap-2">
          <Button
            onClick={() => sendEmailMutation.mutate()}
            disabled={!to || !subject || !body || sendEmailMutation.isPending}
            size="sm"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Send
          </Button>
          <Button
            variant="outline"
            onClick={() => saveDraftMutation.mutate()}
            disabled={saveDraftMutation.isPending}
            size="sm"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Draft
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Use Scribe ✨
        </Button>
      </div>
    </div>
  );
}
