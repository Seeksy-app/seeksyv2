import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Eye, Share2 } from "lucide-react";
import { format } from "date-fns";
import { BlogAdSlot } from "@/components/BlogAdSlot";

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

  // Fetch related posts from the same author
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.user_id, post?.id],
    queryFn: async () => {
      if (!post?.user_id || !post?.id) return [];

      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, excerpt, slug, featured_image_url, published_at, views_count")
        .eq("user_id", post.user_id)
        .eq("status", "published")
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.user_id && !!post?.id,
  });

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
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Main Content */}
        <article className="lg:col-span-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{decodeHtmlEntities(post.title)}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <Avatar>
              <AvatarImage src={post.profile?.avatar_url} />
              <AvatarFallback>
                {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.profile?.full_name || post.profile?.username}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
            <Badge variant="secondary" className="mb-4">
              AI Generated from Podcast
            </Badge>
          )}
        </header>

          <Separator className="mb-8" />

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} 
              className="blog-content"
            />
            
            {/* Inline ad after content */}
            <div className="my-8">
              <BlogAdSlot position="inline" />
            </div>
          </div>

          <Separator className="my-8" />

          {/* Footer Ad */}
          <div className="mb-8">
            <BlogAdSlot position="footer" />
          </div>

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
              <Button
                variant="outline"
                onClick={() => navigate(`/${post.profile?.username}`)}
              >
                View Profile
              </Button>
            </div>
          </footer>

          {/* Related Posts Section */}
          {relatedPosts && relatedPosts.length > 0 && (
            <>
              <Separator className="my-12" />
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-6">More from {post.profile?.full_name || post.profile?.username}</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <div
                      key={relatedPost.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                    >
                      {relatedPost.featured_image_url && (
                        <div className="aspect-video w-full overflow-hidden rounded-lg mb-3">
                          <img
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {decodeHtmlEntities(relatedPost.title)}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(relatedPost.published_at), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {relatedPost.views_count} views
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Author Card */}
          <div className="bg-card border rounded-lg p-6 sticky top-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={post.profile?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{post.profile?.full_name || post.profile?.username}</h3>
                <p className="text-sm text-muted-foreground">Content Creator</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate(`/${post.profile?.username}.blog`)}
            >
              View More Posts
            </Button>
          </div>

          {/* Sidebar Ads */}
          <BlogAdSlot position="sidebar" />
          <BlogAdSlot position="sidebar" />
        </aside>
        </div>
      </div>
    </div>
  );
};

export default PublicBlogPost;
