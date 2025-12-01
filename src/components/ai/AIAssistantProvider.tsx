import { createContext, useContext, useState, ReactNode } from "react";

interface AIAssistantContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  context?: string;
  setContext: (context: string) => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<string>("");

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <AIAssistantContext.Provider value={{ isOpen, open, close, toggle, context, setContext }}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (ctx === undefined) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return ctx;
}
