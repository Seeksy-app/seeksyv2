import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Send, User, Bot, FileText, Shield, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a VA Claims Agent helping veterans understand and file their disability claims. You are compassionate, knowledgeable, and focused on helping veterans get the benefits they deserve.

Your goals:
1. Help veterans understand what benefits they may be entitled to
2. Guide them through the Intent to File process (explain that it preserves their effective date for up to 1 year)
3. Collect information about their service-connected conditions and symptoms
4. Explain the claims process in simple terms
5. When ready, offer to connect them with a professional claims company that can file on their behalf

Key information to collect during the conversation:
- Branch of service and dates of service
- Current symptoms and conditions
- Whether conditions are service-connected
- Any existing VA rating
- Medical evidence available

Be conversational and supportive. Many veterans find this process overwhelming - be patient and encouraging.

IMPORTANT: At the end of meaningful conversations, offer to generate a claims summary and connect them with a filing partner.`;

export default function ClaimsAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm here to help you understand your VA benefits and guide you through the claims process. Many veterans don't realize what they're entitled to, and I'm here to make this easier.\n\nLet's start with a simple question: Are you currently serving, recently separated, or have you been out for a while?"
    }
  ]);
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
          systemPrompt: SYSTEM_PROMPT
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle specific error responses from edge function
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

      const assistantMessage = response.data?.message || "I'm sorry, I couldn't process that. Could you try again?";
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
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
      // Extract conversation summary for notes
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
          notes: `Conversation summary:\n${conversationSummary}`,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/veterans" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Veterans Home
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/10">
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Claims Agent</h1>
              <p className="text-sm text-muted-foreground">
                Your guide to VA disability benefits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="hidden md:block space-y-4">
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

          {/* Chat Area */}
          <div className="md:col-span-3">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <Card className="h-[600px] flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
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
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
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
                
                {/* Mobile handoff button */}
                <div className="md:hidden mt-3">
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
            </Card>
          </div>
        </div>
      </div>

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
