import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles, ArrowRight, Coins } from "lucide-react";
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
  crm: [
    "Import my email list and segment by interest...",
    "Tag contacts who attended my last event...",
    "Find my most engaged subscribers...",
  ],
  email: [
    "Send a welcome sequence to new subscribers...",
    "Draft a newsletter announcing my new course...",
    "Reply to sponsor inquiries in my inbox...",
  ],
  newsletter: [
    "Create a weekly digest for my audience...",
    "Set up automated welcome emails...",
    "Design a premium newsletter template...",
  ],
};

const moduleChips = [
  { key: "crm", label: "CRM" },
  { key: "email", label: "Email" },
  { key: "newsletter", label: "Newsletter" },
];

export function InteractiveDemo() {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const currentPrompt = rotatingStatements[currentPromptIndex];

  // Typewriter effect
  useEffect(() => {
    if (isPaused) return;

    if (isTyping) {
      if (displayText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, 30); // Fast typing speed
        return () => clearTimeout(timeout);
      } else {
        // Pause at end, then move to next
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      // Move to next prompt
      const nextIndex = (currentPromptIndex + 1) % rotatingStatements.length;
      setCurrentPromptIndex(nextIndex);
      setDisplayText("");
      setIsTyping(true);
    }
  }, [displayText, currentPrompt, isTyping, currentPromptIndex, isPaused]);

  const handleModuleClick = (moduleKey: string) => {
    const prompts = modulePrompts[moduleKey];
    if (prompts && prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setIsPaused(true);
      setDisplayText("");
      setIsTyping(true);
      
      // Type out the new prompt
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < randomPrompt.length) {
          setDisplayText(randomPrompt.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          // Resume auto-rotation after 4 seconds
          setTimeout(() => {
            setIsPaused(false);
            setDisplayText("");
            setIsTyping(true);
          }, 4000);
        }
      }, 30);
    }
  };

  const handleNewSuggestion = () => {
    setIsPaused(false);
    const nextIndex = (currentPromptIndex + 1) % rotatingStatements.length;
    setCurrentPromptIndex(nextIndex);
    setDisplayText("");
    setIsTyping(true);
  };

  return (
    <section className="w-full px-4 py-16 md:py-24" style={{ background: "hsl(var(--background))" }}>
      <div className="mx-auto max-w-[900px]">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[24px] p-8 md:p-10"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 20px 60px -15px hsl(var(--foreground)/0.06)",
          }}
        >
          {/* Typewriter Prompt Display */}
          <div className="min-h-[80px] md:min-h-[100px] mb-8">
            <p
              className="text-2xl md:text-3xl font-medium leading-relaxed"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {displayText}
              <span
                className="inline-block w-[2px] h-[1em] ml-1 align-middle animate-pulse"
                style={{ background: "hsl(var(--primary))" }}
              />
            </p>
          </div>

          {/* Module Chips Row */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span 
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Click a module for more ideas:
            </span>
            {moduleChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => handleModuleClick(chip.key)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-md"
                style={{
                  background: "transparent",
                  border: "1.5px solid hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div 
            className="w-full h-px mb-6"
            style={{ background: "hsl(var(--border))" }}
          />

          {/* Bottom Row - CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-5 h-11 text-sm font-medium"
              onClick={handleNewSuggestion}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              New Suggestion
            </Button>
            <Button
              size="lg"
              className="rounded-full px-6 h-11 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try it now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Credits Text */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Coins className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p 
            className="text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Pay only for what you use • Start free with 100 credits
          </p>
        </div>
      </div>
    </section>
  );
}
