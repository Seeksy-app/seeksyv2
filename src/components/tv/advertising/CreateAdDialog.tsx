import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, Music, Upload } from "lucide-react";

interface CreateAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAdDialog({ open, onOpenChange, onSuccess }: CreateAdDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'video' as 'video' | 'audio',
    asset_url: '',
    duration_seconds: '',
    thumbnail_url: '',
    click_url: '',
    notes: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.asset_url || !formData.duration_seconds) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('seeksy_tv_ads')
        .insert({
          title: formData.title,
          type: formData.type,
          asset_url: formData.asset_url,
          duration_seconds: parseInt(formData.duration_seconds),
          thumbnail_url: formData.thumbnail_url || null,
          click_url: formData.click_url || null,
          notes: formData.notes || null,
          status: formData.status,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Ad created successfully');
      setFormData({
        title: '',
        type: 'video',
        asset_url: '',
        duration_seconds: '',
        thumbnail_url: '',
        click_url: '',
        notes: '',
        status: 'active'
      });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Ad
          </DialogTitle>
          <DialogDescription>
            Add a new video or audio ad to your inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summer Sale 30s"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'video' | 'audio') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Audio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}
                placeholder="30"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset_url">Asset URL *</Label>
            <Input
              id="asset_url"
              value={formData.asset_url}
              onChange={(e) => setFormData(prev => ({ ...prev, asset_url: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Direct URL to the video or audio file</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="click_url">Click-through URL</Label>
            <Input
              id="click_url"
              value={formData.click_url}
              onChange={(e) => setFormData(prev => ({ ...prev, click_url: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Where users go when they click the ad</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes about this ad..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
