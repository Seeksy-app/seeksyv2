import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KnowledgeBlogLayout } from '@/components/knowledge-blog/KnowledgeBlogLayout';
import { ArticleCard } from '@/components/knowledge-blog/ArticleCard';
import { useKnowledgeArticles, useSearchKnowledgeArticles } from '@/hooks/useKnowledgeArticles';
import { PortalType, PORTAL_LABELS } from '@/types/knowledge-blog';
import { Loader2, FileText } from 'lucide-react';

interface KnowledgeBlogPortalProps {
  portal: PortalType;
}

export function KnowledgeBlogPortal({ portal }: KnowledgeBlogPortalProps) {
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get('section');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: articles, isLoading } = useKnowledgeArticles(portal, currentSection);
  const { data: searchResults, isLoading: isSearching } = useSearchKnowledgeArticles(searchQuery, portal);
  
  const basePath = `/knowledge/${portal}`;
  const displayArticles = searchQuery.length > 2 ? searchResults : articles;

  return (
    <KnowledgeBlogLayout
      portal={portal}
      currentSection={currentSection}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {currentSection || PORTAL_LABELS[portal]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentSection 
              ? `Articles about ${currentSection.toLowerCase()}`
              : `Explore all knowledge articles for ${portal === 'admin' ? 'administrators' : portal === 'creator' ? 'creators' : 'board members'}`
            }
          </p>
        </div>

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isSearching && (!displayArticles || displayArticles.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No articles found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try a different search term'
                : 'Check back soon for new content'
              }
            </p>
          </div>
        )}

        {/* Article Grid */}
        {!isLoading && !isSearching && displayArticles && displayArticles.length > 0 && (
          <div className="grid gap-3">
            {displayArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                basePath={basePath}
              />
            ))}
          </div>
        )}
      </div>
    </KnowledgeBlogLayout>
  );
}
