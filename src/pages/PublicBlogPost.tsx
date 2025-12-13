import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Eye, Share2 } from "lucide-react";
import { format } from "date-fns";
import { BlogMarkdownContent } from "@/components/blog/BlogMarkdownContent";
import { BlogRightRail } from "@/components/blog/BlogRightRail";
import { useMemo } from "react";

const PublicBlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Helper to decode HTML entities in titles
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      // First get the blog post
      const { data: blogData, error: blogError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (blogError) throw blogError;

      // Then get the profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", blogData.user_id)
        .single();

      // Increment view count
      await supabase
        .from("blog_posts")
        .update({ views_count: (blogData.views_count || 0) + 1 })
        .eq("id", blogData.id);

      return { ...blogData, profile: profileData };
    },
    enabled: !!slug,
  });

  // Fetch related posts - prioritize recent posts
  const { data: relatedPosts, isLoading: relatedLoading } = useQuery({
    queryKey: ["related-posts", post?.id],
    queryFn: async () => {
      if (!post?.id) return [];

      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, excerpt, slug, featured_image_url, published_at")
        .eq("status", "published")
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.id,
  });

  // Memoize related posts to avoid refetch loops
  const memoizedRelatedPosts = useMemo(() => relatedPosts || [], [relatedPosts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 max-w-[1140px] mx-auto">
          {/* Main Content - max 720px */}
          <article className="flex-1 max-w-[720px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>

            {post.featured_image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {decodeHtmlEntities(post.title)}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profile?.avatar_url} />
                  <AvatarFallback>
                    {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {post.profile?.full_name || post.profile?.username || "Anonymous"}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), "MMMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views_count} views
                    </span>
                  </div>
                </div>
              </div>

              {post.is_ai_generated && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  AI Generated from Podcast
                </Badge>
              )}
            </header>

            <Separator className="mb-8" />

            {/* Blog Content with proper markdown formatting */}
            <BlogMarkdownContent content={post.content} />

            <Separator className="my-8" />

            <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {format(new Date(post.updated_at), "MMMM d, yyyy")}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </footer>
          </article>

          {/* Right Rail - Hidden on mobile/tablet */}
          <BlogRightRail 
            relatedPosts={memoizedRelatedPosts} 
            isLoading={relatedLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicBlogPost;
