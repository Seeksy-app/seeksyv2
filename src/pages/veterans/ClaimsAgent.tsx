import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MessageSquare, Send, Loader2, ExternalLink, AlertCircle, ChevronRight, Eye, ClipboardList, Shield, Calculator } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClaimsIntakeFlow, IntakeData } from "@/components/veterans/ClaimsIntakeFlow";
import { ClaimsLeftSidebar } from "@/components/veterans/ClaimsLeftSidebar";
import { ClaimsRightSidebar, ClaimsNote } from "@/components/veterans/ClaimsRightSidebar";
import { ClaimsChatMessage } from "@/components/veterans/ClaimsChatMessage";
import { ClaimsSavePrompt } from "@/components/veterans/ClaimsSavePrompt";
import { QUICK_REPLY_TEMPLATES } from "@/components/veterans/ClaimsQuickReplies";
import { useVeteranConversation } from "@/hooks/useVeteranConversation";

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

const INTRO_SEQUENCE: Message[] = [
  {
    role: "assistant",
    content: "Hi there! I'm your VA claims guide. I'm here to help you understand your benefits and options — all in plain, simple terms. I'll ask a few questions, take notes along the way, and when you're ready, I can connect you with a professional who can file for you.\n\nLet's start with your name. What should I call you?",
  }
];

const createSystemPrompt = (intakeData: IntakeData, notes: ClaimsNote[], userName?: string) => {
  const notesContext = notes.length > 0 
    ? `\n\nCurrent collected information:\n${notes.map(n => `- ${n.category}: ${n.value}`).join('\n')}`
    : '';
  
  const goalsText = intakeData.primaryGoals.join(", ");
  const nameGreeting = userName ? `The user's name is ${userName}. Use their name occasionally to personalize.` : '';
    
  return `You are a VA Claims Agent helping veterans understand and file their disability claims. You speak at an 8th-grade reading level. You are calm, clear, encouraging, and non-technical.

${nameGreeting}

The user has completed intake with the following information:
- Status: ${intakeData.status}
- Branch of Service: ${intakeData.branch}
- Claim Status: ${intakeData.claimStatus}
- Primary Goals: ${goalsText}
${notesContext}

FORMATTING RULES:
1. Use <strong>text</strong> for emphasis, NEVER markdown **text**
2. Keep messages to 4 sentences or fewer when possible
3. After asking a question, add "For example:" with 1-3 very short sample answers
4. Split long explanations into numbered steps
5. Be encouraging and supportive — many veterans find this process overwhelming
6. ALWAYS end your response with 2-4 suggested follow-up prompts for the user

CRITICAL: At the END of EVERY response, include suggested prompts in this exact format:
<prompts>["First suggestion", "Second suggestion", "Third suggestion"]</prompts>

These should be short, helpful next-step suggestions like:
- "Tell me about Intent to File"
- "What conditions can I claim?"
- "How do I gather evidence?"
- "I have questions about my rating"

Your goals:
1. Help veterans understand what benefits they may be entitled to
2. Guide them through the Intent to File process (explain that it preserves their effective date for up to 1 year)
3. Collect information about their service-connected conditions and symptoms
4. Explain the claims process in simple terms
5. When ready, offer to connect them with a professional claims company

IMPORTANT: After EVERY user response, include a JSON block at the END of your message in this exact format to extract key information:
<notes>
{"category": "Category Name", "value": "Brief bullet phrase - no full sentences"}
</notes>

Categories can include:
- Years of Service
- Separation Year
- Claimed Conditions
- Current Symptoms
- Available Evidence
- Existing VA Rating
- Medical History
- Service Connection
- Important Dates

Keep note values SHORT — brief bullet phrases, not paragraphs.

At the end of meaningful conversations, offer to generate a claims summary and connect them with a filing partner.`;
};

const SAMPLE_INTAKE: IntakeData = {
  status: "veteran",
  branch: "army",
  claimStatus: "not_filed",
  primaryGoals: ["prepare_claim", "file_intent"],
};

const SAMPLE_NOTES: ClaimsNote[] = [
  { category: "Years of Service", value: "8 years (2012-2020)" },
  { category: "Separation Year", value: "2020" },
  { category: "Claimed Conditions", value: "Tinnitus, lower back pain, knee injury" },
  { category: "Current Symptoms", value: "Constant ringing, chronic back pain, difficulty walking" },
  { category: "Available Evidence", value: "Service medical records, private doctor diagnosis" },
];

