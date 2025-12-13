import React from 'react';
import { RelatedArticleCard } from './RelatedArticleCard';
import { BlogAdSlot } from '@/components/BlogAdSlot';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
}

interface BlogRightRailProps {
  relatedPosts: RelatedPost[];
  isLoading?: boolean;
}

export const BlogRightRail = ({ relatedPosts, isLoading }: BlogRightRailProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3 p-3 rounded-lg border border-border/50">
              <div className="w-[120px] h-[68px] bg-muted rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Interleave related posts with ad slots
  const railItems: React.ReactNode[] = [];
  
  relatedPosts.forEach((post, index) => {
    // Add related article card
    railItems.push(
      <RelatedArticleCard
        key={post.id}
        id={post.id}
        title={post.title}
        slug={post.slug}
        excerpt={post.excerpt}
        featuredImageUrl={post.featured_image_url}
        publishedAt={post.published_at}
      />
    );
    
    // Add ad slot after each article (except the last one)
    if (index < relatedPosts.length - 1) {
      railItems.push(
        <div key={`ad-${index}`} className="py-2">
          <BlogAdSlot position="sidebar" />
        </div>
      );
    }
  });

  // Add final ad slot at the end if we have posts
  if (relatedPosts.length > 0) {
    railItems.push(
      <div key="ad-final" className="py-2">
        <BlogAdSlot position="sidebar" />
      </div>
    );
  }

  return (
    <aside className="hidden lg:block lg:w-[320px] flex-shrink-0">
      <div className="sticky top-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Related Articles
        </h3>
        {relatedPosts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No related articles found
          </div>
        ) : (
          <div className="space-y-4">
            {railItems}
          </div>
        )}
      </div>
    </aside>
  );
};
