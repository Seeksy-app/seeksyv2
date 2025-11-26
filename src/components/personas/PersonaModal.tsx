import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, X } from "lucide-react";

interface PersonaModalProps {
  open: boolean;
  onClose: () => void;
  persona: {
    name: string;
    role: string;
    tagline?: string;
    description: string;
    videoUrl: string;
    tags?: Array<{ icon: string; label: string }>;
  } | null;
}

export const PersonaModal = ({ open, onClose, persona }: PersonaModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.play();
    } else if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  if (!persona) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Section - Left */}
          <div className="relative lg:w-1/2 aspect-video lg:aspect-auto bg-black">
            <video
              ref={videoRef}
              src={persona.videoUrl}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
            />
            
            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 left-4 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Info Section - Right */}
          <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-2">
                  {persona.name}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {persona.role}
                </p>
              </div>

              {persona.tagline && (
                <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                  {persona.tagline}
                </p>
              )}

              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed text-base">
                  {persona.description}
                </p>
              </div>

              {/* Tags */}
              {persona.tags && persona.tags.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {persona.name.split(" ")[0]}'s style
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2"
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-6">
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                >
                  Work with {persona.name.split(" ")[0]}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
