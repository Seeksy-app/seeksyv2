import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rotatingStatements = [
  "Send my podcast guest an invite and schedule a recording...",
  "Create clips from my latest episode and post to social...",
  "Build a landing page for my upcoming live event...",
  "Track my audience growth and send a newsletter update...",
  "Set up a CRM to manage my brand partnerships...",
];

// Module-specific prompts for clickable chips
const modulePrompts: Record<string, string[]> = {
  studio: [
    "Record a solo episode with AI teleprompter...",
    "Start a live recording session with 3 guests...",
    "Edit my raw footage with AI noise reduction...",
  ],
  clips: [
    "Generate 5 vertical clips from my latest podcast...",
    "Add captions and animations to my best moment...",
    "Schedule clips to post across all platforms...",
  ],
  email: [
    "Send a welcome sequence to new subscribers...",
    "Draft a newsletter announcing my new course...",
    "Reply to sponsor inquiries in my inbox...",
  ],
  crm: [
    "Import my email list and segment by interest...",
    "Tag contacts who attended my last event...",
    "Find my most engaged subscribers...",
  ],
  events: [
    "Create a virtual workshop with ticket sales...",
    "Send reminders to registered attendees...",
    "Set up a hybrid in-person and streaming event...",
  ],
  newsletter: [
    "Create a weekly digest for my audience...",
    "Set up automated welcome emails...",
    "Design a premium newsletter template...",
  ],
};

const moduleChips = [
  { key: "studio", label: "Studio", color: "#1A1A1A" },
  { key: "clips", label: "Clips", color: "#C4CFC0" },
  { key: "email", label: "Email", color: "#B8C9DC" },
  { key: "crm", label: "CRM", color: "#D4C4A8" },
  { key: "events", label: "Events", color: "#E8D5CB" },
  { key: "newsletter", label: "Newsletter", color: "#DDD8CC" },
];

export function InteractiveDemo() {
  const navigate = useNavigate();
  const [currentPrompt, setCurrentPrompt] = useState(rotatingStatements[0]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isManualSelect, setIsManualSelect] = useState(false);

  const cyclePrompt = useCallback(() => {
    if (isManualSelect) return;
    setIsTyping(true);
    setTimeout(() => {
      const nextIndex = (promptIndex + 1) % rotatingStatements.length;
      setPromptIndex(nextIndex);
      setCurrentPrompt(rotatingStatements[nextIndex]);
      setIsTyping(false);
    }, 100);
  }, [promptIndex, isManualSelect]);

  // Auto-rotate every 2 seconds (faster)
  useEffect(() => {
    if (isManualSelect) return;
    const interval = setInterval(cyclePrompt, 2000);
    return () => clearInterval(interval);
  }, [cyclePrompt, isManualSelect]);

  // Resume auto-rotation after 5 seconds of inactivity
  useEffect(() => {
    if (!isManualSelect) return;
    const timeout = setTimeout(() => {
      setIsManualSelect(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isManualSelect, currentPrompt]);

  const handleModuleClick = (moduleKey: string) => {
    const prompts = modulePrompts[moduleKey];
    if (prompts && prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setIsManualSelect(true);
      setIsTyping(true);
      setTimeout(() => {
        setCurrentPrompt(randomPrompt);
        setIsTyping(false);
      }, 100);
    }
  };

  const handleShuffle = () => {
    setIsManualSelect(true);
    setIsTyping(true);
    setTimeout(() => {
      const nextIndex = (promptIndex + 1) % rotatingStatements.length;
      setPromptIndex(nextIndex);
      setCurrentPrompt(rotatingStatements[nextIndex]);
      setIsTyping(false);
    }, 100);
  };

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        {/* Headline */}
        <div className="text-center mb-10">
          <h2 
            className="font-extrabold tracking-[-0.5px] mb-4"
            style={{ 
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "hsl(var(--foreground))",
            }}
          >
            Tell Seeksy what you want to do.
          </h2>
          <p 
            className="text-lg"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            We'll suggest the right tools for your workflow.
          </p>
        </div>

        {/* Big Interactive Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-[1000px] rounded-[28px] p-8 md:p-12"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 20px 60px -15px hsl(var(--foreground)/0.08)",
          }}
        >
          {/* Prompt Display */}
          <div className="mb-8">
            <label 
              className="block text-sm font-medium mb-3"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Describe your goal
            </label>
            <div 
              className="w-full min-h-[80px] p-5 rounded-2xl text-lg cursor-pointer transition-all duration-200 hover:shadow-md"
              style={{
                background: "hsl(var(--background))",
                border: "2px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              onClick={handleShuffle}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPrompt}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: isTyping ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="block"
                >
                  {currentPrompt}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Module Chips - Clickable */}
          <div className="mb-8">
            <p 
              className="text-sm mb-4"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Click a module for ideas, or generate a suggested setup
            </p>
            <div className="flex flex-wrap gap-2">
              {moduleChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleModuleClick(chip.key)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
                  style={{
                    background: chip.color,
                    color: chip.color === "#1A1A1A" ? "#FFFFFF" : "#0B0F1A",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try it now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base font-semibold"
              onClick={() => navigate("/auth")}
            >
              Build my workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-6 h-12 text-base"
              onClick={handleShuffle}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
