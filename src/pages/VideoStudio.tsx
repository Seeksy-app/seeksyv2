import { useSearchParams } from "react-router-dom";
import { ScenesPanel } from "@/components/studio/video/ScenesPanel";
import { RecordingStatusHeader } from "@/components/studio/video/RecordingStatusHeader";
import { GuestInvitePanel } from "@/components/studio/video/GuestInvitePanel";
import { StudioSettingsDrawer } from "@/components/studio/video/StudioSettingsDrawer";
import { Button } from "@/components/ui/button";
import { Video, Square, Mic, MicOff } from "lucide-react";

export default function VideoStudio() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "interview";
  const isSoloMode = mode === "solo";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Video className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">
                  {isSoloMode ? "Solo Video Recording" : "Video Podcast Studio"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSoloMode ? "Record yourself with professional tools" : "Record with remote guests"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RecordingStatusHeader />
              <StudioSettingsDrawer />
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Scenes */}
        <div className="w-64 flex-shrink-0">
          <ScenesPanel />
        </div>

        {/* Center - Video Preview */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Video Canvas */}
          <div className="flex-1 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            <div className="relative text-center space-y-4">
              <Video className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-lg font-medium text-muted-foreground">Video Preview</p>
                <p className="text-sm text-muted-foreground/70">
                  {isSoloMode ? "Your camera will appear here" : "Host and guest cameras will appear here"}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon">
                <Mic className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
                <Square className="w-5 h-5 fill-current" />
                Start Recording
              </Button>
              <Button variant="outline" size="icon">
                <MicOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Guest Invite (only in interview mode) */}
        {!isSoloMode && (
          <div className="w-80 flex-shrink-0">
            <GuestInvitePanel />
          </div>
        )}
      </div>
    </div>
  );
}
