import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Send, Loader2, ExternalLink, AlertCircle, ChevronRight, 
  ClipboardList, Shield, Calculator, Sparkles, DollarSign, FileText, TrendingUp,
  Clock
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClaimsRightSidebar, ClaimsNote } from "@/components/veterans/ClaimsRightSidebar";
import { ClaimsChatMessage } from "@/components/veterans/ClaimsChatMessage";
import { QUICK_REPLY_TEMPLATES } from "@/components/veterans/ClaimsQuickReplies";
import { Helmet } from "react-helmet";

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

interface IntakeData {
  status: string;
  branch: string;
  claimStatus: string;
  primaryGoals: string[];
}

interface VeteranProfile {
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
  last_claim_stage: string | null;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi there! I'm your VA benefits guide. I can help you understand your benefits, prepare claims, run calculations, and answer questions about VA disability compensation.\n\nHow can I help you today?",
  quickReplies: [
    "Help me file a VA claim",
    "Calculate my VA compensation",
    "What is Intent to File?",
    "Estimate my TSP growth"
  ]
};

const SUGGESTION_PROMPTS = [
  { title: "File a Claim", description: "Get step-by-step guidance", icon: FileText },
  { title: "Calculate Benefits", description: "Estimate your compensation", icon: DollarSign },
  { title: "Intent to File", description: "Preserve your effective date", icon: Clock },
  { title: "TSP Calculator", description: "Project retirement savings", icon: TrendingUp },
];

const createSystemPrompt = (notes: ClaimsNote[], userName?: string, profile?: VeteranProfile | null) => {
  const notesContext = notes.length > 0 
    ? `\n\nCollected information:\n${notes.map(n => `- ${n.category}: ${n.value}`).join('\n')}`
    : '';
  
  const profileContext = profile ? `
Profile:
- Status: ${profile.service_status || 'Unknown'}
- Branch: ${profile.branch_of_service || 'Unknown'}
- Intent to File: ${profile.has_intent_to_file ? 'Yes' : 'No'}` : '';
  
  const nameGreeting = userName ? `The user's name is ${userName}. Use their name occasionally.` : '';
    
  return `You are a VA Claims Agent helping veterans understand and file their disability claims. You speak at an 8th-grade reading level. You are calm, clear, encouraging, and non-technical.

${nameGreeting}
${profileContext}
${notesContext}

CAPABILITIES:
1. Help veterans understand VA disability benefits
2. Guide them through the Intent to File process
3. Collect information about service-connected conditions
4. Explain claims process in simple terms
5. CALCULATOR REQUESTS: When users ask to calculate things like TSP growth, VA compensation, military buy-back, sick leave credit, or any benefit calculation, you should explain what the calculation does and offer to help them understand the inputs. Then suggest they use the calculator in the sidebar.

FORMATTING RULES:
1. Use <strong>text</strong> for emphasis, NEVER markdown **text**
2. Keep messages to 4 sentences or fewer when possible
3. After asking a question, add "For example:" with 1-3 very short sample answers
4. Split long explanations into numbered steps
5. Be encouraging and supportive

CRITICAL: At the END of EVERY response, include suggested prompts in this exact format:
<prompts>["First suggestion", "Second suggestion", "Third suggestion"]</prompts>

These should be short, helpful next-step suggestions.

IMPORTANT: After user responses about their conditions/situation, include a JSON block to extract key information:
<notes>
{"category": "Category Name", "value": "Brief bullet phrase"}
</notes>

Categories: Years of Service, Separation Year, Claimed Conditions, Current Symptoms, Available Evidence, Existing VA Rating, Medical History, Service Connection, Important Dates

At the end of meaningful conversations, offer to connect them with a filing partner.`;
};

