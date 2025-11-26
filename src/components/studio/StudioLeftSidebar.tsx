import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User, Users2, Clock } from "lucide-react";
import { Scene } from "./StudioScenes";
import { cn } from "@/lib/utils";

interface StudioLeftSidebarProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneChange: (sceneId: string) => void;
  onAddScene: () => void;
  cameraEnabled: boolean;
  profileImageUrl: string;
}

export function StudioLeftSidebar({
  scenes,
  activeSceneId,
  onSceneChange,
  onAddScene,
  cameraEnabled,
  profileImageUrl,
}: StudioLeftSidebarProps) {
  const getSceneIcon = (layout: string) => {
    switch (layout) {
      case 'single-speaker':
        return <User className="h-4 w-4" />;
      case 'both-speakers':
        return <Users2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full border-r border-border/50 bg-background/50 backdrop-blur-sm flex flex-col h-full">
      <ScrollArea className="flex-1 p-2">
        <div className="text-center py-8 text-sm text-muted-foreground">
          Scenes removed
        </div>
      </ScrollArea>
    </div>
  );
}
