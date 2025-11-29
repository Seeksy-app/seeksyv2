/**
 * Seeksy Santa Surprise Modal
 * Interactive holiday pop-up with quick actions
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SparkAvatar } from "./SparkAvatar";
import { Film, Image, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SeeksySantaSurpriseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SeeksySantaSurprise = ({
  open,
  onOpenChange,
}: SeeksySantaSurpriseProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAction = (action: string) => {
    switch (action) {
      case "clips":
        navigate("/media-library?tab=clips");
        toast({
          title: "🎄 Holiday Clips",
          description: "Generate festive clips from your recordings",
        });
        break;
      case "banners":
        navigate("/media-library");
        toast({
          title: "🎅 Holiday Banners",
          description: "Create holiday-themed banners and graphics",
        });
        break;
      case "blog":
        navigate("/blog");
        toast({
          title: "✨ Holiday Blog",
          description: "Generate a festive blog post with AI",
        });
        break;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <SparkAvatar pose="happy" size={100} animated />
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl px-2">
            🎄 Seeksy Santa Surprise! 🎅
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base px-4">
            Create magical holiday content with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            onClick={() => handleAction("clips")}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <Film className="h-5 w-5 text-primary" />
            <div className="text-left flex-1">
              <div className="font-semibold">Holiday Clips</div>
              <div className="text-xs text-muted-foreground">
                Generate festive video clips
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </Button>

          <Button
            onClick={() => handleAction("banners")}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <Image className="h-5 w-5 text-primary" />
            <div className="text-left flex-1">
              <div className="font-semibold">Holiday Banners</div>
              <div className="text-xs text-muted-foreground">
                Create festive graphics & thumbnails
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </Button>

          <Button
            onClick={() => handleAction("blog")}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left flex-1">
              <div className="font-semibold">Holiday Blog Post</div>
              <div className="text-xs text-muted-foreground">
                AI-generated festive content
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Happy Holidays from the Seeksy Team! 🎁
        </div>
      </DialogContent>
    </Dialog>
  );
};
