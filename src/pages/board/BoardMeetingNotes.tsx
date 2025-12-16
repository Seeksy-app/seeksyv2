import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Calendar, ChevronDown, ChevronUp, Sparkles, Download, Lock, Play, Pause, RotateCcw, Clock, MessageSquare, Send, Trash2, LogOut, Video, Users, ArrowRight, RefreshCw, PanelLeftClose, PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BoardPageHeader } from "@/components/board/BoardPageHeader";
import { toast } from "sonner";
import { DecisionTable } from "@/components/board/DecisionTable";
import { DecisionMatrixTable } from "@/components/board/DecisionMatrixTable";
import { ExitGuardrailModal } from "@/components/board/ExitGuardrailModal";
import { useBoardDecisions } from "@/hooks/useBoardDecisions";
import { Checkbox } from "@/components/ui/checkbox";
import BoardMeetingVideo from "@/components/board/BoardMeetingVideo";
import { useBoardMeetingVideo } from "@/hooks/useBoardMeetingVideo";
import { useBoardMeetingHost } from "@/hooks/useBoardMeetingHost";
import { useCarryForwardMeeting } from "@/hooks/useCarryForwardMeeting";
import { AIMeetingNotes } from "@/components/board/AIMeetingNotes";
import { MeetingInviteManager } from "@/components/board/MeetingInviteManager";
import { HostMeetingTabs } from "@/components/board/HostMeetingTabs";
import { WaitingForHostScreen } from "@/components/board/WaitingForHostScreen";
import { useMeetingFocusMode } from "@/contexts/MeetingFocusModeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DecisionRow {
  Topic: string;
  Option: string;
  Upside: string;
  Risk: string;
  Decision: string;
}

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

interface MeetingNote {
  id: string;
  title: string;
  meeting_date: string;
  start_time: string | null;
  duration_minutes: number;
  agenda_items: AgendaItem[];
  memo: {
    purpose?: string;
    current_state?: string[];
    key_questions?: string[];
    objective?: string;
  } | null;
  decision_table: DecisionRow[];
  decisions_summary: string | null;
  decisions_summary_generated_at: string | null;
  decisions_summary_locked: boolean;
  member_questions: MemberQuestion[];
  status: string;
  created_at: string;
  // Host gate fields
  host_has_started: boolean;
  host_user_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  // AI Notes fields
  audio_transcript: string | null;
  ai_summary_draft: string | null;
  ai_decisions_draft: any[] | null;
  ai_action_items_draft: any[] | null;
  ai_agenda_recap_draft: any[] | null;
  ai_risks_draft: string | null;
  ai_next_meeting_prep_draft: string | null;
  ai_notes_status: string | null;
  ai_notes_generated_at: string | null;
}

interface CreateMeetingForm {
  title: string;
  meeting_date: string;
  start_time: string;
  duration_minutes: number;
  agenda_notes: string;
}

