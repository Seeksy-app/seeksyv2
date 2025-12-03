import { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Sparkles, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { useQuery } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_STARTERS = [
  "Summarize what I should focus on this week",
  "Help me design my Seeksy workspace for my role",
  "Plan a content + meetings funnel around my next event",
  "Explain how to use the Studio and AI Clips",
  "Show me how to start earning with Monetization",
];

export function AIAssistantPanel() {
  const { isOpen, close } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Get user's first name
  const { data: profile } = useQuery({
    queryKey: ["user-profile-spark"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("account_full_name")
        .eq("id", user.id)
        .single();
      return data;
    },
  });

  const firstName = profile?.account_full_name?.split(" ")[0] || "there";

  const welcomeMessage = `Hi ${firstName} — I'm Spark, your Seeksy AI assistant.\n\nI can help you plan events, design your workspace, generate content ideas, and break down your data into simple action steps.\n\nWhat would you like to work on today?`;

  // Detect context from route
  const getRouteContext = () => {
    const path = location.pathname;
    if (path.includes("/meeting")) return { route: path, module: "meetings" };
    if (path.includes("/event")) return { route: path, module: "events" };
    if (path.includes("/podcast")) return { route: path, module: "podcasts" };
    if (path.includes("/studio")) return { route: path, module: "studio" };
    if (path.includes("/email") || path.includes("/campaign")) return { route: path, module: "email" };
    if (path.includes("/contact")) return { route: path, module: "contacts" };
    if (path.includes("/clips") || path.includes("/media")) return { route: path, module: "media" };
    if (path.includes("/identity")) return { route: path, module: "identity" };
    if (path.includes("/analytics")) return { route: path, module: "analytics" };
    return { route: path, module: "general" };
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowStarters(false);

    try {
      const routeContext = getRouteContext();
      const { data, error } = await supabase.functions.invoke("global-agent", {
        body: {
          message: text,
          context: routeContext,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.text || "I'm here to help!",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get AI response",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStarterClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setShowStarters(true);
    setInput("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, close]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent 
        side="right" 
        className="w-[480px] sm:max-w-[480px] p-0 flex flex-col bg-background"
        onInteractOutside={close}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b bg-gradient-to-r from-[hsl(45,100%,97%)] to-[hsl(217,100%,97%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[hsl(45,90%,92%)] shadow-sm">
                <SparkIcon variant="holiday" size={32} animated />
              </div>
              <div>
                <SheetTitle className="flex items-center gap-2 text-lg">
                  Ask Spark
                  <Badge variant="secondary" className="text-xs bg-[hsl(45,90%,88%)] text-[hsl(45,90%,30%)] border-0">
                    ✨ AI Assistant
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-0.5">
                  Your Seeksy AI co-pilot for meetings, media, and growth.
                </SheetDescription>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              <RefreshCw className="h-3 w-3" />
              Start new conversation
            </button>
          )}
        </SheetHeader>

        {/* Chat Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="flex gap-3">
                <div className="shrink-0">
                  <SparkIcon variant="holiday" size={28} pose="waving" />
                </div>
                <div className="bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                    {welcomeMessage}
                  </p>
                </div>
              </div>

              {/* Quick Starters */}
              {showStarters && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-muted-foreground px-1">Quick starters:</p>
                  <div className="flex flex-col gap-2">
                    {QUICK_STARTERS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStarterClick(prompt)}
                        disabled={loading}
                        className="text-left text-sm px-4 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-[hsl(217,100%,97%)] hover:border-[hsl(217,80%,80%)] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1">
                      <SparkIcon variant="holiday" size={24} pose="idle" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <SparkIcon variant="holiday" size={24} pose="typing" animated />
                  </div>
                  <div className="bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[hsl(45,90%,45%)]" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 rounded-xl border-border/60 focus-visible:ring-[hsl(45,90%,50%)]"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !input.trim()}
              className="rounded-xl bg-[hsl(45,90%,50%)] hover:bg-[hsl(45,90%,45%)] text-[hsl(45,90%,15%)]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> to close
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
