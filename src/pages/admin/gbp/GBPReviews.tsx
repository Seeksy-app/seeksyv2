import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MessageSquare, 
  Search, 
  Star,
  ChevronLeft,
  Reply,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

function GBPReviewsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState("unreplied");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch connection
  const { data: connection } = useQuery({
    queryKey: ['gbp-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_connections')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch write mode status
  const { data: settings } = useQuery({
    queryKey: ['gbp-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_admin_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch locations for filter
  const { data: locations } = useQuery({
    queryKey: ['gbp-locations-list', connection?.id],
    queryFn: async () => {
      if (!connection?.id) return [];
      const { data, error } = await supabase
        .from('gbp_locations')
        .select('id, title')
        .eq('connection_id', connection.id);
      if (error) throw error;
      return data;
    },
    enabled: !!connection?.id,
  });

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['gbp-reviews', connection?.id, ratingFilter, replyFilter, search],
    queryFn: async () => {
      if (!connection?.id) return [];
      
      let query = supabase
        .from('gbp_reviews')
        .select('*, gbp_locations(title)')
        .eq('connection_id', connection.id)
        .order('create_time', { ascending: false });

      if (ratingFilter !== 'all') {
        query = query.eq('star_rating', parseInt(ratingFilter));
      }

      if (replyFilter === 'unreplied') {
        query = query.eq('has_reply', false);
      } else if (replyFilter === 'replied') {
        query = query.eq('has_reply', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!connection?.id,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewName, replyText }: { reviewName: string; replyText: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('gbp-write', {
        body: {
          action_type: 'REPLY_REVIEW',
          connection_id: connection?.id,
          location_id: selectedReview?.location_id,
          payload: {
            review_name: reviewName,
            reply_text: replyText
          },
          actor_user_id: user?.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Reply posted successfully");
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
      setSelectedReview(null);
      setReplyText("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to post reply");
    }
  });

  const writeModeEnabled = settings?.write_mode_enabled;

  const handleOpenReply = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.reply_comment || "");
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    replyMutation.mutate({
      reviewName: selectedReview.google_review_name,
      replyText: replyText.trim()
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="container max-w-5xl py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews
              </h1>
              <p className="text-sm text-muted-foreground">
                {reviews?.length || 0} reviews
              </p>
            </div>
          </div>
        </div>

        {/* Write Mode Banner */}
        {!writeModeEnabled && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Write mode is disabled. Enable it in GBP settings to reply to reviews.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={replyFilter} onValueChange={setReplyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Reply Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unreplied">Unreplied</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !reviews?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <Card key={review.id} className="p-3">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.reviewer_profile_photo_url} />
                    <AvatarFallback>{review.reviewer_display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.reviewer_display_name || 'Anonymous'}</span>
                        {renderStars(review.star_rating)}
                        {review.has_reply && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Replied
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {review.create_time 
                          ? formatDistanceToNow(new Date(review.create_time), { addSuffix: true })
                          : '—'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {review.comment || '(No comment)'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {(review as any).gbp_locations?.title || 'Unknown location'}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReply(review)}
                            disabled={!writeModeEnabled}
                            className="h-7 text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            {review.has_reply ? 'Edit Reply' : 'Reply'}
                          </Button>
                        </TooltipTrigger>
                        {!writeModeEnabled && (
                          <TooltipContent>Enable write mode to reply</TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    {review.has_reply && review.reply_comment && (
                      <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Your reply:</p>
                        <p className="text-sm">{review.reply_comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Drawer */}
        <Sheet open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Reply to Review</SheetTitle>
              <SheetDescription>
                Your reply will be visible publicly on Google
              </SheetDescription>
            </SheetHeader>
            
            {selectedReview && (
              <div className="mt-4 space-y-4">
                {/* Original Review */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{selectedReview.reviewer_display_name}</span>
                    {renderStars(selectedReview.star_rating)}
                  </div>
                  <p className="text-sm">{selectedReview.comment || '(No comment)'}</p>
                </div>

                {/* Reply Input */}
                <div>
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {replyText.length} characters
                  </p>
                </div>
              </div>
            )}

            <SheetFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitReply}
                disabled={replyMutation.isPending || !replyText.trim()}
              >
                {replyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post Reply
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

export default function GBPReviews() {
  return (
    <RequireAdmin>
      <GBPReviewsContent />
    </RequireAdmin>
  );
}
