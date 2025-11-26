import { useParams } from "react-router-dom";
import { StudioRightSidebar } from "@/components/studio/StudioRightSidebar";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { useState } from "react";

const MeetingStudio = () => {
  const { id } = useParams();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Grid */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg opacity-75">Meeting Studio</p>
              <p className="text-sm opacity-50 mt-2">Meeting ID: {id}</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-20 bg-zinc-900 border-t border-border/40 flex items-center justify-center gap-4 px-6">
          <Button
            variant={isMicOn ? "default" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80">
        <StudioRightSidebar
          currentViewerCount={2}
          onAdSelect={() => {}}
          selectedAd={null}
          markers={[]}
          onAddMarker={() => {}}
          isRecording={true}
          selectedChannels={{
            myPage: false,
            facebook: false,
            linkedin: false,
            tiktok: false,
            twitch: false,
            youtube: false,
          }}
          onToggleChannel={() => {}}
          channelsExpanded={false}
          onToggleChannelsExpanded={() => {}}
          meetingId={id}
          showAINotes={true}
        />
      </div>
    </div>
  );
};

export default MeetingStudio;