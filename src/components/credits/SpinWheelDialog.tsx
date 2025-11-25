import { useState } from "react";
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
import { Sparkles } from "lucide-react";

interface SpinWheelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpinComplete: () => void;
}

export function SpinWheelDialog({ open, onOpenChange, onSpinComplete }: SpinWheelDialogProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ creditsWon: number; prizeLabel: string } | null>(null);

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
      });
      toast.success(`Congratulations! You won ${data.creditsWon} credits!`, {
        description: data.prizeLabel,
      });
      setTimeout(() => {
        onSpinComplete();
        setResult(null);
      }, 3000);
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
            <Sparkles className="h-5 w-5 text-primary" />
            Spin the Wheel!
          </DialogTitle>
          <DialogDescription>
            You've earned a free spin! Click the button to see what you win.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Simple wheel representation */}
          <div
            className={`relative w-48 h-48 rounded-full border-8 border-primary bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${
              isSpinning ? "animate-spin" : ""
            }`}
          >
            <div className="text-4xl font-bold text-primary">
              {result ? result.creditsWon : "?"}
            </div>
          </div>

          {result ? (
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                You won {result.creditsWon} credits!
              </div>
              <div className="text-muted-foreground">{result.prizeLabel}</div>
            </div>
          ) : (
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              size="lg"
              className="w-full"
            >
              {isSpinning ? "Spinning..." : "Spin Now!"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}