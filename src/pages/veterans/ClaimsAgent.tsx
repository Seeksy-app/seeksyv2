import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Send, User, Bot, FileText, Shield, Loader2, ExternalLink, AlertCircle, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClaimsIntakeFlow } from "@/components/veterans/ClaimsIntakeFlow";
import { ClaimsNotesPanel, ClaimsNote } from "@/components/veterans/ClaimsNotesPanel";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IntakeData {
  status: string;
  branch: string;
  goal: string;
}

const GOAL_MESSAGES: Record<string, string> = {
  intent_to_file: "filing an Intent to File",
  first_claim: "filing your first VA claim",
  increase: "filing for an increase",
  secondary: "filing for a secondary condition",
  appeal: "appealing a decision",
  unsure: "understanding your options",
};

const createSystemPrompt = (intakeData: IntakeData, notes: ClaimsNote[]) => {
  const notesContext = notes.length > 0 
    ? `\n\nCurrent collected information:\n${notes.map(n => `- ${n.category}: ${n.value}`).join('\n')}`
    : '';
    
  return `You are a VA Claims Agent helping veterans understand and file their disability claims. You are compassionate, knowledgeable, and focused on helping veterans get the benefits they deserve.

The veteran has completed intake with the following information:
- Status: ${intakeData.status}
- Branch of Service: ${intakeData.branch}
- Goal: ${intakeData.goal}
${notesContext}

Your goals:
1. Help veterans understand what benefits they may be entitled to
2. Guide them through the Intent to File process (explain that it preserves their effective date for up to 1 year)
3. Collect information about their service-connected conditions and symptoms
4. Explain the claims process in simple terms
5. When ready, offer to connect them with a professional claims company that can file on their behalf

As you collect information, identify and remember key details like:
- Years served / separation year
- Claimed issues / symptoms
- Evidence already available (medical records, buddy statements, etc.)
- Existing VA rating if any

IMPORTANT: After EVERY user response, include a JSON block at the END of your message (after your conversational response) in this exact format to extract key information for their summary notes:
<notes>
{"category": "Category Name", "value": "Extracted value"}
</notes>

Only include the notes block if there's meaningful information to extract. Categories can include:
- Years of Service
- Separation Year
- Claimed Conditions
- Current Symptoms
- Available Evidence
- Existing VA Rating
- Medical History
- Service Connection

Be conversational and supportive. Many veterans find this process overwhelming - be patient and encouraging.

IMPORTANT: At the end of meaningful conversations, offer to generate a claims summary and connect them with a filing partner.`;
};

const SAMPLE_INTAKE: IntakeData = {
  status: "veteran",
  branch: "army",
  goal: "first_claim",
};

const SAMPLE_NOTES: ClaimsNote[] = [
  { category: "Years of Service", value: "8 years (2012-2020)" },
  { category: "Separation Year", value: "2020" },
  { category: "Claimed Conditions", value: "Tinnitus, lower back pain, knee injury" },
  { category: "Current Symptoms", value: "Constant ringing in ears, chronic back pain, difficulty walking" },
  { category: "Available Evidence", value: "Service medical records, private doctor diagnosis" },
  { category: "Existing VA Rating", value: "None - first time filing" },
];

const SAMPLE_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Great, thank you for that information! I can see you're interested in filing your first VA claim. I'll guide you step by step through this process.\n\nLet's talk about the symptoms or conditions you'd like to claim. What health issues or symptoms have you experienced that you believe are connected to your military service?"
  },
  {
    role: "user",
    content: "I have constant ringing in my ears from being around artillery. My back hurts all the time from carrying heavy gear, and my right knee is messed up from a training injury."
  },
  {
    role: "assistant",
    content: "Thank you for sharing that. Those are all very common service-connected conditions:\n\n1. **Tinnitus** - Ringing in the ears from noise exposure is one of the most commonly claimed conditions\n2. **Lower back pain** - Often caused by carrying heavy equipment, rucksacks, and body armor\n3. **Knee injury** - Training injuries are well-documented service connections\n\nDo you have any medical records or documentation for these conditions? This could include:\n- Service treatment records\n- VA medical records\n- Private doctor visits\n- Buddy statements from fellow service members"
  },
  {
    role: "user", 
    content: "I have my service medical records that show the knee injury. I also went to a private doctor last year who diagnosed the tinnitus and back problems."
  },
  {
    role: "assistant",
    content: "Excellent! Having both service medical records AND private doctor documentation significantly strengthens your claim. Here's what I recommend:\n\n**For Tinnitus:**\n- Your private diagnosis is great evidence\n- A nexus letter connecting it to your military noise exposure would help\n\n**For Back Pain:**\n- The private diagnosis helps establish current disability\n- Any documentation of heavy lifting or gear carrying in service is useful\n\n**For Knee Injury:**\n- Your service treatment records showing the injury are perfect\n- This establishes a clear service connection\n\nWould you like me to connect you with a claims filing partner who can help you organize this evidence and file your claim? They can also help you file an Intent to File right away to preserve your effective date."
  },
];