const SAMPLE_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Thanks for sharing, Mike! I can see you're interested in filing your first VA claim. Let's talk about the symptoms or conditions you'd like to claim.\n\nWhat health issues have you experienced that you believe are connected to your military service?\n\nFor example: back pain, hearing loss, knee problems, headaches, or PTSD.",
    quickReplies: ["Back pain", "Hearing loss / Tinnitus", "PTSD / Mental health", "Joint pain", "Other condition"]
  },
  {
    role: "user",
    content: "I have constant ringing in my ears from being around artillery. My back hurts all the time from carrying heavy gear, and my right knee is messed up from a training injury."
  },
  {
    role: "assistant",
    content: "Those are very common service-connected conditions:\n\n<strong>1. Tinnitus</strong> — Ringing in the ears from noise exposure is one of the most commonly claimed conditions.\n\n<strong>2. Lower back pain</strong> — Often caused by carrying heavy equipment and body armor.\n\n<strong>3. Knee injury</strong> — Training injuries are well-documented service connections.\n\nDo you have any medical records or documentation for these conditions?\n\nFor example: service treatment records, VA medical records, or private doctor visits.",
    quickReplies: ["I have medical records", "I have some documentation", "I need help gathering evidence", "Not sure what I have"]
  },
];

export default function ClaimsAgent() {
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const isNew = searchParams.get('new') === 'true';

  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showingSample, setShowingSample] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const calculatorsRef = useRef<HTMLDivElement>(null);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use the conversation hook
  const {
    conversationId,
    messages,
    setMessages,
    notes,
    setNotes,
    intakeData,
    setIntakeData,
    userName,
    setUserName,
    profile,
    isLoading: isLoadingConversation,
    intakeComplete,
    setIntakeComplete,
    createConversation,
    saveMessage,
    updateContext,
  } = useVeteranConversation(user, conversationIdParam, isNew);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Show save prompt after 8 messages for non-logged-in users
  useEffect(() => {
    if (messageCount === 8 && !showSavePrompt && !user) {
      setShowSavePrompt(true);
    }
  }, [messageCount, showSavePrompt, user]);

  const handleIntakeComplete = async (data: IntakeData) => {
    setIntakeData(data);
    setIntakeComplete(true);
    setCurrentStep(2);
    setShowingSample(false);
    setMessages(INTRO_SEQUENCE);

    // If logged in, create conversation and save to DB
    if (user) {
      await createConversation(data);
      // Save the intro message
      await saveMessage(INTRO_SEQUENCE[0]);
    }
  };

  const handleShowSample = () => {
    setShowingSample(true);
    setIntakeComplete(true);
    setIntakeData(SAMPLE_INTAKE);
    setMessages(SAMPLE_MESSAGES);
    setNotes(SAMPLE_NOTES);
    setUserName("Mike");
    setCurrentStep(3);
  };

  const handleExitSample = () => {
    setShowingSample(false);
    setIntakeComplete(false);
    setIntakeData(null);
    setMessages([]);
    setNotes([]);
    setUserName(undefined);
    setCurrentStep(1);
  };

  const extractNotes = (content: string): { cleanContent: string; note: ClaimsNote | null } => {
    const notesMatch = content.match(/<notes>\s*({.*?})\s*<\/notes>/s);
    if (notesMatch) {
      try {
        const noteData = JSON.parse(notesMatch[1]);
        const cleanContent = content.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
        return { 
          cleanContent, 
          note: { category: noteData.category, value: noteData.value } 
        };
      } catch {
        return { cleanContent: content, note: null };
      }
    }
    return { cleanContent: content, note: null };
  };

  const extractPrompts = (content: string): { cleanContent: string; prompts: string[] } => {
    const promptsMatch = content.match(/<prompts>\s*(\[.*?\])\s*<\/prompts>/s);
    if (promptsMatch) {
      try {
        const prompts = JSON.parse(promptsMatch[1]);
        const cleanContent = content.replace(/<prompts>[\s\S]*?<\/prompts>/g, '').trim();
        return { cleanContent, prompts: Array.isArray(prompts) ? prompts : [] };
      } catch {
        return { cleanContent: content, prompts: [] };
      }
    }
    return { cleanContent: content, prompts: [] };
  };

  const cleanMessageContent = (content: string): string => {
    let cleaned = content.replace(/\{"category":\s*"[^"]*",\s*"value":\s*"[^"]*"\}/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\s*[,;]\s*$/, '');
    return cleaned;
  };

  const getQuickRepliesForContext = (messageContent: string): string[] | undefined => {
    const lowerContent = messageContent.toLowerCase();
    
    if (lowerContent.includes("evidence") || lowerContent.includes("documentation") || lowerContent.includes("records")) {
      return QUICK_REPLY_TEMPLATES.evidence;
    }
    if (lowerContent.includes("condition") || lowerContent.includes("symptom") || lowerContent.includes("health issue")) {
      return QUICK_REPLY_TEMPLATES.symptoms;
    }
    if (lowerContent.includes("would you like") || lowerContent.includes("do you want")) {
      return QUICK_REPLY_TEMPLATES.yesNo;
    }
    if (lowerContent.includes("step") || lowerContent.includes("next")) {
      return QUICK_REPLY_TEMPLATES.nextSteps;
    }
    return QUICK_REPLY_TEMPLATES.navigation;
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading || !intakeData) return;

    setInput("");
    setError(null);
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setMessageCount(prev => prev + 1);
    setIsLoading(true);

    // Capture name from first response
    if (!userName && messages.length === 1) {
      const nameParts = userMessage.split(" ");
      if (nameParts.length <= 3 && nameParts[0].length > 1) {
        const capturedName = nameParts[0];
        setUserName(capturedName);
        if (user) {
          updateContext({ userName: capturedName });
        }
      }
    }

    // Save user message to DB
    if (user && conversationId) {
      await saveMessage(newUserMessage);
    }

    try {
      const response = await supabase.functions.invoke("veteran-claims-chat", {
        body: {
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
          ],
          systemPrompt: createSystemPrompt(intakeData, notes, userName || undefined)
        }
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.error) {
        if (response.data.error.includes("Rate limit")) {
          setError("We're experiencing high demand. Please wait a moment and try again.");
        } else if (response.data.error.includes("credits")) {
          setError("Service temporarily unavailable. Please try again later.");
        } else {
          setError(response.data.error);
        }
        return;
      }

      let rawMessage = response.data?.message || "I'm sorry, I couldn't process that. Could you try again?";
      
      const { cleanContent: contentAfterNotes, note } = extractNotes(rawMessage);
      const { cleanContent: contentAfterPrompts, prompts } = extractPrompts(contentAfterNotes);
      const finalContent = cleanMessageContent(contentAfterPrompts);
      
      let updatedNotes = notes;
      if (note) {
        const exists = notes.some(n => n.category === note.category && n.value === note.value);
        if (!exists) {
          updatedNotes = [...notes, note];
          setNotes(updatedNotes);
        }
      }
      
      const quickReplies = prompts.length > 0 ? prompts : getQuickRepliesForContext(finalContent);
      const assistantMessage: Message = { role: "assistant", content: finalContent, quickReplies };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to DB with notes
      if (user && conversationId) {
        await saveMessage(assistantMessage, updatedNotes);
      }
      
      if (notes.length >= 2 && currentStep === 2) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError("Connection issue. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (value: string) => {
    sendMessage(value);
  };

  const handleSaveConversation = async (email: string, name?: string) => {
    try {
      const allNotes = [
        ...(intakeData ? [
          `Status: ${intakeData.status}`,
          `Branch: ${intakeData.branch}`,
          `Claim Status: ${intakeData.claimStatus}`,
          `Goals: ${intakeData.primaryGoals.join(", ")}`,
        ] : []),
        ...notes.map(n => `${n.category}: ${n.value}`),
      ].join("\n");

      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          name: name || userName || "Anonymous",
          email,
          source: "claims-agent-save",
          notes: allNotes,
          status: "saved"
        });

      if (error) throw error;
      
      toast.success("Your progress has been saved! We'll send you a link to continue.");
      setShowSavePrompt(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleSubmitLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmittingLead(true);

    try {
      const allNotes = [
        ...(intakeData ? [
          `Status: ${intakeData.status}`,
          `Branch: ${intakeData.branch}`,
          `Claim Status: ${intakeData.claimStatus}`,
          `Goals: ${intakeData.primaryGoals.join(", ")}`,
        ] : []),
        ...notes.map(n => `${n.category}: ${n.value}`),
      ].join("\n");

      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone || null,
          source: "claims-agent-mvp",
          notes: allNotes,
          status: "new"
        });

      if (error) throw error;

      toast.success("Thank you! A claims specialist will contact you within 24 hours.");
      setShowHandoffModal(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Great! I've connected you with our partner claims filing company. They'll reach out within 24 hours to help you file your claim. In the meantime, feel free to ask me any other questions about your benefits.",
        quickReplies: QUICK_REPLY_TEMPLATES.navigation
      }]);
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit. Please try again or contact us directly.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const scrollToCalculators = () => {
    calculatorsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show loading while fetching conversation
  if (isLoadingConversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/veterans" className="hover:text-foreground">Veterans Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Claims Agent</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-orange-500/10">
                <MessageSquare className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">AI Claims Agent</h1>
                <p className="text-xs text-muted-foreground">Your guide to VA disability benefits</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={scrollToCalculators}
                className="hidden md:flex"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculators
              </Button>
              
              {intakeComplete && (
                <div className="hidden lg:flex items-center gap-1 text-xs">
                  <span className={`px-2 py-1 rounded ${currentStep >= 1 ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    1. Intake
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className={`px-2 py-1 rounded ${currentStep >= 2 ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                    2. Conditions
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className={`px-2 py-1 rounded ${currentStep >= 3 ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                    3. Filing Options
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Banner */}
      {showingSample && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Viewing Sample Results</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleExitSample}>
            Start Your Own Session
          </Button>
        </div>
      )}

      {/* Main Content */}
      {!intakeComplete ? (
        <div className="flex-1 overflow-auto">
          <ClaimsIntakeFlow 
            onComplete={handleIntakeComplete} 
            onShowSample={handleShowSample}
            initialData={profile ? {
              status: profile.service_status || '',
              branch: profile.branch_of_service || '',
              claimStatus: profile.last_claim_stage || '',
              primaryGoals: [],
            } : undefined}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Sidebar */}
            <ResizablePanel defaultSize={25} minSize={18} maxSize={40} className="hidden lg:block">
              <div className="h-full border-r bg-card/50 overflow-auto">
                <ClaimsLeftSidebar 
                  currentStep={currentStep} 
                  onHandoffClick={() => setShowHandoffModal(true)}
                  onCalculatorsClick={scrollToCalculators}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="hidden lg:flex" />

            {/* Chat Area */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-auto px-6 py-6">
                  <div className="max-w-[800px] mx-auto space-y-6">
                    {messages.map((message, index) => (
                      <ClaimsChatMessage
                        key={index}
                        role={message.role}
                        content={message.content}
                        quickReplies={message.quickReplies}
                        onQuickReply={handleQuickReply}
                        isLatest={index === messages.length - 1}
                        isLoading={isLoading}
                      />
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                          <p className="text-muted-foreground text-sm">Thinking...</p>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Save Prompt */}
                {showSavePrompt && (
                  <ClaimsSavePrompt 
                    onSave={handleSaveConversation}
                    onDismiss={() => setShowSavePrompt(false)}
                  />
                )}

                {/* Input Area */}
                <div className="flex-shrink-0 px-6 pb-4">
                  <div className="max-w-[800px] mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading || showingSample}
                        className="pr-12 py-6 text-[15px] rounded-xl shadow-md border-muted-foreground/20"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading || showingSample}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-600 hover:bg-orange-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle className="hidden xl:flex" />

            {/* Right Sidebar - Desktop */}
            <ResizablePanel defaultSize={22} minSize={15} maxSize={35} className="hidden xl:block">
              <div className="h-full border-l bg-card/50 overflow-hidden">
                <ClaimsRightSidebar 
                  notes={notes} 
                  intakeData={intakeData || undefined}
                  userName={userName || undefined}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Mobile Notes Button */}
          <div className="xl:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="fixed bottom-20 right-4 z-50 shadow-lg rounded-full"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Notes ({notes.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] p-0">
                <ClaimsRightSidebar 
                  notes={notes} 
                  intakeData={intakeData || undefined}
                  userName={userName || undefined}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Calculator Anchor Target */}
      <div ref={calculatorsRef} />

      {/* Handoff Modal */}
      <Dialog open={showHandoffModal} onOpenChange={setShowHandoffModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Connect with a Claims Specialist
            </DialogTitle>
            <DialogDescription>
              Ready to file? Our partner will reach out within 24 hours to help you with your claim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="lead-name">Name *</Label>
              <Input
                id="lead-name"
                value={leadForm.name}
                onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email *</Label>
              <Input
                id="lead-email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone (optional)</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoffModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitLead}
              disabled={isSubmittingLead || !leadForm.name || !leadForm.email}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingLead ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Me
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
