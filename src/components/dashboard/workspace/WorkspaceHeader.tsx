import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { PersonaType } from "@/config/personaConfig";

interface WorkspaceHeaderProps {
  firstName?: string;
  personaType?: PersonaType | null;
  onCustomize?: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
};

const getRoleLabel = (personaType?: PersonaType | null): string => {
  const labels: Record<PersonaType, string> = {
    podcaster: "Podcaster",
    influencer: "Creator",
    speaker: "Speaker",
    eventHost: "Event Host",
    entrepreneur: "Business Pro",
    agency: "Agency",
    brand: "Brand",
  };
  return personaType ? labels[personaType] || "Creator" : "Creator";
};

const getTimeBasedGradient = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "from-amber-500/10 via-orange-500/5 to-transparent";
  if (hour >= 12 && hour < 17) return "from-blue-500/10 via-cyan-500/5 to-transparent";
  if (hour >= 17 && hour < 21) return "from-purple-500/10 via-pink-500/5 to-transparent";
  return "from-indigo-500/10 via-violet-500/5 to-transparent";
};

export function WorkspaceHeader({ firstName, personaType, onCustomize }: WorkspaceHeaderProps) {
  const [greeting, setGreeting] = useState(getGreeting());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const gradientClass = useMemo(() => getTimeBasedGradient(), []);
  const roleLabel = getRoleLabel(personaType);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl p-6 mb-6 overflow-hidden bg-gradient-to-r ${gradientClass}`}
    >
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground mb-1"
          >
            {greeting}, {firstName || "there"}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-bold text-foreground"
          >
            Your Seeksy Workspace
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1"
          >
            {roleLabel} Dashboard • Everything you need in one place
          </motion.p>
        </div>

        {onCustomize && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCustomize}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4 mr-1" />
            Customize
          </Button>
        )}
      </div>
    </motion.div>
  );
}
