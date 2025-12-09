import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Sparkles, Zap, Rocket, Wand2, Crown, TrendingUp, Target, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const STUCK_TIMEOUT_MS = 8000; // 8 seconds before showing "stuck" message

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const [message, setMessage] = useState(TRANSITION_MESSAGES[0]);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(location.pathname);

  // Clear all timers helper
  const clearTimers = () => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    if (stuckTimer.current) {
      clearTimeout(stuckTimer.current);
      stuckTimer.current = null;
    }
  };

  useEffect(() => {
    // Log route changes for debugging
    console.log('[RouteTransition] Route change:', prevPathRef.current, '→', location.pathname);
    prevPathRef.current = location.pathname;

    // Skip transition animation for board routes - they should load instantly
    const isBoardRoute = location.pathname.startsWith('/board');
    if (isBoardRoute) {
      setIsTransitioning(false);
      setIsStuck(false);
      return;
    }

    // Clear any existing timers first
    clearTimers();
    
    // Reset stuck state on new navigation
    setIsStuck(false);
    
    // Show loading state immediately on location change
    setIsTransitioning(true);
    
    // Pick a random message
    const randomMessage = TRANSITION_MESSAGES[Math.floor(Math.random() * TRANSITION_MESSAGES.length)];
    setMessage(randomMessage);
    
    // Short delay - just enough to prevent flicker without ghosting
    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);

    // Fallback timeout - if still transitioning after 8s, show stuck message
    stuckTimer.current = setTimeout(() => {
      console.error('[RouteTransition] Page stuck loading for', STUCK_TIMEOUT_MS, 'ms on route:', location.pathname);
      setIsStuck(true);
      setIsTransitioning(false);
    }, STUCK_TIMEOUT_MS);
    
    return () => clearTimers();
  }, [location.pathname, location.search]);

  // Clear stuck timer when transition completes normally
  useEffect(() => {
    if (!isTransitioning && stuckTimer.current) {
      clearTimeout(stuckTimer.current);
      stuckTimer.current = null;
    }
  }, [isTransitioning]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Show stuck/error state
  if (isStuck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-background via-background to-destructive/5 animate-fade-in">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-destructive/70" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground">
              The page is taking longer than expected to load. This might be a temporary issue.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleGoBack}>
              ← Go Back
            </Button>
            <Button onClick={handleReload}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
