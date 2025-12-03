import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, MoreVertical, User, Users, 
  LayoutGrid, Monitor, Eye, GripVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SceneLayout = "host-only" | "host-guest" | "side-by-side" | "grid" | "speaker" | "screen-share";

export interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
  thumbnail?: string;
}

interface VideoStudioScenesResizableProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onAddScene: () => void;
  onSceneMenu: (sceneId: string) => void;
  onDeleteScene?: (sceneId: string) => void;
  onRenameScene?: (sceneId: string, name: string) => void;
}

const layoutIcons: Record<SceneLayout, typeof User> = {
  "host-only": User,
  "host-guest": Users,
  "side-by-side": LayoutGrid,
  "grid": LayoutGrid,
  "speaker": Eye,
  "screen-share": Monitor,
};

export function VideoStudioScenesResizable({
  scenes,
  activeSceneId,
  onSceneSelect,
  onAddScene,
  onSceneMenu,
  onDeleteScene,
  onRenameScene,
}: VideoStudioScenesResizableProps) {
  const [width, setWidth] = useState(200);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 160), 320);
      setWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div 
      className="bg-[#16181c] border-r border-white/10 flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-10",
          isResizing && "bg-blue-500"
        )}
      />

      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <Button
          variant="ghost"
          onClick={onAddScene}
          className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Plus className="w-4 h-4" />
          Add Scene
        </Button>
      </div>

      {/* Scene List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;
          const LayoutIcon = layoutIcons[scene.layout];

          return (
            <div
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                "group relative rounded-lg overflow-hidden cursor-pointer transition-all",
                isActive 
                  ? "ring-2 ring-blue-500" 
                  : "hover:ring-1 hover:ring-white/30"
              )}
            >
              {/* Scene Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                {/* Drag Handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white/40" />
                </div>

                {/* Layout Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <LayoutIcon className="w-8 h-8 text-white/30" />
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                )}

                {/* Menu Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-1 right-1 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-3 h-3 text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10"
                      onClick={() => onRenameScene?.(scene.id, scene.name)}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10"
                      onClick={() => onSceneMenu(scene.id)}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 hover:bg-white/10"
                      onClick={() => onDeleteScene?.(scene.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Scene Name */}
              <div className="p-2 bg-black/40">
                <p className="text-xs text-white truncate">{scene.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
