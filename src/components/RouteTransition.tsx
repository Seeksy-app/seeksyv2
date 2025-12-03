import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Sparkles, Zap, Rocket, Wand2, Crown, TrendingUp, Target, ArrowRight } from "lucide-react";

const TRANSITION_MESSAGES = [
  { text: "Switching to your workspace...", icon: Sparkles, color: "text-purple-400" },
  { text: "Getting everything ready...", icon: Zap, color: "text-yellow-400" },
  { text: "Loading your dashboard...", icon: Rocket, color: "text-blue-400" },
  { text: "Preparing your space...", icon: Wand2, color: "text-pink-400" },
  { text: "Almost there...", icon: Target, color: "text-green-400" },
  { text: "Building excellence...", icon: Crown, color: "text-amber-400" },
  { text: "Powering up...", icon: TrendingUp, color: "text-cyan-400" },
  { text: "Loading brilliance...", icon: ArrowRight, color: "text-indigo-400" },
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
    
    // Short delay - just enough to prevent flicker without ghosting
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (isTransitioning) {
    const Icon = message.icon;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 animate-spin">
              <div className="h-20 w-20 rounded-full border-4 border-transparent border-t-primary/40 border-r-primary/20" />
            </div>
            {/* Middle pulsing circle */}
            <div className="absolute inset-0 animate-pulse">
              <div className="h-20 w-20 rounded-full bg-primary/5" />
            </div>
            {/* Inner icon with color */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              <Icon className={`h-10 w-10 ${message.color} animate-bounce`} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-foreground text-lg font-medium animate-fade-in">{message.text}</p>
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
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
