/**
 * Holiday Welcome Modal
 * Shows on first login when Holiday Mode is enabled
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HolidayWelcomeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenHolidayWelcome = localStorage.getItem("holiday_welcome_seen");
    
    if (!hasSeenHolidayWelcome) {
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleBegin = () => {
    localStorage.setItem("holiday_welcome_seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-w-[90vw]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32">
              <img 
                src="/spark/holiday/spark-santa-waving.png" 
                alt="Seeksy Santa"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl px-2">
            Welcome to Seeksy! 🚀
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2 px-4">
            You're about to build your presence. Spark can help you set up your My Page, link your podcast, and launch your newsletter!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center pt-4 px-4">
          <Button onClick={handleBegin} size="lg" className="gap-2 w-full sm:w-auto">
            Let's Begin
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
