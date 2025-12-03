import { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, RefreshCw, Mic, Video, Calendar, Users, DollarSign, Layout, Zap, FileText, Target, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { useQuery } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// NEW 10 QUICK STARTERS from spec
const QUICK_STARTERS = [
  { text: "Give me my weekly focus", icon: Target },
  { text: "Help me design my Seeksy workspace", icon: Layout },
  { text: "Plan a content funnel around my next event", icon: Calendar },
  { text: "Generate 5 clip ideas from my last recording", icon: Video },
  { text: "Help me create my podcast setup checklist", icon: Mic },
  { text: "Show me how to grow my audience this month", icon: Users },
  { text: "Help me set up Monetization", icon: DollarSign },
  { text: "Draft a post promoting my next episode", icon: FileText },
  { text: "Help me organize my contacts", icon: Users },
  { text: "Analyze my last meeting + next steps", icon: BarChart3 },
];

// Action button parser - detects ➡️ patterns and creates clickable buttons
const ACTION_ROUTES: Record<string, string> = {
  "open studio": "/studio",
  "open audio settings": "/studio/audio",
  "open ai clips": "/studio/clips",
  "create clip": "/studio/clips",
  "go to monetization": "/monetization",
  "open monetization": "/monetization",
  "connect social platforms": "/integrations",
  "open meetings": "/meetings",
  "create meeting": "/meetings/types",
  "open my page": "/profile/edit",
  "edit my page": "/profile/edit",
  "open media library": "/media",
  "open contacts": "/contacts",
  "open events": "/events",
  "create event": "/events/create",
  "open podcasts": "/podcasts",
  "open identity": "/identity",
  "verify face": "/identity",
  "verify voice": "/identity",
  "open dashboard": "/dashboard",
  "open settings": "/settings",
  "open analytics": "/social-analytics",
};

export function AIAssistantPanel() {
  const { isOpen, close } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

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

  // NEW WELCOME MESSAGE from spec
  const welcomeMessage = `Hi ${firstName} — I'm Spark, your Seeksy AI copilot.

I help you run your workspace: record in the Studio, create clips, plan events, manage contacts, design your page, and grow your influence.

**Here's what I can help you with right now:**`;

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
      console.error("Spark error:", error);
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

  // Parse action buttons from response
  const handleActionClick = (actionText: string) => {
    const normalizedAction = actionText.toLowerCase().trim();
    for (const [key, route] of Object.entries(ACTION_ROUTES)) {
      if (normalizedAction.includes(key)) {
        close();
        navigate(route);
        return;
      }
    }
  };

  // Render message with action buttons
  const renderMessage = (content: string) => {
    // Find ➡️ patterns and make them clickable
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.includes("➡️")) {
        const actionMatch = line.match(/➡️\s*(.+)/);
        if (actionMatch) {
          const actionText = actionMatch[1].trim();
          return (
            <div key={idx} className="my-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleActionClick(actionText)}
                className="text-sm font-medium bg-[hsl(217,100%,97%)] hover:bg-[hsl(217,100%,94%)] border-[hsl(217,80%,85%)] text-[hsl(217,80%,35%)]"
              >
                <Zap className="h-3.5 w-3.5 mr-2" />
                {actionText}
              </Button>
            </div>
          );
        }
      }
      // Bold section headers (lines starting with emoji or **text**)
      if (line.match(/^(🎙️|🎥|✂️|📊|✨|\*\*)/)) {
        return (
          <p key={idx} className="font-semibold text-foreground mt-3 mb-1">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      // Regular bullet points
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <p key={idx} className="text-muted-foreground ml-2">
            {line}
          </p>
        );
      }
      return <p key={idx}>{line}</p>;
    });
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
        className="w-[520px] sm:max-w-[520px] p-0 flex flex-col bg-background"
        onInteractOutside={close}
      >
        {/* Header - Larger and more premium */}
        <SheetHeader className="px-6 py-6 border-b bg-gradient-to-r from-[hsl(45,100%,97%)] to-[hsl(217,100%,97%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[hsl(45,90%,90%)] shadow-md">
                <SparkIcon variant="holiday" size={40} animated />
              </div>
              <div>
                <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
                  Ask Spark
                  <Badge variant="secondary" className="text-xs bg-[hsl(45,90%,85%)] text-[hsl(45,90%,25%)] border-0 px-2 py-0.5">
                    ✨ AI Copilot
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-1">
                  Your personal productivity engine for Seeksy
                </SheetDescription>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Start new conversation
            </button>
          )}
        </SheetHeader>

        {/* Chat Area - Larger padding and text */}
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <SparkIcon variant="holiday" size={32} pose="waving" />
                </div>
                <div className="bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <div className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {welcomeMessage.split("\n").map((line, idx) => {
                      if (line.startsWith("**")) {
                        return <p key={idx} className="font-semibold mt-3">{line.replace(/\*\*/g, "")}</p>;
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Starters - Larger and with icons */}
              {showStarters && (
                <div className="space-y-3 mt-6">
                  <p className="text-sm font-semibold text-foreground px-1">Quick starters:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_STARTERS.slice(0, 5).map((starter, idx) => {
                      const Icon = starter.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleStarterClick(starter.text)}
                          disabled={loading}
                          className="flex items-center gap-3 text-left text-[15px] px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-[hsl(217,100%,97%)] hover:border-[hsl(217,80%,80%)] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                          <Icon className="h-4 w-4 text-[hsl(217,80%,55%)] shrink-0" />
                          <span>{starter.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1">
                      <SparkIcon variant="holiday" size={28} pose="idle" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-4 max-w-[85%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-tl-sm"
                    }`}
                  >
                    <div className="text-[15px] leading-relaxed">
                      {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <SparkIcon variant="holiday" size={28} pose="typing" animated />
                  </div>
                  <div className="bg-[hsl(45,100%,97%)] border border-[hsl(45,90%,85%)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-[hsl(45,90%,45%)]" />
                      <span className="text-[15px] text-muted-foreground">Spark is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Larger */}
        <div className="border-t p-5 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Spark anything..."
              disabled={loading}
              className="flex-1 h-12 text-[15px] rounded-xl border-border/60 focus-visible:ring-[hsl(45,90%,50%)]"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-[hsl(45,90%,50%)] hover:bg-[hsl(45,90%,45%)] text-[hsl(45,90%,15%)]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Press <kbd className="px-2 py-1 rounded bg-muted text-xs font-medium">Esc</kbd> to close
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