export default function BoardMeetingNotes() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { activeTenantId, isLoading: tenantLoading } = useTenant();
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [memoOpen, setMemoOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [isGenerateAgendaModalOpen, setIsGenerateAgendaModalOpen] = useState(false);
  const [generateAgendaNotes, setGenerateAgendaNotes] = useState("");
  const [showExitGuardrail, setShowExitGuardrail] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<'exit' | 'endCall' | null>(null);
  
  // Derive currentUserId from auth hook instead of separate fetch
  const currentUserId = user?.id || null;
  
  // Meeting focus mode for auto-collapsing navigation
  const { setFocusMode, showNavToggle, toggleNav, navCollapsed } = useMeetingFocusMode();
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Video meeting hook
  const {
    isConnected: isVideoConnected,
    isConnecting: isVideoConnecting,
    isMuted,
    isVideoOff,
    isGeneratingNotes,
    isCapturingAudio,
    participants,
    localVideoRef,
    audioStream,
    hasActiveRoom,
    startVideoMeeting,
    joinVideoMeeting,
    toggleMute,
    toggleVideo,
    startAudioCapture,
    stopAudioCapture,
    stopAIAndGenerateNotes,
    endCall,
  } = useBoardMeetingVideo(selectedNote?.id || '');

  // Host management hook
  const {
    isHost,
    hostHasStarted,
    isMediaPlaying,
    aiEnabled,
    isLoadingHost,
    startMeetingAsHost,
    endMeetingAsHost,
    handleMediaPlayStateChange,
    toggleAI,
  } = useBoardMeetingHost({
    meetingId: selectedNote?.id,
    onAudioCaptureStart: startAudioCapture,
    onAudioCaptureStop: stopAudioCapture,
  });

  // Carry forward hook
  const { carryForward, isCarryingForward } = useCarryForwardMeeting();

  // Board decisions hook for exit guardrail
  const {
    unresolvedDecisions,
    hasUnresolvedDecisions,
    deferAllUnresolved,
  } = useBoardDecisions(selectedNote?.id);
  
  const [createForm, setCreateForm] = useState<CreateMeetingForm>({
    title: "",
    meeting_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "10:00",
    duration_minutes: 45,
    agenda_notes: "",
  });

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && selectedNote) {
      const totalSeconds = (selectedNote.duration_minutes || 45) * 60;
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev >= totalSeconds) {
            setTimerRunning(false);
            toast.warning("Meeting time is up!");
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, selectedNote]);

  // Auto-collapse navigation when meeting becomes active
  useEffect(() => {
    if (selectedNote?.status === 'active') {
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }
  }, [selectedNote?.status, setFocusMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (!selectedNote) return "00:00";
    const totalSeconds = (selectedNote.duration_minutes || 45) * 60;
    const remaining = Math.max(0, totalSeconds - timerSeconds);
    return formatTime(remaining);
  };

  // Helper to format date without timezone shift (YYYY-MM-DD -> local date)
  const formatMeetingDate = (dateStr: string, formatStr: string = "MMM d, yyyy") => {
    // Add T12:00:00 to treat as noon local time (avoids timezone issues)
    return format(new Date(dateStr + "T12:00:00"), formatStr);
  };

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ["board-meeting-notes", activeTenantId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("board_meeting_notes")
        .select("*");
      
      // Filter by tenant if available (board_meeting_notes may not have tenant_id column yet)
      // Uncomment once tenant_id column is added to board_meeting_notes:
      // if (activeTenantId) {
      //   query = query.eq("tenant_id", activeTenantId);
      // }
      
      const { data, error } = await query
        .order("meeting_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Transform legacy string[] agenda_items to AgendaItem[]
      return (data || []).map((note: any) => ({
        ...note,
        duration_minutes: note.duration_minutes || 45,
        host_has_started: note.host_has_started || false,
        host_user_id: note.host_user_id || null,
        started_at: note.started_at || null,
        ended_at: note.ended_at || null,
        agenda_items: Array.isArray(note.agenda_items) 
          ? note.agenda_items.map((item: any) => 
              typeof item === 'string' ? { text: item, checked: false } : item
            )
          : [],
        member_questions: note.member_questions || [],
        ai_decisions_draft: Array.isArray(note.ai_decisions_draft) ? note.ai_decisions_draft : [],
        ai_action_items_draft: Array.isArray(note.ai_action_items_draft) ? note.ai_action_items_draft : [],
        ai_agenda_recap_draft: Array.isArray(note.ai_agenda_recap_draft) ? note.ai_agenda_recap_draft : [],
      })) as MeetingNote[];
    },
    enabled: !!user?.id && !!activeTenantId && !authLoading && !tenantLoading,
  });

  // Refetch on route focus/navigation
  useEffect(() => {
    if (user && activeTenantId && !authLoading && !tenantLoading) {
      refetch();
    }
  }, [location.pathname, user, activeTenantId, authLoading, tenantLoading]);

  // Update selected note when notes change
  useEffect(() => {
    if (selectedNote) {
      const updated = notes.find(n => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [notes]);

  const createNoteMutation = useMutation({
    mutationFn: async (formData: CreateMeetingForm) => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        throw new Error("You must be logged in to create a meeting");
      }
      
      // Create meeting with user's agenda notes (will be processed by AI)
      const newNote = {
        title: formData.title.trim(),
        meeting_date: formData.meeting_date,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        agenda_items: [],
        memo: null,
        decision_table: [],
        decisions_summary: null,
        decisions_summary_generated_at: null,
        decisions_summary_locked: false,
        member_questions: [],
        status: "upcoming",
        created_by: userData.user.id,
        host_user_id: userData.user.id, // Required for host permissions
      };

      console.log("[CREATE MEETING] Payload:", newNote);
      console.log("[CREATE MEETING] User ID:", userData.user.id);

      const { data, error } = await supabase
        .from("board_meeting_notes")
        .insert(newNote)
        .select()
        .single();
      
      if (error) {
        console.error("[CREATE MEETING] Error:", error);
        console.error("[CREATE MEETING] Error code:", error.code);
        console.error("[CREATE MEETING] Error details:", error.details);
        throw new Error(error.message || "Failed to insert meeting");
      }
      
      console.log("[CREATE MEETING] Success:", data);
      return { meeting: data, agendaNotes: formData.agenda_notes };
    },
    onSuccess: async ({ meeting, agendaNotes }) => {
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      const typedMeeting = {
        ...meeting,
        duration_minutes: (meeting as any).duration_minutes || 45,
        agenda_items: [],
        member_questions: [],
      } as unknown as MeetingNote;
      setSelectedNote(typedMeeting);
      
      // Generate AI content - keep modal open during generation
      if (agendaNotes.trim()) {
        await generateAIContent(meeting.id, meeting.title, agendaNotes);
      }
      
      setIsCreateModalOpen(false);
      setCreateForm({
        title: "",
        meeting_date: format(new Date(), "yyyy-MM-dd"),
        start_time: "10:00",
        duration_minutes: 45,
        agenda_notes: "",
      });
      toast.success("Meeting created with AI-generated content");
    },
    onError: (error: Error) => {
      console.error("[CREATE MEETING] Mutation error:", error);
      toast.error(error.message || "Failed to create meeting");
    },
  });

  const generateAIContent = async (meetingId: string, title: string, agendaNotes: string) => {
    setIsGenerating(true);
    try {
      console.log("Calling generate-board-meeting-content with:", { title, agendaNotes: agendaNotes.substring(0, 100) + "..." });
      
      const { data, error } = await supabase.functions.invoke('generate-board-meeting-content', {
        body: { title, agendaNotes }
      });
      
      console.log("Edge function response:", { data, error });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.agenda || !Array.isArray(data.agenda)) {
        console.error("Invalid AI response structure:", data);
        throw new Error("AI returned invalid data structure");
      }
      
      // Update meeting with AI-generated content
      const updatePayload = {
        agenda_items: data.agenda.map((item: string) => ({ text: item, checked: false })),
        memo: data.memo || null,
        decision_table: data.decisions || [],
      };
      
      console.log("Updating meeting with payload:", JSON.stringify(updatePayload));
      
      const { error: updateError } = await supabase
        .from("board_meeting_notes")
        .update(updatePayload as any)
        .eq("id", meetingId);
      
      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }
      
      console.log("Update succeeded, now refetching meeting:", meetingId);
      
      // Explicitly refetch the meeting to get the updated data
      const { data: freshMeeting, error: fetchError } = await supabase
        .from("board_meeting_notes")
        .select("*")
        .eq("id", meetingId)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Refetch error:", fetchError);
        throw fetchError;
      }
      
      console.log("Refetched meeting data:", freshMeeting ? { 
        id: freshMeeting.id, 
        agenda_items_count: (freshMeeting.agenda_items as any[])?.length || 0 
      } : "null");
      
      // Update selectedNote with fresh data from DB
      if (freshMeeting) {
        const typedMeeting: MeetingNote = {
          ...freshMeeting,
          agenda_items: (freshMeeting.agenda_items as unknown as AgendaItem[]) || [],
          member_questions: (freshMeeting.member_questions as unknown as MemberQuestion[]) || [],
          memo: freshMeeting.memo as MeetingNote['memo'] || null,
          decision_table: (freshMeeting.decision_table as unknown as DecisionRow[]) || [],
          ai_decisions_draft: Array.isArray(freshMeeting.ai_decisions_draft) ? freshMeeting.ai_decisions_draft : [],
          ai_action_items_draft: Array.isArray(freshMeeting.ai_action_items_draft) ? freshMeeting.ai_action_items_draft : [],
          ai_agenda_recap_draft: Array.isArray(freshMeeting.ai_agenda_recap_draft) ? freshMeeting.ai_agenda_recap_draft : [],
        };
        console.log("Setting selectedNote with agenda_items:", typedMeeting.agenda_items.length);
        setSelectedNote(typedMeeting);
      }
      
      // Refresh the meetings list
      await queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      toast.success("AI generated agenda, memo, and decision matrix");
    } catch (error) {
      console.error("AI generation failed:", error);
      toast.error("AI generation failed - you can add content manually");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateMeeting = () => {
    if (!createForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!createForm.meeting_date) {
      toast.error("Meeting date is required");
      return;
    }
    if (!createForm.agenda_notes.trim()) {
      toast.error("Please add agenda notes so AI can generate the meeting content");
      return;
    }
    createNoteMutation.mutate(createForm);
  };

  const toggleAgendaItem = async (noteId: string, itemIndex: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const updatedItems = note.agenda_items.map((item, i) => 
      i === itemIndex ? { ...item, checked: !item.checked } : item
    );
    
    // Optimistic update - immediately update local state
    queryClient.setQueryData(["board-meeting-notes", activeTenantId, user?.id], (oldNotes: MeetingNote[] | undefined) => 
      oldNotes?.map(n => n.id === noteId ? { ...n, agenda_items: updatedItems } : n)
    );
    
    const { error } = await supabase
      .from("board_meeting_notes")
      .update({ agenda_items: updatedItems as unknown as any })
      .eq("id", noteId);
    
    if (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      toast.error("Failed to update agenda item");
    }
  };

  const addManualAgendaItem = async () => {
    if (!selectedNote || !newAgendaItem.trim()) {
      toast.error("Please enter an agenda item");
      return;
    }
    
    const updatedItems = [
      ...selectedNote.agenda_items,
      { text: newAgendaItem.trim(), checked: false }
    ];
    
    const { error } = await supabase
      .from("board_meeting_notes")
      .update({ agenda_items: updatedItems as unknown as any })
      .eq("id", selectedNote.id);
    
    if (error) {
      toast.error(`Failed to add agenda item: ${error.message}`);
      return;
    }
    
    setNewAgendaItem("");
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    toast.success("Agenda item added");
  };

  const regenerateAgendaFromNotes = async () => {
    if (!selectedNote || !generateAgendaNotes.trim()) {
      toast.error("Please enter agenda notes");
      return;
    }
    
    setIsGenerating(true);
    setIsGenerateAgendaModalOpen(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-board-meeting-content', {
        body: { title: selectedNote.title, agendaNotes: generateAgendaNotes }
      });
      
      if (error) throw error;
      
      const { error: updateError } = await supabase
        .from("board_meeting_notes")
        .update({
          agenda_items: data.agenda.map((item: string) => ({ text: item, checked: false })) as unknown as any,
          memo: data.memo,
          decision_table: data.decisions as unknown as any,
        })
        .eq("id", selectedNote.id);
      
      if (updateError) throw updateError;
      
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      setGenerateAgendaNotes("");
      toast.success("AI generated agenda, memo, and decision matrix");
    } catch (error) {
      console.error("AI generation failed:", error);
      toast.error("AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const addMemberQuestion = async () => {
    if (!selectedNote || !newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const newQ: MemberQuestion = {
      id: crypto.randomUUID(),
      author: userData.user?.email?.split('@')[0] || "Member",
      text: newQuestion.trim(),
      created_at: new Date().toISOString(),
    };
    
    const updatedQuestions = [...(selectedNote.member_questions || []), newQ];
    
    const { error } = await supabase
      .from("board_meeting_notes")
      .update({ member_questions: updatedQuestions as unknown as any })
      .eq("id", selectedNote.id);
    
    if (error) {
      console.error("Failed to save question:", error);
      toast.error(`Failed to save question: ${error.message}`);
      return;
    }
    
    setNewQuestion("");
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    toast.success("Question saved");
  };

  const updateDecisionMutation = useMutation({
    mutationFn: async ({ noteId, decisionTable }: { noteId: string; decisionTable: DecisionRow[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("board_meeting_notes")
        .update({ 
          decision_table: decisionTable as unknown as any,
          updated_by: userData.user?.id
        })
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const note = notes.find(n => n.id === noteId);
      if (!note) throw new Error("Note not found");

      const decisionsWithContent = note.decision_table.filter(row => row.Decision && row.Decision.trim() !== "");
      if (decisionsWithContent.length === 0) {
        throw new Error("No decisions have been made yet");
      }

      const grouped: Record<string, string[]> = {};
      decisionsWithContent.forEach(row => {
        if (!grouped[row.Topic]) grouped[row.Topic] = [];
        grouped[row.Topic].push(row.Decision);
      });

      let summary = "**Decisions Confirmed**\n\n";
      Object.entries(grouped).forEach(([topic, decisions]) => {
        decisions.forEach(decision => {
          summary += `- **${topic}**: ${decision}\n`;
        });
      });

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("board_meeting_notes")
        .update({ 
          decisions_summary: summary,
          decisions_summary_generated_at: new Date().toISOString(),
          decisions_summary_locked: true,
          status: "completed",
          updated_by: userData.user?.id
        })
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      toast.success("Meeting completed and decisions summary generated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate summary");
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const note = notes.find(n => n.id === noteId);
      if (!note) throw new Error("Meeting not found");
      if (note.status === "completed") {
        throw new Error("Completed meetings cannot be deleted");
      }
      
      const { error } = await supabase
        .from("board_meeting_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
      if (selectedNote) setSelectedNote(null);
      toast.success("Meeting deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete meeting");
    },
  });

  const handleDeleteMeeting = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === noteId);
    if (note?.status === "completed") {
      toast.error("Completed meetings are locked and cannot be deleted");
      return;
    }
    if (confirm("Delete this meeting? This cannot be undone.")) {
      deleteMeetingMutation.mutate(noteId);
    }
  };

  const handleDecisionChange = (noteId: string, rowIndex: number, value: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedTable = [...note.decision_table];
    updatedTable[rowIndex] = { ...updatedTable[rowIndex], Decision: value };
    
    updateDecisionMutation.mutate({ noteId, decisionTable: updatedTable });
    
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, decision_table: updatedTable });
    }
  };

  const startMeeting = async () => {
    if (!selectedNote) return;
    
    // Use host hook to start meeting properly
    const started = await startMeetingAsHost();
    if (!started) return;
    
    setTimerSeconds(0);
    setTimerRunning(true);
    
    // Enable AI and start audio capture for AI notes when timer starts
    toggleAI(true);
    if (isVideoConnected) {
      startAudioCapture();
    }
    
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
  };

  // Handle adding question from WaitingForHostScreen
  const handleAddQuestionFromWaiting = async (questionText: string) => {
    if (!selectedNote) return;
    
    const { data: userData } = await supabase.auth.getUser();
    const newQ: MemberQuestion = {
      id: crypto.randomUUID(),
      author: userData.user?.email?.split('@')[0] || "Member",
      text: questionText,
      created_at: new Date().toISOString(),
    };
    
    const updatedQuestions = [...(selectedNote.member_questions || []), newQ];
    
    const { error } = await supabase
      .from("board_meeting_notes")
      .update({ member_questions: updatedQuestions as unknown as any })
      .eq("id", selectedNote.id);
    
    if (error) {
      console.error("Failed to save question:", error);
      toast.error(`Failed to save question: ${error.message}`);
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    toast.success("Question added");
  };

  // Handle adding agenda item from WaitingForHostScreen
  const handleAddAgendaItemFromWaiting = async (itemText: string) => {
    if (!selectedNote) return;
    
    const { data: userData } = await supabase.auth.getUser();
    const newItem: AgendaItem = {
      text: `[Suggested by ${userData.user?.email?.split('@')[0] || 'Member'}] ${itemText}`,
      checked: false,
    };
    
    const updatedItems = [...(selectedNote.agenda_items || []), newItem];
    
    const { error } = await supabase
      .from("board_meeting_notes")
      .update({ agenda_items: updatedItems as unknown as any })
      .eq("id", selectedNote.id);
    
    if (error) {
      console.error("Failed to save agenda item:", error);
      toast.error(`Failed to save agenda item: ${error.message}`);
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    toast.success("Agenda item suggested");
  };

  // Handle saving member notes from WaitingForHostScreen
  const handleSaveMemberNotes = async (notesText: string) => {
    if (!selectedNote) return;
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    
    // Store notes in a member_notes JSONB field keyed by user_id
    const currentMemberNotes = (selectedNote as any).member_notes || {};
    const updatedMemberNotes = { ...currentMemberNotes, [userId]: notesText };
    
    await supabase
      .from("board_meeting_notes")
      .update({ member_notes: updatedMemberNotes } as any)
      .eq("id", selectedNote.id);
  };

  const exitMeeting = async () => {
    if (!selectedNote) return;
    
    // Check for unresolved decisions before allowing exit
    if (hasUnresolvedDecisions && selectedNote.status === 'active') {
      setPendingExitAction('exit');
      setShowExitGuardrail(true);
      return;
    }
    
    await performExit();
  };

  const performExit = async () => {
    if (!selectedNote) return;
    setTimerRunning(false);
    setTimerSeconds(0);
    
    await supabase
      .from("board_meeting_notes")
      .update({ status: "upcoming" })
      .eq("id", selectedNote.id);
    
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
    toast.success("Exited meeting - status reset to upcoming");
  };

  const handleEndMeetingWithGuardrail = async () => {
    if (!selectedNote) return;
    
    // Check for unresolved decisions before ending
    if (hasUnresolvedDecisions) {
      setPendingExitAction('endCall');
      setShowExitGuardrail(true);
      return;
    }
    
    await performEndMeeting();
  };

  const performEndMeeting = async () => {
    if (!selectedNote) return;
    
    // 1. Stop AI capture if running
    if (isCapturingAudio) {
      await stopAIAndGenerateNotes();
    }
    
    // 2. End video call
    if (isVideoConnected) {
      endCall();
    }
    
    // 3. Stop timer
    setTimerRunning(false);
    setTimerSeconds(0);
    
    // 4. Mark meeting completed using host hook (sets ended_at + status)
    await endMeetingAsHost();
    
    queryClient.invalidateQueries({ queryKey: ["board-meeting-notes", activeTenantId] });
  };

  const handleReviewDecisions = () => {
    setShowExitGuardrail(false);
    setPendingExitAction(null);
    // Scroll to decision matrix (user can review)
    const decisionSection = document.getElementById('decision-matrix-section');
    if (decisionSection) {
      decisionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeferAllAndEnd = async (note: string) => {
    await deferAllUnresolved.mutateAsync(note);
    setShowExitGuardrail(false);
    
    if (pendingExitAction === 'exit') {
      await performExit();
    } else if (pendingExitAction === 'endCall') {
      await performEndMeeting();
    }
    setPendingExitAction(null);
  };

  const exportToPdf = (note: MeetingNote) => {
    toast.info("PDF export coming soon");
  };

  // Beforeunload handler to prevent accidental navigation with unresolved decisions
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedNote?.status === 'active' && hasUnresolvedDecisions) {
        e.preventDefault();
        e.returnValue = 'You have unresolved decisions. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedNote?.status, hasUnresolvedDecisions]);

  const upcomingMeetings = notes.filter(n => n.status === "upcoming" || n.status === "active");
  const completedMeetings = notes.filter(n => n.status === "completed");

  // Show loading state while auth, tenant, or data is loading
  if (authLoading || tenantLoading || isLoading) {
    return (
      <div className="space-y-6">
        <BoardPageHeader title="Meeting Notes" subtitle="Board meeting agendas, memos, and decisions" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            {authLoading ? "Authenticating..." : tenantLoading ? "Loading workspace..." : "Loading meetings..."}
          </div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <BoardPageHeader title="Meeting Notes" subtitle="Board meeting agendas, memos, and decisions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Please sign in to view meetings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BoardPageHeader 
        title="Meeting Notes" 
        subtitle="Board meeting agendas, memos, and decisions"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Meeting Notes
          </Button>
        }
      />

      {/* Create Meeting Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Meeting</DialogTitle>
            <DialogDescription>
              Add meeting details and agenda notes. AI will generate the full agenda, memo, and decision matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Portfolio Review & Strategy"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting_date">Meeting Date *</Label>
                <Input
                  id="meeting_date"
                  type="date"
                  value={createForm.meeting_date}
                  onChange={(e) => setCreateForm({ ...createForm, meeting_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={createForm.start_time}
                  onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration</Label>
                <select
                  id="duration_minutes"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.duration_minutes}
                  onChange={(e) => setCreateForm({ ...createForm, duration_minutes: parseInt(e.target.value) })}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda_notes">Agenda Notes *</Label>
              <Textarea
                id="agenda_notes"
                placeholder="Enter your agenda topics, key discussion points, and any context for the meeting. AI will structure this into a formal agenda, memo, and decision matrix."
                rows={5}
                value={createForm.agenda_notes}
                onChange={(e) => setCreateForm({ ...createForm, agenda_notes: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                AI will generate the structured agenda, 1-page memo, and decision matrix from your notes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={createNoteMutation.isPending || isGenerating}>
              Cancel
            </Button>
            <Button onClick={handleCreateMeeting} disabled={createNoteMutation.isPending || isGenerating}>
              {createNoteMutation.isPending ? "Creating..." : isGenerating ? "AI Generating..." : "Create & Generate with AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Agenda Modal */}
      <Dialog open={isGenerateAgendaModalOpen} onOpenChange={setIsGenerateAgendaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Agenda with AI</DialogTitle>
            <DialogDescription>
              Enter your agenda notes and AI will generate a structured agenda, memo, and decision matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generate_agenda_notes">Agenda Notes</Label>
              <Textarea
                id="generate_agenda_notes"
                placeholder="Enter your agenda topics, key discussion points, and any context..."
                rows={6}
                value={generateAgendaNotes}
                onChange={(e) => setGenerateAgendaNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateAgendaModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={regenerateAgendaFromNotes} 
              disabled={!generateAgendaNotes.trim() || isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Members Modal */}
      {selectedNote && (
        <MeetingInviteManager
          meetingId={selectedNote.id}
          meetingTitle={selectedNote.title}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {/* Exit Guardrail Modal */}
      <ExitGuardrailModal
        isOpen={showExitGuardrail}
        onClose={() => setShowExitGuardrail(false)}
        unresolvedDecisions={unresolvedDecisions}
        onReviewDecisions={handleReviewDecisions}
        onDeferAllAndEnd={handleDeferAllAndEnd}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Member Questions & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Pre-Meeting Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedNote ? (
                <>
                  <ScrollArea className="h-48">
                    {(selectedNote.member_questions || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No questions yet. Add one below.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedNote.member_questions.map((q) => (
                          <div key={q.id} className="p-2 bg-muted/50 rounded text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <span className="font-medium text-foreground">Q</span>
                              <span>{q.author}</span>
                              <span>•</span>
                              <span>{format(new Date(q.created_at), "MMM d")}</span>
                            </div>
                            <p>{q.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {selectedNote.status !== 'completed' && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a question..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addMemberQuestion()}
                          className="text-sm"
                        />
                        <Button size="sm" onClick={addMemberQuestion}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Select a meeting to add questions.</p>
              )}
            </CardContent>
          </Card>

          {/* Meetings List - hide when in active meeting */}
          {(!selectedNote || selectedNote.status !== 'active') && (
            <div className="space-y-3">
              <h3 className="font-medium text-foreground text-sm">Upcoming</h3>
              {upcomingMeetings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming meetings.</p>
              ) : (
                upcomingMeetings.map(note => (
                  <Card 
                    key={note.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      if (selectedNote?.id === note.id) {
                        setSelectedNote(null);
                      } else {
                        setSelectedNote(note);
                        setTimerSeconds(0);
                        setTimerRunning(false);
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate">{note.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatMeetingDate(note.meeting_date)}
                            {note.start_time && (
                              <>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                {String(note.start_time).substring(0, 5)}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={note.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {note.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteMeeting(e, note.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <h3 className="font-medium text-foreground text-sm mt-4">Recent Meetings</h3>
              {completedMeetings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No completed meetings yet.</p>
              ) : (
                completedMeetings.map(note => (
                  <Card 
                    key={note.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate">{note.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatMeetingDate(note.meeting_date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            completed
                          </Badge>
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Exit Meeting button when in active meeting */}
          {selectedNote?.status === 'active' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={exitMeeting}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit Meeting
            </Button>
          )}
        </div>

        {/* Center/Right Panel: Meeting Detail */}
        <div className="lg:col-span-3 space-y-6">
          {selectedNote ? (
            <>
              {/* Header with Timer + Host Controls */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedNote.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatMeetingDate(selectedNote.meeting_date, "EEEE, MMMM d, yyyy")}
                      {selectedNote.start_time && (
                        <>
                          <span className="mx-2">@</span>
                          {String(selectedNote.start_time).substring(0, 5)}
                        </>
                      )}
                      <span className="mx-2">•</span>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {selectedNote.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Host-only action buttons */}
                    {isHost && (
                      <>
                        {/* Invite button - always visible for host */}
                        <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                          <Users className="w-4 h-4 mr-2" />
                          Invite
                        </Button>

                        {/* Start Meeting - before host starts */}
                        {!hostHasStarted && selectedNote.status !== 'completed' && (
                          <Button size="sm" onClick={startMeeting}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Meeting
                          </Button>
                        )}

                        {/* Regenerate AI Pack - before host starts */}
                        {!hostHasStarted && selectedNote.status !== 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsGenerateAgendaModalOpen(true)}
                            disabled={isGenerating}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate AI Pack
                          </Button>
                        )}

                        {/* End Meeting - after start, during active */}
                        {hostHasStarted && selectedNote.status === 'active' && (
                          <>
                            {/* Nav toggle - host only during active meeting */}
                            {showNavToggle && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={toggleNav}
                                title={navCollapsed ? "Show Navigation" : "Hide Navigation"}
                              >
                                {navCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={handleEndMeetingWithGuardrail}>
                              <LogOut className="w-4 h-4 mr-2" />
                              End Meeting
                            </Button>
                          </>
                        )}

                        {/* Carry Forward - after completed */}
                        {selectedNote.status === 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => carryForward(selectedNote.id)}
                            disabled={isCarryingForward}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {isCarryingForward ? 'Creating...' : 'Carry Forward'}
                          </Button>
                        )}
                      </>
                    )}

                    {/* Timer display - visible during active meeting */}
                    {selectedNote.status !== 'completed' && hostHasStarted && (
                      <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                        {isCapturingAudio && (
                          <Badge variant="default" className="bg-green-600 animate-pulse text-xs">
                            AI Listening
                          </Badge>
                        )}
                        <span className={`font-mono text-lg ${timerRunning ? 'text-primary' : ''}`}>
                          {getRemainingTime()}
                        </span>
                        {isHost && (
                          <div className="flex gap-1">
                            {!timerRunning ? (
                              <Button size="sm" variant="ghost" onClick={() => setTimerRunning(true)} title="Resume Timer">
                                <Play className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setTimerRunning(false)}>
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}>
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <Button variant="outline" size="sm" onClick={() => exportToPdf(selectedNote)}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Non-host waiting screen (before host starts) */}
              {!isHost && !hostHasStarted && selectedNote.status !== 'completed' && !isLoadingHost && (
                <WaitingForHostScreen
                  meeting={{
                    id: selectedNote.id,
                    title: selectedNote.title,
                    meeting_date: selectedNote.meeting_date,
                    start_time: selectedNote.start_time,
                    duration_minutes: selectedNote.duration_minutes,
                    agenda_items: selectedNote.agenda_items,
                    memo: selectedNote.memo,
                    member_questions: selectedNote.member_questions,
                  }}
                  currentUserName=""
                  onAddQuestion={handleAddQuestionFromWaiting}
                  onAddAgendaItem={handleAddAgendaItemFromWaiting}
                  onSaveNotes={handleSaveMemberNotes}
                  memberNotes={(selectedNote as any).member_notes?.[currentUserId || ''] || ''}
                />
              )}

              {/* Host Meeting Tabs (for host during active meeting) */}
              {isHost && hostHasStarted && selectedNote.status === 'active' && (
                <HostMeetingTabs
                  meetingId={selectedNote.id}
                  isHost={isHost}
                  onMediaPlayStateChange={handleMediaPlayStateChange}
                />
              )}

              {isGenerating && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                    <p className="text-sm">AI is generating your agenda, memo, and decision matrix...</p>
                  </CardContent>
                </Card>
              )}

              {/* Video Meeting Panel - only show after host starts (or for host before start) */}
              {selectedNote.status !== 'completed' && (isHost || hostHasStarted) && (
                <div className="sticky top-4 z-10">
                  <BoardMeetingVideo
                    isConnected={isVideoConnected}
                    isConnecting={isVideoConnecting}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isGeneratingNotes={isGeneratingNotes}
                    isCapturingAudio={isCapturingAudio}
                    participants={participants}
                    localVideoRef={localVideoRef}
                    hasActiveRoom={hasActiveRoom}
                    guestToken={(selectedNote as any).guest_token}
                    onToggleMute={toggleMute}
                    onToggleVideo={toggleVideo}
                    onStartMeeting={isHost ? startVideoMeeting : undefined}
                    onJoinMeeting={hostHasStarted ? joinVideoMeeting : undefined}
                    onStopAIAndGenerateNotes={isHost ? stopAIAndGenerateNotes : undefined}
                    onEndCall={isHost ? handleEndMeetingWithGuardrail : undefined}
                  />
                  {/* Host gate message for non-host before start */}
                  {!isHost && !hostHasStarted && (
                    <div className="mt-2 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Video will be available once the host starts the meeting
                    </div>
                  )}
                </div>
              )}

              {/* Agenda with Checkboxes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Board Meeting Agenda
                      {selectedNote.status === 'active' && (
                        <Badge variant="default" className="ml-2">In Progress</Badge>
                      )}
                    </CardTitle>
                    {selectedNote.status !== 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsGenerateAgendaModalOpen(true)}
                        disabled={isGenerating}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate with AI
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedNote.agenda_items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No agenda items yet. Add items manually or use AI to generate from notes.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedNote.agenda_items.map((item, i) => {
                        const isDisabled = selectedNote.status === 'completed' || (selectedNote.status === 'active' && !isHost);
                        const checkboxId = `agenda-checkbox-${selectedNote.id}-${i}`;
                        return (
                          <div key={`agenda-${selectedNote.id}-${i}`} className="flex items-start gap-3 group">
                            <Checkbox
                              id={checkboxId}
                              checked={item.checked}
                              onCheckedChange={() => toggleAgendaItem(selectedNote.id, i)}
                              className="mt-0.5"
                              disabled={isDisabled}
                            />
                            <label 
                              htmlFor={checkboxId}
                              className={`text-sm flex-1 ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              {i + 1}. {item.text}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Add agenda item manually */}
                  {selectedNote.status !== 'completed' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder="Add agenda item..."
                        value={newAgendaItem}
                        onChange={(e) => setNewAgendaItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addManualAgendaItem()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={addManualAgendaItem} disabled={!newAgendaItem.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Memo (Collapsible) */}
              {selectedNote.memo && (
                <Collapsible open={memoOpen} onOpenChange={setMemoOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Meeting Agenda</CardTitle>
                          {memoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {selectedNote.memo.purpose && (
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-1">Summary</h4>
                            <p className="text-sm text-muted-foreground">{selectedNote.memo.purpose}</p>
                          </div>
                        )}
                        {selectedNote.memo.objective && (
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-1">Objective</h4>
                            <p className="text-sm text-muted-foreground">{selectedNote.memo.objective}</p>
                          </div>
                        )}
                        {selectedNote.memo.current_state && selectedNote.memo.current_state.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-1">Current State</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedNote.memo.current_state.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedNote.memo.key_questions && selectedNote.memo.key_questions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-1">Key Questions</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedNote.memo.key_questions.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Decision Matrix - New component for active meetings */}
              {selectedNote.status === 'active' && (
                <Card id="decision-matrix-section">
                  <CardHeader>
                    <CardTitle className="text-lg">Decision Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DecisionMatrixTable 
                      meetingId={selectedNote.id}
                      isHost={true}
                      isCompleted={false}
                      meetingStatus={selectedNote.status}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Decision Matrix - Read-only for completed meetings */}
              {selectedNote.status === 'completed' && (
                <Card id="decision-matrix-section">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Decision Matrix</CardTitle>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DecisionMatrixTable 
                      meetingId={selectedNote.id}
                      isHost={true}
                      isCompleted={true}
                      meetingStatus={selectedNote.status}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Legacy Decision Table for upcoming meetings (from AI generation) */}
              {selectedNote.status === 'upcoming' && selectedNote.decision_table.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Decision Matrix (Preview)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DecisionTable 
                      rows={selectedNote.decision_table}
                      onDecisionChange={(rowIndex, value) => handleDecisionChange(selectedNote.id, rowIndex, value)}
                    />
                  </CardContent>
                </Card>
              )}

              {/* AI Meeting Notes (from video meeting) */}
              <AIMeetingNotes
                aiSummary={selectedNote.ai_summary_draft}
                aiDecisions={selectedNote.ai_decisions_draft}
                aiActionItems={selectedNote.ai_action_items_draft}
                aiAgendaRecap={selectedNote.ai_agenda_recap_draft}
                aiRisks={selectedNote.ai_risks_draft}
                aiNextMeetingPrep={selectedNote.ai_next_meeting_prep_draft}
                transcript={selectedNote.audio_transcript}
                aiNotesStatus={selectedNote.ai_notes_status}
                generatedAt={selectedNote.ai_notes_generated_at}
              />

              {/* Generate Summary Button */}
              {selectedNote.status !== 'completed' && selectedNote.decision_table.length > 0 && (
                <div className="flex flex-col items-end gap-2">
                  {selectedNote.decision_table.some(row => !row.Decision?.trim()) && (
                    <p className="text-sm text-destructive">All decisions must be filled before generating summary</p>
                  )}
                  <Button 
                    onClick={() => generateSummaryMutation.mutate(selectedNote.id)}
                    disabled={
                      generateSummaryMutation.isPending || 
                      selectedNote.decisions_summary_locked ||
                      selectedNote.decision_table.some(row => !row.Decision?.trim())
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Meeting & Generate Summary
                  </Button>
                </div>
              )}

              {/* Decisions Summary */}
              {selectedNote.decisions_summary && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Post-Meeting Decisions Summary
                        {selectedNote.decisions_summary_locked && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      {selectedNote.decisions_summary_generated_at && (
                        <span className="text-xs text-muted-foreground">
                          Generated {format(new Date(selectedNote.decisions_summary_generated_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {selectedNote.decisions_summary.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h4 key={i} className="font-semibold text-foreground mt-0 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                        }
                        if (line.startsWith('- **')) {
                          const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                          if (match) {
                            return (
                              <p key={i} className="my-1">
                                <span className="font-medium">{match[1]}</span>: {match[2]}
                              </p>
                            );
                          }
                        }
                        return line ? <p key={i} className="my-1">{line}</p> : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Select a meeting from the list to view details, or create a new one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Exit Guardrail Modal */}
      <ExitGuardrailModal
        isOpen={showExitGuardrail}
        onClose={() => {
          setShowExitGuardrail(false);
          setPendingExitAction(null);
        }}
        unresolvedDecisions={unresolvedDecisions}
        onReviewDecisions={handleReviewDecisions}
        onDeferAllAndEnd={handleDeferAllAndEnd}
      />
    </div>
  );
}
