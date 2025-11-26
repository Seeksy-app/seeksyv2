import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Sparkles, Zap, Rocket } from "lucide-react";

const TRANSITION_MESSAGES = [
  { text: "Switching views...", icon: Sparkles },
  { text: "Getting things ready...", icon: Zap },
  { text: "Almost there...", icon: Rocket },
  { text: "Loading your workspace...", icon: Sparkles },
];

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [message, setMessage] = useState(TRANSITION_MESSAGES[0]);

  useEffect(() => {
    // Show loading state immediately on location change
    setIsTransitioning(true);
    
    // Pick a random message
    const randomMessage = TRANSITION_MESSAGES[Math.floor(Math.random() * TRANSITION_MESSAGES.length)];
    setMessage(randomMessage);
    
    // Longer delay for smooth transition with visible feedback
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (isTransitioning) {
    const Icon = message.icon;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Icon className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">{message.text}</p>
        </div>
      </div>
    );
  }

  // Use location.pathname as key to force complete remount of children
  // Wrap in page-container for fade-in animation
  return (
    <div key={location.pathname + location.search} className="page-container min-h-screen bg-background">
      {children}
    </div>
  );
}
