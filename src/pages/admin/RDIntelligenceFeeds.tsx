import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Rss, Plus, Trash2, Podcast, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RDFeed {
  id: string;
  type: string;
  title: string;
  rss_url: string;
  category: string | null;
  trust_level: string;
  active: boolean;
  created_at: string;
}

export default function RDIntelligenceFeeds() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [feedType, setFeedType] = useState<'blog' | 'podcast'>('blog');
  const [formData, setFormData] = useState({
    title: '',
    rss_url: '',
    category: '',
    trust_level: 'medium',
  });

  const { data: feeds, isLoading } = useQuery({
    queryKey: ['rdFeeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_feeds' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return (data as unknown) as RDFeed[];
    },
  });

  const addFeedMutation = useMutation({
    mutationFn: async (feed: { type: string; title: string; rss_url: string; category: string | null; trust_level: string }) => {
      // Basic URL validation
      try {
        new URL(feed.rss_url);
      } catch {
        throw new Error('Invalid RSS URL — please enter a valid feed.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('rd_feeds' as any)
        .insert({
          type: feed.type,
          title: feed.title,
          rss_url: feed.rss_url,
          category: feed.category,
          trust_level: feed.trust_level,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('This feed already exists.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
      setIsAddDialogOpen(false);
      setFormData({ title: '', rss_url: '', category: '', trust_level: 'medium' });
      toast.success('Feed added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('rd_feeds' as any)
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rd_feeds' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
      toast.success('Feed deleted');
    },
  });

  const handleAddFeed = () => {
    addFeedMutation.mutate({
      type: feedType,
      title: formData.title,
      rss_url: formData.rss_url,
      category: formData.category || null,
      trust_level: formData.trust_level,
    });
  };

  const openAddDialog = (type: 'blog' | 'podcast') => {
    setFeedType(type);
    setIsAddDialogOpen(true);
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'experimental': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const blogFeeds = feeds?.filter(f => f.type === 'blog') || [];
  const podcastFeeds = feeds?.filter(f => f.type === 'podcast') || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">R&D Intelligence Feeds</h1>
        <p className="text-muted-foreground mt-1">
          Internal research feeds. Separate from user RSS. Used to power AI insights and CFO forecasts.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => openAddDialog('blog')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Blog RSS Feed
        </Button>
        <Button onClick={() => openAddDialog('podcast')} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Podcast RSS Feed
        </Button>
      </div>

      {/* Feeds Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Blog Feeds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Blog Feeds
            </CardTitle>
            <CardDescription>Articles and written content for research</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : blogFeeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Rss className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No blog feeds added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blogFeeds.map(feed => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    onToggle={(active) => toggleFeedMutation.mutate({ id: feed.id, active })}
                    onDelete={() => deleteFeedMutation.mutate(feed.id)}
                    getTrustLevelColor={getTrustLevelColor}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Podcast Feeds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Podcast className="w-5 h-5 text-purple-400" />
              Podcast Feeds
            </CardTitle>
            <CardDescription>Audio content for transcription and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : podcastFeeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Podcast className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No podcast feeds added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {podcastFeeds.map(feed => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    onToggle={(active) => toggleFeedMutation.mutate({ id: feed.id, active })}
                    onDelete={() => deleteFeedMutation.mutate(feed.id)}
                    getTrustLevelColor={getTrustLevelColor}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {!isLoading && (!feeds || feeds.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No R&D feeds added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first blog or podcast feed to begin ingesting insights.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Feed Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedType === 'blog' ? (
                <FileText className="w-5 h-5 text-blue-400" />
              ) : (
                <Podcast className="w-5 h-5 text-purple-400" />
              )}
              Add {feedType === 'blog' ? 'Blog' : 'Podcast'} RSS Feed
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Feed Title</Label>
              <Input
                id="title"
                placeholder="e.g., Creator Economy Blog"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="rss_url">RSS URL</Label>
              <Input
                id="rss_url"
                placeholder="https://example.com/rss"
                value={formData.rss_url}
                onChange={(e) => setFormData({ ...formData, rss_url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="AdTech, Creator Tools, Industry News"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="trust_level">Trust Level</Label>
              <Select
                value={formData.trust_level}
                onValueChange={(value) => setFormData({ ...formData, trust_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddFeed}
                disabled={!formData.title || !formData.rss_url || addFeedMutation.isPending}
              >
                {addFeedMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Feed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeedItem({
  feed,
  onToggle,
  onDelete,
  getTrustLevelColor,
}: {
  feed: RDFeed;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
  getTrustLevelColor: (level: string) => string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
      <Switch
        checked={feed.active}
        onCheckedChange={onToggle}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{feed.title}</span>
          <Badge variant="outline" className={getTrustLevelColor(feed.trust_level)}>
            {feed.trust_level}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{feed.rss_url}</p>
        {feed.category && (
          <p className="text-xs text-muted-foreground mt-0.5">{feed.category}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
