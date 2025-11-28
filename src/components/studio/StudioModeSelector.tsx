import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Video, User, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudioModeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudioModeSelector = ({ open, onOpenChange }: StudioModeSelectorProps) => {
  const navigate = useNavigate();

  const modes = [
    {
      id: "audio",
      title: "Audio Podcast Recording",
      description: "Record audio-only podcast episodes with professional tools",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
      action: () => {
        navigate("/podcasts");
        onOpenChange(false);
      },
    },
    {
      id: "video-interview",
      title: "Video Podcast (with Guests)",
      description: "Record video podcasts with remote guests and multi-camera layouts",
      icon: Video,
      color: "from-blue-500 to-blue-600",
      action: () => {
        navigate("/studio/video?mode=interview");
        onOpenChange(false);
      },
    },
    {
      id: "solo-video",
      title: "Solo Video Recording",
      description: "Record yourself with professional video tools",
      icon: User,
      color: "from-green-500 to-green-600",
      action: () => {
        navigate("/studio/video?mode=solo");
        onOpenChange(false);
      },
    },
    {
      id: "live",
      title: "Go Live",
      description: "Broadcast live to multiple platforms simultaneously",
      icon: Radio,
      color: "from-red-500 to-red-600",
      action: () => {
        navigate("/studio/live");
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Choose Studio Mode
          </DialogTitle>
          <DialogDescription className="text-base">
            Select the type of content you want to create
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={mode.action}
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl rounded-lg p-6 text-left bg-card hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <mode.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {mode.title}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
