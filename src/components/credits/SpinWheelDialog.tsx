import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

interface SpinWheelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpinComplete: () => void;
  isWelcomeSpin?: boolean;
}

export function SpinWheelDialog({ open, onOpenChange, onSpinComplete, isWelcomeSpin = false }: SpinWheelDialogProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ creditsWon: number; prizeLabel: string; isWelcomeSpin?: boolean } | null>(null);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("spin-wheel", {
        body: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResult({
        creditsWon: data.creditsWon,
        prizeLabel: data.prizeLabel,
        isWelcomeSpin: data.isWelcomeSpin,
      });
      
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          particleCount: 2,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#9B59B6'],
        });
      }, 50);
      
      toast.success(`🎉 Congratulations! You won ${data.creditsWon} credits!`, {
        description: data.prizeLabel,
        duration: 5000,
      });
      
      setTimeout(() => {
        onSpinComplete();
        setResult(null);
        
        // Redirect to credits page after welcome spin
        if (data.isWelcomeSpin) {
          setTimeout(() => {
            window.location.href = '/credits';
          }, 500);
        }
      }, 5000);
    },
    onError: (error: Error) => {
      toast.error("Failed to spin", {
        description: error.message,
      });
      onOpenChange(false);
    },
    onSettled: () => {
      setIsSpinning(false);
    },
  });

  const handleSpin = () => {
    setIsSpinning(true);
    spinMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWelcomeSpin ? (
              <>
                <PartyPopper className="h-5 w-5 text-primary" />
                Welcome to Seeksy! 🎉
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Spin the Wheel!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isWelcomeSpin 
              ? "As a welcome gift, spin the wheel to win 5-20 free credits!"
              : "You've earned a free spin! Click the button to see what you win."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Animated wheel representation */}
          <div
            className={`relative w-48 h-48 rounded-full border-8 border-primary bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-all duration-500 ${
              isSpinning ? "animate-spin" : ""
            } ${result ? "scale-110 shadow-2xl shadow-primary/50" : ""}`}
            style={{
              animationDuration: isSpinning ? "0.5s" : undefined,
            }}
          >
            <div className={`text-4xl font-bold text-primary transition-all duration-300 ${
              result ? "scale-150" : ""
            }`}>
              {result ? result.creditsWon : "?"}
            </div>
            
            {/* Sparkle effects when result shows */}
            {result && (
              <>
                <Sparkles className="absolute top-4 left-4 h-6 w-6 text-yellow-500 animate-pulse" />
                <Sparkles className="absolute bottom-4 right-4 h-6 w-6 text-pink-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Sparkles className="absolute top-4 right-4 h-6 w-6 text-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </>
            )}
          </div>

          {result ? (
            <div className="text-center space-y-2 animate-fade-in">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                🎉 You won {result.creditsWon} credits! 🎉
              </div>
              <div className="text-lg text-muted-foreground">{result.prizeLabel}</div>
              {result.isWelcomeSpin && (
                <div className="text-sm text-primary font-semibold mt-2">
                  Welcome bonus unlocked! Redirecting to purchase more...
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            >
              {isSpinning ? "Spinning..." : isWelcomeSpin ? "Claim Your Welcome Gift!" : "Spin Now!"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}