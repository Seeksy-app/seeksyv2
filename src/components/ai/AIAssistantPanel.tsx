import { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { EMAIL_PERSONAS } from "@/lib/email-personas";

interface Message {
  role: "user" | "assistant";
  content: string;
  persona?: string;
}

export function AIAssistantPanel() {
  const { isOpen, close, context } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const routeContext = getRouteContext();
      const { data, error } = await supabase.functions.invoke("global-agent", {
        body: {
          message: input,
          context: {
            ...routeContext,
            additionalContext: context,
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        persona: data.persona,
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput("");
    }
  }, [isOpen]);

  const getPersonaInfo = (personaKey?: string) => {
    if (!personaKey) return null;
    const persona = EMAIL_PERSONAS[personaKey as keyof typeof EMAIL_PERSONAS];
    return persona;
  };

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Seeksy AI Assistant
          </SheetTitle>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm">Ask me anything! I'll route your request to the right expert.</p>
              <p className="text-xs mt-2">Try: "Schedule a meeting", "Draft an email", "Create a podcast episode"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const personaInfo = msg.persona ? getPersonaInfo(msg.persona) : null;
                const Icon = personaInfo?.icon;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        {Icon && <AvatarFallback className={personaInfo?.bgColor}>
                          <Icon className={`h-4 w-4 ${personaInfo?.color}`} />
                        </AvatarFallback>}
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2.5 max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {personaInfo && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {personaInfo.name}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2.5">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
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
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
