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
import { Rss, Plus, Trash2, Podcast, FileText, AlertCircle, RefreshCw, Upload, ExternalLink, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealthBanner } from '@/components/debug/SystemHealthBanner';

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

interface RDFeedItem {
  id: string;
  feed_id: string;
  title: string;
  url: string | null;
  published_at: string | null;
  content_type: string;
  processed: boolean;
  created_at: string;
}

export default function RDIntelligenceFeeds() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [feedType, setFeedType] = useState<'blog' | 'podcast'>('blog');
  const [uploadingPdf, setUploadingPdf] = useState(false);
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
      
      if (error) {
        console.error('[RD Feeds] Error fetching feeds:', error);
        return [];
      }
      return (data as unknown) as RDFeed[];
    },
  });

  // Query for feed items
  const { data: feedItems, isLoading: feedItemsLoading } = useQuery({
    queryKey: ['rdFeedItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_feed_items' as any)
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('[RD Feed Items] Error fetching items:', error);
        return [];
      }
      return (data as unknown) as RDFeedItem[];
    },
  });

  const addFeedMutation = useMutation({
    mutationFn: async (feed: { type: string; title: string; rss_url: string; category: string | null; trust_level: string }) => {
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setUploadingPdf(true);

    try {
      // Upload to storage
      const fileName = `rd-pdfs/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media-vault')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create a feed item for the PDF
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('rd_feed_items' as any)
        .insert({
          feed_id: null, // PDF uploads don't have a parent feed
          title: file.name.replace('.pdf', ''),
          url: fileName,
          content_type: 'pdf',
          processed: false,
          item_guid: `pdf-${Date.now()}`,
        });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      toast.success('PDF uploaded successfully. Processing will begin shortly.');
      setIsPdfDialogOpen(false);
    } catch (error: any) {
      console.error('[PDF Upload] Error:', error);
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'experimental': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-600';
    }
  };

  const blogFeeds = feeds?.filter(f => f.type === 'blog') || [];
  const podcastFeeds = feeds?.filter(f => f.type === 'podcast') || [];
  const blogItems = feedItems?.filter(i => i.content_type === 'article' || i.content_type === 'blog') || [];
  const podcastItems = feedItems?.filter(i => i.content_type === 'podcast' || i.content_type === 'audio') || [];
  const pdfItems = feedItems?.filter(i => i.content_type === 'pdf') || [];

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
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => openAddDialog('blog')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Blog RSS Feed
        </Button>
        <Button onClick={() => openAddDialog('podcast')} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Podcast RSS Feed
        </Button>
        <Button onClick={() => setIsPdfDialogOpen(true)} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload PDF → Extract Insights
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="feeds">
        <TabsList>
          <TabsTrigger value="feeds">Feeds ({feeds?.length || 0})</TabsTrigger>
          <TabsTrigger value="items">Articles ({feedItems?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Feeds Tab */}
        <TabsContent value="feeds" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Blog Feeds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
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
                  <Podcast className="w-5 h-5 text-purple-500" />
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
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingested Articles & Content</CardTitle>
              <CardDescription>
                Content fetched from RSS feeds and uploaded PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedItemsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !feedItems || feedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No articles ingested yet</h3>
                  <p className="text-sm mb-4">
                    Articles will appear here once feeds are synced or PDFs are processed.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tip: Make sure your RSS feeds are toggled ON and the ingestion job is running.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{item.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.content_type}
                          </Badge>
                          {item.processed && (
                            <Badge className="bg-green-500/20 text-green-600 text-xs">Processed</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.published_at 
                            ? new Date(item.published_at).toLocaleDateString() 
                            : 'Date unknown'}
                        </p>
                      </div>
                      {item.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(item.url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                <FileText className="w-5 h-5 text-blue-500" />
              ) : (
                <Podcast className="w-5 h-5 text-purple-500" />
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

      {/* PDF Upload Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload PDF → Extract Insights
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Upload a PDF document to extract text and add to R&D feeds for AI analysis.
            </p>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="pdf-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
                disabled={uploadingPdf}
              />
              <p className="text-xs text-muted-foreground mt-2">PDF files only</p>
            </div>

            {uploadingPdf && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading and processing...</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Health Banner */}
      <SystemHealthBanner />
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
