import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioRightSidebarProps {
  currentViewerCount: number;
  onAdSelect: (ad: any, type: string) => void;
  selectedAd: any;
  markers: any[];
  onAddMarker: (type: 'ad' | 'clip') => void;
  isRecording: boolean;
  selectedChannels: {
    myPage: boolean;
    facebook: boolean;
    linkedin: boolean;
    tiktok: boolean;
    twitch: boolean;
    youtube: boolean;
  };
  onToggleChannel: (channel: string) => void;
  channelsExpanded: boolean;
  onToggleChannelsExpanded: () => void;
  profileImageUrl?: string;
  sessionId?: string;
}

export function StudioRightSidebar({
  currentViewerCount,
  onAdSelect,
  selectedAd,
  markers,
  onAddMarker,
  isRecording,
  selectedChannels,
  onToggleChannel,
  channelsExpanded,
  onToggleChannelsExpanded,
  profileImageUrl,
  sessionId,
}: StudioRightSidebarProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const tools = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  const handlePanelChange = (toolId: string) => {
    setOpenPanel(openPanel === toolId ? null : toolId);
  };

  const handleToolClick = (toolId: string) => {
    setOpenPanel(openPanel === toolId ? null : toolId);
  };

  const renderPanelContent = () => {
    switch (openPanel) {
      case 'chat':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Live Chat</h3>
              <p className="text-xs text-muted-foreground">View and interact with live chat</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Dialog for panel content */}
      <Dialog open={!!openPanel} onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {tools.find(t => t.id === openPanel)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderPanelContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Icon Bar - Always Visible on the right */}
      <div className="flex h-full relative overflow-visible">
        <div className="w-full h-full border-l border-border/40 bg-gradient-to-b from-background via-background to-muted/20 flex flex-col items-center py-6 gap-1 relative z-[101]">
          <TooltipProvider delayDuration={100}>
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleToolClick(tool.id)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center w-[68px] h-[68px] rounded-xl transition-all duration-200",
                      openPanel === tool.id 
                        ? "bg-primary shadow-lg shadow-primary/20 scale-105" 
                        : "hover:bg-muted/60 hover:scale-105"
                    )}
                  >
                    <tool.icon className={cn(
                      "h-6 w-6 mb-1 transition-all duration-200",
                      openPanel === tool.id 
                        ? "text-primary-foreground scale-110" 
                        : "text-foreground/70 group-hover:text-foreground group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium leading-tight text-center px-1.5 transition-all duration-200",
                      openPanel === tool.id 
                        ? "text-primary-foreground font-semibold" 
                        : "text-foreground/60 group-hover:text-foreground"
                    )}>
                      {tool.label}
                    </span>
                    {openPanel === tool.id && (
                      <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-1 h-14 bg-primary rounded-l-full shadow-lg shadow-primary/30" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="left" 
                  className="bg-popover text-popover-foreground border-border shadow-xl px-4 py-2 text-sm font-medium"
                  sideOffset={10}
                >
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}
