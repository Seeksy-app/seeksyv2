import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MyPageSection, SectionConfig, SECTION_TYPE_INFO } from "@/lib/mypage/sectionTypes";
import { Trash2, Plus, X } from "lucide-react";

interface SectionConfigDrawerProps {
  section: MyPageSection | null;
  onClose: () => void;
  userId: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'x', label: 'X (Twitter)', icon: '🐦' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'custom', label: 'Custom Link', icon: '🔗' },
];

export function SectionConfigDrawer({ section, onClose, userId }: SectionConfigDrawerProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SectionConfig>({});
  const [videos, setVideos] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (section) {
      setConfig(section.config || {});
      loadData();
    }
  }, [section?.id]);

  const loadData = async () => {
    if (!section) return;

    if (section.section_type === "featured_video") {
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url")
        .eq("user_id", userId)
        .eq("file_type", "video");
      setVideos(data || []);
    }

    if (section.section_type === "meetings") {
      const { data } = await supabase
        .from("meetings")
        .select("id, title")
        .eq("host_id", userId);
      setMeetings(data || []);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!section) return;
      
      const { error } = await supabase
        .from("my_page_sections")
        .update({ config: config as any })
        .eq("id", section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section updated");
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!section) return;
      
      const { error } = await supabase
        .from("my_page_sections")
        .delete()
        .eq("id", section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section deleted");
      onClose();
    },
  });

  if (!section) return null;

  const sectionInfo = SECTION_TYPE_INFO[section.section_type];

  const addSocialLink = () => {
    const links = config.links || [];
    setConfig({
      ...config,
      links: [...links, { platform: 'custom' as const, url: '', label: '' }],
    });
  };

  const removeSocialLink = (index: number) => {
    const links = [...(config.links || [])];
    links.splice(index, 1);
    setConfig({ ...config, links });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const links = [...(config.links || [])];
    links[index] = { ...links[index], [field]: value };
    setConfig({ ...config, links });
  };

  return (
    <Sheet open={!!section} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{sectionInfo.icon}</span>
            {sectionInfo.label}
          </SheetTitle>
          <SheetDescription>{sectionInfo.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {section.section_type === "featured_video" && (
            <>
              <div className="space-y-2">
                <Label>Select Video</Label>
                <Select value={config.videoId} onValueChange={(value) => setConfig({ ...config, videoId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose a video" /></SelectTrigger>
                  <SelectContent>
                    {videos.map((v) => <SelectItem key={v.id} value={v.id}>{v.file_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title Override</Label>
                <Input value={config.videoTitle || ""} onChange={(e) => setConfig({ ...config, videoTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={config.videoDescription || ""} onChange={(e) => setConfig({ ...config, videoDescription: e.target.value })} rows={3} />
              </div>
            </>
          )}

          {section.section_type === "stream_channel" && (
            <div className="flex items-center justify-between">
              <Label>Show Past Streams</Label>
              <Switch checked={config.showPastStreams || false} onCheckedChange={(c) => setConfig({ ...config, showPastStreams: c })} />
            </div>
          )}

          {section.section_type === "social_links" && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Social Links</Label>
                <Button size="sm" onClick={addSocialLink}><Plus className="w-4 h-4 mr-2" />Add</Button>
              </div>
              {(config.links || []).map((link, i) => (
                <div key={i} className="p-3 border rounded space-y-2">
                  <div className="flex justify-between">
                    <Select value={link.platform} onValueChange={(v) => updateSocialLink(i, 'platform', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => removeSocialLink(i)}><X className="w-4 h-4" /></Button>
                  </div>
                  <Input placeholder="URL" value={link.url} onChange={(e) => updateSocialLink(i, 'url', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {section.section_type === "meetings" && (
            <>
              {meetings.length > 0 ? (
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={config.meetingTypeId} onValueChange={(v) => setConfig({ ...config, meetingTypeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose meeting" /></SelectTrigger>
                    <SelectContent>
                      {meetings.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>External URL</Label>
                  <Input value={config.externalUrl || ""} onChange={(e) => setConfig({ ...config, externalUrl: e.target.value })} placeholder="https://calendly.com/..." />
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-6">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1">Save</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
