import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Headphones, Radio } from "lucide-react";

const StudioHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#053877]">
              Podcast Studio
            </h1>
            <p className="text-muted-foreground">
              Professional multitrack recording with AI-powered cleanup
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-[#053877]/10 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-[#053877]" />
                </div>
              </div>
              <div className="text-sm font-medium">Multitrack</div>
              <div className="text-xs text-muted-foreground">
                Separate audio tracks
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-[#053877]/10 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-[#053877]" />
                </div>
              </div>
              <div className="text-sm font-medium">AI Cleanup</div>
              <div className="text-xs text-muted-foreground">
                Professional quality
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-[#053877]/10 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-[#053877]" />
                </div>
              </div>
              <div className="text-sm font-medium">Studio Grade</div>
              <div className="text-xs text-muted-foreground">
                Broadcast ready
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/podcast-studio/mic-setup")}
            className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12 text-lg"
          >
            Start Recording
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StudioHome;
