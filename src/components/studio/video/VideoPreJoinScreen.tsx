import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mic, MicOff, Video, VideoOff, Settings, 
  ChevronDown, Copy, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VideoPreJoinScreenProps {
  sessionTitle: string;
  hostName: string;
  hostAvatar?: string;
  onEnterStudio: (name: string, title: string) => void;
  onBack: () => void;
}

export function VideoPreJoinScreen({
  sessionTitle,
  hostName,
  hostAvatar,
  onEnterStudio,
  onBack,
}: VideoPreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [name, setName] = useState(hostName);
  const [title, setTitle] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error starting camera:", err);
      }
    }
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied!");
  };

  const handleEnter = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onEnterStudio(name, title);
  };

  return (
    <div className="h-screen bg-[#1a1d21] flex items-center justify-center p-8">
      <div className="w-full max-w-5xl flex gap-16 items-center">
        {/* Left Side - Session Info */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            {hostAvatar ? (
              <img 
                src={hostAvatar} 
                alt={hostName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-white font-bold">{hostName.charAt(0)}</span>
              </div>
            )}
            <div>
              <span className="text-white font-medium">{hostName}</span>
              <span className="text-white/50">, you're hosting this stream</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white">
            {sessionTitle}
          </h1>

          <Button
            variant="outline"
            onClick={handleCopyInviteLink}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <Users className="w-4 h-4" />
            Copy Invite Link
          </Button>
        </div>

        {/* Right Side - Ready to Join Card */}
        <div className="w-[420px] bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
            Ready to join?
          </h2>

          {/* Video Preview */}
          <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-orange-900/80 to-red-900/80 relative mb-4">
            {!isVideoOff && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{name.charAt(0)}</span>
                </div>
              </div>
            )}
            
            {/* Edit Button */}
            <button className="absolute top-1/2 right-4 -translate-y-1/2 px-3 py-1.5 bg-black/50 rounded-lg text-white text-xs font-medium hover:bg-black/70 transition-colors">
              EDIT
            </button>

            {/* Name/Title Overlay */}
            <div className="absolute bottom-3 left-3">
              <p className="text-white font-semibold text-sm">{name || "Your Name"}</p>
              {title && <p className="text-white/70 text-xs">{title}</p>}
            </div>
          </div>

          {/* Device Controls */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {/* Mic Toggle */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "h-10 w-10 rounded-full rounded-r-none",
                  isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-6 rounded-full rounded-l-none border-l border-white",
                  isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Camera Toggle */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={cn(
                  "h-10 w-10 rounded-full rounded-r-none",
                  isVideoOff ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-6 rounded-full rounded-l-none border-l border-white",
                  isVideoOff ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-100 text-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Name & Title Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 text-sm">Your name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-sm">Title <span className="text-gray-400">(optional)</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Host"
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Enter Studio Button */}
          <Button
            onClick={handleEnter}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base"
          >
            Enter Studio
          </Button>

          {/* Login Info */}
          <p className="text-center text-gray-500 text-sm mt-4">
            You're logged in as <span className="text-gray-700 font-medium">user@seeksy.io</span>.{" "}
            <button className="text-gray-700 underline hover:text-gray-900">Log out</button>
          </p>
        </div>
      </div>
    </div>
  );
}
