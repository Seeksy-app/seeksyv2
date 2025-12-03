import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Youtube, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Channel {
  id: string;
  name: string;
  platform: "youtube" | "instagram" | "facebook" | "twitch" | "rtmp" | "x";
  subtitle: string;
  icon: string;
  enabled: boolean;
  visibility?: "public" | "private";
}

const mockChannels: Channel[] = [
  {
    id: "1",
    name: "Military Influencer Conference",
    platform: "youtube",
    subtitle: "Live with Restream, December 02",
    icon: "MIC",
    enabled: false,
    visibility: "public"
  },
  {
    id: "2",
    name: "Parade Deck Live Stream",
    platform: "rtmp",
    subtitle: "Channel doesn't support custom titles.",
    icon: "PD",
    enabled: false,
  },
  {
    id: "3",
    name: "paradedeck",
    platform: "instagram",
    subtitle: "Go to Instagram to edit title.",
    icon: "P",
    enabled: false,
  },
  {
    id: "4",
    name: "paradedeck",
    platform: "x",
    subtitle: "Live with Restream, December 02",
    icon: "P",
    enabled: false,
  },
];

export function ChannelsModal({ isOpen, onClose }: ChannelsModalProps) {
  const [channels, setChannels] = useState(mockChannels);
  const [activeTab, setActiveTab] = useState("your");

  const toggleChannel = (id: string) => {
    setChannels(prev => 
      prev.map(ch => 
        ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
  };

  const activeCount = channels.filter(ch => ch.enabled).length;

  const getPlatformIcon = (platform: Channel["platform"]) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "instagram":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case "x":
        return <span className="text-xs font-bold">𝕏</span>;
      default:
        return <span className="text-[10px] font-bold">RTMP</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white p-0">
        <DialogHeader className="p-6 pb-4 text-center">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add channels
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Choose destinations and customize stream details.
          </p>
        </DialogHeader>

        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="your">Your Channels</TabsTrigger>
              <TabsTrigger value="paired">Paired Channels</TabsTrigger>
            </TabsList>

            <TabsContent value="your" className="space-y-4">
              {/* Status Bar */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{activeCount} of {channels.length} active.</span>
                  <button className="text-blue-500 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    Update Titles
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Toggle all</span>
                  <button className="font-medium text-gray-900">OFF</button>
                  <span className="text-gray-300">|</span>
                  <button className="font-medium text-gray-500">ON</button>
                </div>
              </div>

              {/* Channel List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    {/* Channel Icon */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {channel.icon}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded bg-white shadow flex items-center justify-center">
                        {getPlatformIcon(channel.platform)}
                      </div>
                    </div>

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{channel.name}</span>
                        {channel.visibility === "public" && (
                          <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] text-gray-600">Public</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{channel.subtitle}</p>
                    </div>

                    {/* Actions */}
                    <button className="text-blue-500 text-sm font-medium">Edit</button>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paired">
              <div className="py-8 text-center text-gray-500">
                No paired channels yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Channels Button */}
        <div className="p-6 pt-4">
          <Button
            variant="outline"
            className="w-full h-12 border-blue-200 text-blue-500 font-medium gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Channels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
