import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyPageSection } from "@/lib/mypage/sectionTypes";
import { 
  Play, 
  Radio, 
  Calendar, 
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";

interface PublicSectionRendererProps {
  sections: MyPageSection[];
  username: string;
}

function FeaturedVideoSection({ section }: { section: MyPageSection }) {
  const { data: video } = useQuery({
    queryKey: ["video", section.config.videoId],
    queryFn: async () => {
      if (!section.config.videoId) return null;
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", section.config.videoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.videoId,
  });

  if (!video) return null;

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-card/80 border-border/50">
      <div className="relative aspect-video bg-muted">
        {video.file_url && (
          <video
            src={video.file_url}
            poster={video.file_url}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button size="lg" className="rounded-full w-16 h-16">
            <Play className="w-8 h-8" />
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">
          {section.config.videoTitle || video.file_name}
        </h3>
        {section.config.videoDescription && (
          <p className="text-muted-foreground mb-4">{section.config.videoDescription}</p>
        )}
        {section.config.ctaUrl && (
          <Button asChild>
            <a href={section.config.ctaUrl} target="_blank" rel="noopener noreferrer">
              {section.config.ctaText || "Watch Now"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StreamChannelSection({ section, username }: { section: MyPageSection; username: string }) {
  // Check if user is live - placeholder for now
  const isLive = false;

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Radio className="w-6 h-6" />
          <h3 className="text-xl font-semibold">Stream Channel</h3>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>

        {isLive ? (
          <div>
            <p className="text-muted-foreground mb-4">
              {username} is live right now!
            </p>
            <Button className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Join Stream
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">
              Not live right now. Check back soon or watch a recent replay.
            </p>
            {section.config.showPastStreams && (
              <Button variant="outline" className="w-full">
                View Recent Streams
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SocialLinksSection({ section }: { section: MyPageSection }) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'x': return <span className="text-lg font-bold">𝕏</span>;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getPlatformLabel = (link: any) => {
    if (link.platform === 'custom' && link.label) return link.label;
    return link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
  };

  if (!section.config.links || section.config.links.length === 0) return null;

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Connect with me</h3>
        <div className="grid grid-cols-2 gap-3">
          {section.config.links.map((link, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start"
              asChild
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {getPlatformIcon(link.platform)}
                <span className="ml-2">{getPlatformLabel(link)}</span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingsSection({ section }: { section: MyPageSection }) {
  const { data: meeting } = useQuery({
    queryKey: ["meeting", section.config.meetingTypeId],
    queryFn: async () => {
      if (!section.config.meetingTypeId) return null;
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", section.config.meetingTypeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.meetingTypeId,
  });

  const bookingUrl = section.config.meetingTypeId 
    ? `/meetings/${section.config.meetingTypeId}/book`
    : section.config.externalUrl;

  if (!bookingUrl) return null;

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6" />
          <h3 className="text-xl font-semibold">
            {section.config.title || meeting?.title || "Book a Meeting"}
          </h3>
        </div>
        
        {section.config.description && (
          <p className="text-muted-foreground mb-4">{section.config.description}</p>
        )}

        <Button className="w-full" asChild>
          <a href={bookingUrl} target={section.config.externalUrl ? "_blank" : undefined} rel="noopener noreferrer">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Time
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function PublicSectionRenderer({ sections, username }: PublicSectionRendererProps) {
  const enabledSections = sections
    .filter(s => s.is_enabled)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {enabledSections.map((section) => {
        switch (section.section_type) {
          case 'featured_video':
            return <FeaturedVideoSection key={section.id} section={section} />;
          case 'stream_channel':
            return <StreamChannelSection key={section.id} section={section} username={username} />;
          case 'social_links':
            return <SocialLinksSection key={section.id} section={section} />;
          case 'meetings':
            return <MeetingsSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
