import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: {
    name: string;
    role: string;
    tagline: string;
    description: string;
    video_url: string;
  } | null;
}

export const PersonaModal = ({ isOpen, onClose, persona }: PersonaModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(console.error);
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isOpen]);

  if (!persona) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Video Side */}
          <div className="relative aspect-[3/4] md:aspect-auto bg-gradient-to-br from-primary/5 to-secondary/5">
            <video
              ref={videoRef}
              src={persona.video_url}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Side */}
          <div className="p-8 flex flex-col justify-center space-y-6 bg-card">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {persona.role}
              </p>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold">{persona.name}</DialogTitle>
              </DialogHeader>
              <p className="text-lg text-muted-foreground">{persona.tagline}</p>
            </div>

            <div className="prose prose-sm dark:prose-invert">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                {persona.description}
              </p>
            </div>

            <Button onClick={onClose} size="lg" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};