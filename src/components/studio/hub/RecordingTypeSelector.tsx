import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mic, Video, Radio, AudioWaveform } from "lucide-react";

interface RecordingTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recordingTypes = [
  {
    id: "audio-podcast",
    title: "Audio Podcast",
    description: "Waveform-only recording. Perfect for podcasts without video.",
    icon: Mic,
    color: "bg-purple-500",
    features: ["No camera required", "AI audio cleanup", "Auto chapters", "Host-read markers"],
    path: "/studio/audio-premium",
  },
  {
    id: "video-podcast",
    title: "Video Podcast",
    description: "Multi-guest video recording with PiP and layouts.",
    icon: Video,
    color: "bg-blue-500",
    features: ["Guest video frames", "Background blur", "Auto vertical clips", "Scene switching"],
    path: "/studio/video-premium",
  },
  {
    id: "video-studio",
    title: "Video Studio",
    description: "Solo video recording for YouTube, courses, and content.",
    icon: Radio,
    color: "bg-emerald-500",
    features: ["Teleprompter", "Scene presets", "Script support", "Gesture cues"],
    path: "/studio/creator-studio",
  },
  {
    id: "voice-studio",
    title: "Voice Studio",
    description: "Create voiceovers, intros, and ads with real-time waveform.",
    icon: AudioWaveform,
    color: "bg-amber-500",
    features: ["AI script generation", "Auto-leveling", "Real-time waveform", "Export to library"],
    path: "/studio/voice-studio",
  },
];

export function RecordingTypeSelector({ open, onOpenChange }: RecordingTypeSelectorProps) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Choose Recording Type</DialogTitle>
          <DialogDescription>Select the studio mode that fits your content</DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {recordingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelect(type.path)}
                className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.features.map((feature) => (
                        <span 
                          key={feature} 
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