export default function ClaimsAgent() {
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const isNewParam = searchParams.get('new') === 'true';
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<VeteranProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<ClaimsNote[]>([]);
  const [userName, setUserName] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showCalculators, setShowCalculators] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check auth state and load profile
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('veteran_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (data) setProfile(data);

        // Get user's name from metadata
        const fullName = session.user.user_metadata?.full_name;
        if (fullName) {
          setUserName(fullName.split(' ')[0]);
        }
      }
    };
    
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load conversation or show welcome
  useEffect(() => {
    const loadConversation = async () => {
      setIsLoadingConversation(true);

      // New conversation requested - show welcome
      if (isNewParam || !conversationIdParam) {
        setMessages([WELCOME_MESSAGE]);
        setNotes([]);
        setConversationId(null);
        setIsLoadingConversation(false);
        return;
      }

      // Load specific conversation
      if (conversationIdParam && user) {
        try {
          const { data: convo } = await supabase
            .from('veteran_conversations')
            .select('*')
            .eq('id', conversationIdParam)
            .single();

          if (convo) {
            setConversationId(conversationIdParam);

            // Load context
            if (convo.context_json && typeof convo.context_json === 'object') {
              const context = convo.context_json as Record<string, unknown>;
              if (context.userName) setUserName(context.userName as string);
              if (context.notes && Array.isArray(context.notes)) {
                setNotes(context.notes as ClaimsNote[]);
              }
            }

            // Load messages
            const { data: chatMessages } = await supabase
              .from('veteran_chat_messages')
              .select('*')
              .eq('conversation_id', conversationIdParam)
              .order('created_at', { ascending: true });

            if (chatMessages && chatMessages.length > 0) {
              const loadedMessages: Message[] = chatMessages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                quickReplies: Array.isArray(m.quick_replies) ? m.quick_replies as string[] : undefined,
              }));
              setMessages(loadedMessages);

              // Extract notes from messages
              const allNotes: ClaimsNote[] = [];
              chatMessages.forEach(m => {
                if (m.notes && Array.isArray(m.notes)) {
                  (m.notes as unknown as ClaimsNote[]).forEach(n => {
                    if (n && typeof n === 'object' && 'category' in n && 'value' in n) {
                      if (!allNotes.some(existing => existing.category === n.category && existing.value === n.value)) {
                        allNotes.push({ category: String(n.category), value: String(n.value) });
                      }
                    }
                  });
                }
              });
              if (allNotes.length > 0) setNotes(allNotes);
            } else {
              // No messages yet - show welcome
              setMessages([WELCOME_MESSAGE]);
            }
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          setMessages([WELCOME_MESSAGE]);
        }
      } else {
        setMessages([WELCOME_MESSAGE]);
      }

      setIsLoadingConversation(false);
    };

    loadConversation();
  }, [conversationIdParam, isNewParam, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const extractNotes = (content: string): { cleanContent: string; note: ClaimsNote | null } => {
    const notesMatch = content.match(/<notes>\s*({.*?})\s*<\/notes>/s);
    if (notesMatch) {
      try {
        const noteData = JSON.parse(notesMatch[1]);
        const cleanContent = content.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
        return { cleanContent, note: { category: noteData.category, value: noteData.value } };
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

  const createOrGetConversation = async (): Promise<string | null> => {
    if (!user) return null;
    if (conversationId) return conversationId;

    try {
      const { data, error } = await supabase
        .from('veteran_conversations')
        .insert({
          user_id: user.id,
          title: userName ? `Chat with ${userName}` : 'Benefits Discussion',
          context_json: { userName, notes: [] },
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (message: Message, convoId: string, currentNotes?: ClaimsNote[]) => {
    if (!user) return;

    try {
      await supabase.from('veteran_chat_messages').insert({
        conversation_id: convoId,
        role: message.role,
        content: message.content,
        quick_replies: message.quickReplies || null,
        notes: currentNotes ? currentNotes.map(n => ({ category: n.category, value: n.value })) : null,
      });

      const contextData = { userName: userName || null, notes: (currentNotes || notes).map(n => ({ category: n.category, value: n.value })) };

      await supabase
        .from('veteran_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          context_json: contextData,
          title: userName ? `Chat with ${userName}` : 'Benefits Discussion',
        })
        .eq('id', convoId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setError(null);
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Create conversation if needed
    let activeConvoId = conversationId;
    if (user && !activeConvoId) {
      activeConvoId = await createOrGetConversation();
    }

    // Save user message
    if (activeConvoId) {
      await saveMessage(newUserMessage, activeConvoId);
    }

    try {
      const response = await supabase.functions.invoke("veteran-claims-chat", {
        body: {
          messages: messages.filter(m => m.role !== 'assistant' || !m.quickReplies?.length || messages.indexOf(m) !== 0)
            .concat([newUserMessage])
            .map(m => ({ role: m.role, content: m.content })),
          systemPrompt: createSystemPrompt(notes, userName, profile)
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
      
      let updatedNotes = notes;
      if (note) {
        const exists = notes.some(n => n.category === note.category && n.value === note.value);
        if (!exists) {
          updatedNotes = [...notes, note];
          setNotes(updatedNotes);
        }
      }
      
      const defaultPrompts = QUICK_REPLY_TEMPLATES.navigation;
      const quickReplies = prompts.length > 0 ? prompts : defaultPrompts;
      const assistantMessage: Message = { role: "assistant", content: contentAfterPrompts, quickReplies };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message
      if (activeConvoId) {
        await saveMessage(assistantMessage, activeConvoId, updatedNotes);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError("Connection issue. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmitLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmittingLead(true);

    try {
      const allNotes = notes.map(n => `${n.category}: ${n.value}`).join("\n");

      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone || null,
          source: "claims-agent",
          notes: allNotes,
          status: "new"
        });

      if (error) throw error;

      toast.success("Thank you! A claims specialist will contact you within 24 hours.");
      setShowHandoffModal(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Great! I've connected you with our partner claims filing company. They'll reach out within 24 hours to help you file your claim. In the meantime, feel free to ask me any other questions.",
        quickReplies: ["What happens next?", "Tell me about evidence", "Calculate my compensation"]
      }]);
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const isEmptyChat = messages.length <= 1 && messages[0]?.role === 'assistant';

  if (isLoadingConversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <Helmet>
        <title>AI Claims Agent | Veterans Benefits Hub</title>
      </Helmet>

      {/* Header */}
      <header className="border-b bg-card flex-shrink-0 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/yourbenefits" className="text-sm text-muted-foreground hover:text-foreground">
              ← Benefits Home
            </Link>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCalculators(true)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculators
          </Button>
        </div>
      </header>

      {/* Calculators Modal */}
      <Dialog open={showCalculators} onOpenChange={setShowCalculators}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Benefit Calculators
            </DialogTitle>
            <DialogDescription>
              Estimate your military and federal benefits
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Link to="/yourbenefits/calculators/va-combined-rating" onClick={() => setShowCalculators(false)}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="text-left">
                  <p className="font-medium">VA Combined Rating</p>
                  <p className="text-xs text-muted-foreground">Calculate combined disability rating</p>
                </div>
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/va-compensation" onClick={() => setShowCalculators(false)}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="text-left">
                  <p className="font-medium">VA Compensation</p>
                  <p className="text-xs text-muted-foreground">Estimate monthly compensation</p>
                </div>
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/tsp" onClick={() => setShowCalculators(false)}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="text-left">
                  <p className="font-medium">TSP Calculator</p>
                  <p className="text-xs text-muted-foreground">Project retirement savings</p>
                </div>
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/military-buyback" onClick={() => setShowCalculators(false)}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="text-left">
                  <p className="font-medium">Military Buy-Back</p>
                  <p className="text-xs text-muted-foreground">Calculate service credit deposit</p>
                </div>
              </Button>
            </Link>
            <Link to="/yourbenefits/calculators/sick-leave" onClick={() => setShowCalculators(false)}>
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <div className="text-left">
                  <p className="font-medium">Sick Leave Credit</p>
                  <p className="text-xs text-muted-foreground">Convert leave to service time</p>
                </div>
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto px-4 py-6">
              {/* Welcome Header for empty chat */}
              {isEmptyChat && (
                <div className="text-center mb-8 pt-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
                    <MessageSquare className="w-8 h-8 text-orange-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    {userName ? `Hi ${userName}! How can I help?` : 'How can I help you today?'}
                  </h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    I'm your VA benefits guide. Ask me about claims, compensation, or use a calculator.
                  </p>
                </div>
              )}

              {/* Suggestion Cards for empty chat */}
              {isEmptyChat && (
                <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg mx-auto">
                  {SUGGESTION_PROMPTS.map((prompt) => (
                    <Card 
                      key={prompt.title}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                      onClick={() => handleSuggestionClick(prompt.title === "File a Claim" ? "Help me file a VA claim" : 
                        prompt.title === "Calculate Benefits" ? "Calculate my VA compensation" :
                        prompt.title === "Intent to File" ? "What is Intent to File?" : "Estimate my TSP growth")}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <prompt.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{prompt.title}</p>
                          <p className="text-xs text-muted-foreground">{prompt.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-6">
              {messages.map((message, index) => {
                // Hide initial welcome message when showing suggestion cards
                if (isEmptyChat && index === 0) return null;
                return (
                  <ClaimsChatMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                    quickReplies={message.quickReplies}
                    onQuickReply={(value) => sendMessage(value)}
                    isLatest={index === messages.length - 1}
                    isLoading={isLoading}
                  />
                );
              })}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
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
          </ScrollArea>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background p-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your benefits, claims, or calculations..."
                  disabled={isLoading}
                  className="pr-12 py-6 text-[15px] rounded-xl shadow-sm border-muted-foreground/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Press Enter to send • Your conversation is saved automatically
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block w-72 border-l bg-card/50 overflow-hidden">
          <ClaimsRightSidebar 
            notes={notes} 
            userName={userName}
            profile={profile}
          />
        </div>
      </div>

      {/* Mobile Notes Button */}
      <div className="xl:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed bottom-24 right-4 z-50 shadow-lg rounded-full"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Notes ({notes.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] p-0">
            <ClaimsRightSidebar 
              notes={notes} 
              userName={userName}
            />
          </SheetContent>
        </Sheet>
      </div>

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
