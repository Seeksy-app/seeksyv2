import { Button } from "@/components/ui/button";

interface QuickRepliesProps {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function ClaimsQuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option) => (
        <Button
          key={option}
          variant="outline"
          size="sm"
          className="rounded-full text-sm px-4 py-2 h-auto hover:bg-primary/10 hover:border-primary transition-colors"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

export const QUICK_REPLY_TEMPLATES = {
  yesNo: ["Yes", "No", "Not sure"],
  navigation: [
    "Explain Intent to File",
    "Help me understand my conditions",
    "What evidence do I need?",
    "Other question"
  ],
  symptoms: [
    "Back pain",
    "Hearing loss / Tinnitus",
    "PTSD / Mental health",
    "Joint pain",
    "Other condition"
  ],
  evidence: [
    "I have medical records",
    "I have buddy statements",
    "I need help gathering evidence",
    "What evidence do I need?"
  ],
  nextSteps: [
    "Yes, I can do this now",
    "I'll do this later",
    "I need more help",
    "Other"
  ]
};
