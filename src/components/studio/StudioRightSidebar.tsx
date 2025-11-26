import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Sparkles, MessageSquare } from "lucide-react";
import AIMeetingNotesPanel from "./AIMeetingNotesPanel";

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
  meetingId?: string;
  showAINotes?: boolean;
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
  meetingId,
  showAINotes = true,
}: StudioRightSidebarProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; avatar?: string }>>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');
  const [aiNotesVisible, setAiNotesVisible] = useState(showAINotes);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: "You",
      text: message,
      avatar: profileImageUrl
    }]);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock participants for demo
  const participants = [
    { id: '1', name: 'ANDY GUO (Host, me)', avatar: profileImageUrl, isHost: true },
    { id: '2', name: 'IAHR Secretariat', avatar: '', isHost: false },
  ];

  return (
    <div className="flex flex-col h-full border-l border-border/40 bg-background">
      {/* Participants Section */}
      <div className="border-b border-border/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Participants ({participants.length})</span>
        </div>
        <ScrollArea className="max-h-32">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{participant.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chat')}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          {meetingId && (
            <Button
              variant={activeTab === 'ai' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('ai');
                setAiNotesVisible(true);
              }}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Notes
            </Button>
          )}
        </div>
        
        {activeTab === 'chat' ? (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {msg.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium mb-1">{msg.sender}</div>
                        <div className="text-sm break-words">{msg.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border/40">
              <div className="flex gap-2">
                <Input
                  placeholder="Type message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={!message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 relative">
            {meetingId && aiNotesVisible && (
              <AIMeetingNotesPanel
                meetingId={meetingId}
                isVisible={aiNotesVisible}
                onClose={() => {
                  setAiNotesVisible(false);
                  setActiveTab('chat');
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
