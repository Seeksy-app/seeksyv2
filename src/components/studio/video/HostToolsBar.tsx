import { Button } from "@/components/ui/button";
import { FileText, Scissors, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface HostToolsBarProps {
  activeDrawer: "script" | "clip" | "ad" | null;
  onOpenScript: () => void;
  onAddClipMarker: () => void;
  onAddAdMarker: () => void;
}

export function HostToolsBar({
  activeDrawer,
  onOpenScript,
  onAddClipMarker,
  onAddAdMarker,
}: HostToolsBarProps) {
  return (
    <div className="absolute bottom-24 right-4 flex items-center gap-2 z-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenScript}
        className={cn(
          "h-10 px-4 rounded-lg gap-2 transition-all",
          activeDrawer === "script"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-white/10 text-white hover:bg-white/20"
        )}
      >
        <FileText className="w-4 h-4" />
        Host Script
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddClipMarker}
        className="h-10 px-4 rounded-lg gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30"
      >
        <Scissors className="w-4 h-4" />
        Clip Marker
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddAdMarker}
        className="h-10 px-4 rounded-lg gap-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
      >
        <Tag className="w-4 h-4" />
        Ad Marker
      </Button>
    </div>
  );
}
