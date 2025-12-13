import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, Link } from "react-router-dom";
import { Search, Calendar, Eye, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { NewsletterSignupForm } from "@/components/NewsletterSignupForm";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  status: string;
  master_published_at: string;
  views_count: number;
  is_ai_generated: boolean;
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const PublicBlog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["public-blog-posts", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("publish_to_master", true)
        .order("master_published_at", { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each post
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return { ...post, profile } as BlogPost;
        })
      );

      return postsWithProfiles;
    },
  });

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyQzZCRUQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Seeksy Blog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Stories from Creators
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover insights, tutorials, and stories from the Seeksy creator community. 
              Expert perspectives on podcasting, content creation, and building your audience.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-background/80 backdrop-blur-sm border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
              </div>
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-12">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Featured Article
                  </h2>
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-card/50 backdrop-blur-sm"
                    onClick={() => navigate(`/blog/${featuredPost.slug}`)}
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-8 md:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={featuredPost.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {featuredPost.profile?.full_name?.[0] || featuredPost.profile?.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {featuredPost.profile?.full_name || featuredPost.profile?.username || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(featuredPost.master_published_at), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {featuredPost.views_count} views
                              </span>
                            </div>
                          </div>
                          {featuredPost.is_ai_generated && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h3>
                        {featuredPost.excerpt && (
                          <p className="text-muted-foreground mb-6 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <Button variant="ghost" className="w-fit p-0 h-auto text-primary group-hover:gap-3 transition-all">
                          Read Article <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Remaining Posts Grid */}
              {remainingPosts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                    Latest Articles
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <div className="aspect-video overflow-hidden bg-muted">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Sparkles className="w-10 h-10 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <CardHeader className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {post.profile?.full_name || post.profile?.username}
                            </span>
                            {post.is_ai_generated && (
                              <Badge variant="secondary" className="ml-auto text-xs py-0 px-1.5">
                                AI
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          {post.excerpt && (
                            <CardDescription className="line-clamp-2 mt-2">
                              {post.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.master_published_at), "MMM d")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views_count}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter Section */}
              <div className="mt-16 py-12 px-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl text-center">
                <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get the latest articles and creator insights delivered to your inbox.
                </p>
                <div className="max-w-md mx-auto">
                  <NewsletterSignupForm />
                </div>
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-16">
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No articles found" : "No articles yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Check back soon for new content from our creators"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicBlog;
