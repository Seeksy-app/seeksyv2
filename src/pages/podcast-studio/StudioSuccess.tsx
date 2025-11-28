import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Home, Mic } from "lucide-react";
import confetti from "canvas-confetti";

const StudioSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { episodeTitle } = location.state || {};

  useEffect(() => {
    // Confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#053877", "#2C6BED", "#4B9EFF"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#053877", "#2C6BED", "#4B9EFF"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#053877]">
              Episode Complete!
            </h2>
            <p className="text-muted-foreground">
              Your podcast episode has been successfully processed and saved
            </p>
          </div>

          {episodeTitle && (
            <div className="p-4 rounded-lg bg-[#053877]/5 border border-[#053877]/10">
              <div className="text-sm text-muted-foreground">Episode Title</div>
              <div className="font-semibold text-[#053877] mt-1">
                {episodeTitle}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigate("/podcast-studio")}
              variant="outline"
              className="flex-1 h-12"
            >
              <Mic className="w-4 h-4 mr-2" />
              Back to Studio Home
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudioSuccess;
