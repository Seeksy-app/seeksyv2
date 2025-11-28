import { Smartphone, Tablet, Monitor, Eye, Edit3 } from "lucide-react";
import { MyPageTheme } from "@/config/myPageThemes";
import { Button } from "@/components/ui/button";
import { MyPagePreview } from "../public/MyPagePreview";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  theme: MyPageTheme;
  device: "mobile" | "tablet" | "desktop";
  onDeviceChange: (device: "mobile" | "tablet" | "desktop") => void;
  mode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
}

export function PreviewPane({ theme, device, onDeviceChange, mode, onModeChange }: PreviewPaneProps) {
  const deviceSizes = {
    mobile: { width: "375px", height: "667px" },
    tablet: { width: "768px", height: "1024px" },
    desktop: { width: "100%", height: "100%" },
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-muted/30 to-muted/10">
      {/* Preview Controls */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={device === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("mobile")}
            className="gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </Button>
          <Button
            variant={device === "tablet" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("tablet")}
            className="gap-2"
          >
            <Tablet className="w-4 h-4" />
            Tablet
          </Button>
          <Button
            variant={device === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("desktop")}
            className="gap-2"
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("edit")}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("preview")}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Device Preview */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className={cn(
            "transition-all duration-300",
            device === "desktop" 
              ? "w-full h-full overflow-auto" 
              : "rounded-3xl shadow-2xl border-8 border-gray-900 flex flex-col"
          )}
          style={device !== "desktop" ? {
            width: deviceSizes[device].width,
            height: deviceSizes[device].height,
          } : undefined}
        >
          <div className="bg-white flex-1 overflow-auto">
            <MyPagePreview theme={theme} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}