export default function ClaimsAgent() {
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<ClaimsNote[]>([]);
  const [showingSample, setShowingSample] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleIntakeComplete = (data: IntakeData) => {
    setIntakeData(data);
    setIntakeComplete(true);
    setCurrentStep(2);
    setShowingSample(false);
    
    const goalMessage = GOAL_MESSAGES[data.goal] || "understanding your benefits";
    setMessages([
      {
        role: "assistant",
        content: `Great, thank you for that information! I can see you're interested in ${goalMessage}. I'll guide you step by step through this process.\n\nLet's talk about the symptoms or conditions you'd like to claim. What health issues or symptoms have you experienced that you believe are connected to your military service?`
      }
    ]);
  };

  const handleShowSample = () => {
    setShowingSample(true);
    setIntakeComplete(true);
    setIntakeData(SAMPLE_INTAKE);
    setMessages(SAMPLE_MESSAGES);
    setNotes(SAMPLE_NOTES);
    setCurrentStep(3);
  };

  const handleExitSample = () => {
    setShowingSample(false);
    setIntakeComplete(false);
    setIntakeData(null);
    setMessages([]);
    setNotes([]);
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !intakeData) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("veteran-claims-chat", {
        body: {
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
          ],
          systemPrompt: createSystemPrompt(intakeData, notes)
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

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

      const rawMessage = response.data?.message || "I'm sorry, I couldn't process that. Could you try again?";
      const { cleanContent, note } = extractNotes(rawMessage);
      
      if (note) {
        setNotes(prev => [...prev, note]);
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: cleanContent }]);
      
      // Update step based on conversation progress
      if (notes.length >= 2 && currentStep === 2) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError("Connection issue. Please check your internet and try again.");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting right now. Please try again in a moment, or if this continues, you can reach out to us directly." 
      }]);
    } finally {
      setIsLoading(false);
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
          `Goal: ${intakeData.goal}`,
        ] : []),
        ...notes.map(n => `${n.category}: ${n.value}`),
      ].join("\n");

      const conversationSummary = messages
        .map(m => `${m.role}: ${m.content.substring(0, 200)}...`)
        .join("\n\n");

      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone || null,
          source: "claims-agent-mvp",
          notes: `Summary Notes:\n${allNotes}\n\nConversation:\n${conversationSummary}`,
          status: "new"
        });

      if (error) throw error;

      toast.success("Thank you! A claims specialist will contact you within 24 hours.");
      setShowHandoffModal(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Great! I've connected you with our partner claims filing company. They'll reach out within 24 hours to help you file your claim. In the meantime, feel free to ask me any other questions about your benefits."
      }]);
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to submit. Please try again or contact us directly.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card flex-shrink-0">
        <div className="px-4 py-3">
          {/* Breadcrumb */}
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
                <p className="text-xs text-muted-foreground">
                  Your guide to VA disability benefits
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            {intakeComplete && (
              <div className="hidden md:flex items-center gap-1 text-xs">
                <span className={`px-2 py-1 rounded ${currentStep >= 1 ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  Step 1: Intake
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className={`px-2 py-1 rounded ${currentStep >= 2 ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                  Step 2: Conditions
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className={`px-2 py-1 rounded ${currentStep >= 3 ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                  Step 3: Filing Options
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Results Banner */}
      {showingSample && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Viewing Sample Results</span>
            <span className="text-orange-600">— This is an example of how the Claims Agent works</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleExitSample}>
            Start Your Own Session
          </Button>
        </div>
      )}

      {/* Main Content - Full Screen 3-Column Layout */}
      {!intakeComplete ? (
        <div className="flex-1 overflow-auto">
          <ClaimsIntakeFlow onComplete={handleIntakeComplete} onShowSample={handleShowSample} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - What We'll Cover */}
          <div className="hidden lg:block w-[280px] border-r bg-card flex-shrink-0 overflow-auto">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    What We'll Cover
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-muted-foreground">• Understanding your benefits</p>
                  <p className="text-muted-foreground">• Intent to File explained</p>
                  <p className="text-muted-foreground">• Service-connected conditions</p>
                  <p className="text-muted-foreground">• Evidence gathering</p>
                  <p className="text-muted-foreground">• Filing options</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ready to File?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-3">
                    Connect with a professional claims filing partner.
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowHandoffModal(true)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Send to Partner
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center - Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {error && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-auto p-4"
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar - Sticky at bottom */}
            <div className="border-t bg-card p-4 flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
              {/* Mobile actions */}
              <div className="lg:hidden mt-3 max-w-3xl mx-auto">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowHandoffModal(true)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect with Filing Partner
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Notes Panel (Desktop) */}
          <div className="hidden lg:block w-[300px] border-l bg-card flex-shrink-0 overflow-hidden">
            <div className="h-full p-4">
              <ClaimsNotesPanel notes={notes} intakeData={intakeData || undefined} />
            </div>
          </div>
          
          {/* Mobile Notes Panel */}
          <div className="lg:hidden">
            <ClaimsNotesPanel notes={notes} intakeData={intakeData || undefined} isMobile />
          </div>
        </div>
      )}

      {/* Lead Handoff Modal */}
      <Dialog open={showHandoffModal} onOpenChange={setShowHandoffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with a Claims Specialist</DialogTitle>
            <DialogDescription>
              Enter your contact information and a professional claims filing partner will reach out within 24 hours to help you file your VA disability claim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name"
                value={leadForm.name}
                onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone"
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
              disabled={isSubmittingLead}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingLead ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
