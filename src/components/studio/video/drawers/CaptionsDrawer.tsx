import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Plus, ChevronDown, ChevronRight, 
  Gauge, Info, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LowerThird {
  id: string;
  name: string;
  title?: string;
}

interface Ticker {
  id: string;
  text: string;
}

const mockLowerThirds: LowerThird[] = [
  { id: "1", name: "#behooves you" },
  { id: "2", name: "Army National Guard" },
  { id: "3", name: "Air National Guard, Tech Sgt." },
  { id: "4", name: "Greg Bernard", title: "On-Air Personality" },
];

const mockTickers: Ticker[] = [
  { id: "1", text: "@Paradedeck @TommysFigz @dupreegod @HIM" },
  { id: "2", text: "ParadeDeck.com" },
  { id: "3", text: "#AnimeNYC #ParadeDeck #SideStage1 #HIM" },
];

export function CaptionsDrawer({ isOpen, onClose }: CaptionsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["lowerthird", "ticker"]);
  const [activeLowerThird, setActiveLowerThird] = useState<string | null>(null);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const [newLowerThird, setNewLowerThird] = useState("");
  const [newTicker, setNewTicker] = useState("");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Captions</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Lower Third Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => toggleSection("lowerthird")}
                className="flex items-center gap-2"
              >
                {expandedSections.includes("lowerthird") ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
                <span className="text-white font-medium">Lower Third</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 gap-1">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            
            {expandedSections.includes("lowerthird") && (
              <div className="space-y-2">
                {mockLowerThirds.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveLowerThird(activeLowerThird === item.id ? null : item.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                      activeLowerThird === item.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-white/30" />
                    <div>
                      <div className="text-white font-medium">{item.name}</div>
                      {item.title && (
                        <div className="text-white/60 text-sm">{item.title}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticker Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => toggleSection("ticker")}
                className="flex items-center gap-2"
              >
                {expandedSections.includes("ticker") ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
                <span className="text-white font-medium">Ticker</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1 h-8">
                  <Gauge className="w-4 h-4" />
                  Speed
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 gap-1 h-8">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
            
            {expandedSections.includes("ticker") && (
              <div className="space-y-2">
                {mockTickers.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTicker(activeTicker === item.id ? null : item.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      activeTicker === item.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className="text-white text-sm">{item.text}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
