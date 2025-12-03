import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Plus, ChevronDown, ChevronRight, 
  Upload, Palette, Info 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GraphicsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockLogos = [
  { id: "1", name: "Seeksy", url: "/placeholder.svg" },
  { id: "2", name: "Brand", url: "/placeholder.svg" },
];

const mockOverlays = [
  { id: "1", name: "Please stay tuned", thumbnail: "/placeholder.svg" },
  { id: "2", name: "Time to get some chow!", thumbnail: "/placeholder.svg" },
  { id: "3", name: "Live streaming will start shortly", thumbnail: "/placeholder.svg" },
];

const mockBackgrounds = [
  { id: "1", name: "Blue Gradient", thumbnail: "/placeholder.svg" },
  { id: "2", name: "Concert Lights", thumbnail: "/placeholder.svg" },
];

export function GraphicsDrawer({ isOpen, onClose }: GraphicsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["logo", "overlay", "background"]);
  const [activeItems, setActiveItems] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleItem = (id: string) => {
    setActiveItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Graphics</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
            <Palette className="w-4 h-4 mr-2" />
            Edit Theme
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Logo Section */}
          <div>
            <button
              onClick={() => toggleSection("logo")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("logo") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Logo</span>
              <Info className="w-3.5 h-3.5 text-white/40" />
            </button>
            
            {expandedSections.includes("logo") && (
              <div className="grid grid-cols-4 gap-2">
                {mockLogos.map(logo => (
                  <button
                    key={logo.id}
                    onClick={() => toggleItem(`logo-${logo.id}`)}
                    className={cn(
                      "aspect-square rounded-lg border-2 p-2 transition-all",
                      activeItems.includes(`logo-${logo.id}`)
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                  </button>
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Overlay Section */}
          <div>
            <button
              onClick={() => toggleSection("overlay")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("overlay") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Overlay</span>
              <Info className="w-3.5 h-3.5 text-white/40" />
            </button>
            
            {expandedSections.includes("overlay") && (
              <div className="grid grid-cols-3 gap-2">
                {mockOverlays.map(overlay => (
                  <button
                    key={overlay.id}
                    onClick={() => toggleItem(`overlay-${overlay.id}`)}
                    className={cn(
                      "aspect-video rounded-lg border-2 overflow-hidden transition-all",
                      activeItems.includes(`overlay-${overlay.id}`)
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                      <span className="text-[10px] text-white/80 text-center px-1">{overlay.name}</span>
                    </div>
                  </button>
                ))}
                <button className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Video Clips Section */}
          <div>
            <button
              onClick={() => toggleSection("clips")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("clips") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Video clips</span>
              <Info className="w-3.5 h-3.5 text-white/40" />
            </button>
            
            {expandedSections.includes("clips") && (
              <div className="grid grid-cols-3 gap-2">
                <button className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Background Section */}
          <div>
            <button
              onClick={() => toggleSection("background")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("background") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">Background</span>
              <Info className="w-3.5 h-3.5 text-white/40" />
            </button>
            
            {expandedSections.includes("background") && (
              <div className="grid grid-cols-3 gap-2">
                {mockBackgrounds.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => toggleItem(`bg-${bg.id}`)}
                    className={cn(
                      "aspect-video rounded-lg border-2 overflow-hidden transition-all",
                      activeItems.includes(`bg-${bg.id}`)
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900" />
                  </button>
                ))}
                <button className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
