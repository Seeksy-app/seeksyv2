import { useParams } from 'react-router-dom';
import { KnowledgeBlogLayout } from '@/components/knowledge-blog/KnowledgeBlogLayout';
import { ArticleDetail } from '@/components/knowledge-blog/ArticleDetail';
import { useKnowledgeArticle, useRegenerateArticle } from '@/hooks/useKnowledgeArticles';
import { PortalType } from '@/types/knowledge-blog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';

interface KnowledgeArticlePageProps {
  portal: PortalType;
}

export function KnowledgeArticlePage({ portal }: KnowledgeArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  
  const { data: article, isLoading, error } = useKnowledgeArticle(portal, slug || '');
  const regenerateMutation = useRegenerateArticle();

  const handleRegenerate = async () => {
    if (!article) return;
    
    try {
      await regenerateMutation.mutateAsync(article.id);
      toast({
        title: 'Article regenerated',
        description: 'The article has been updated with fresh content.'
      });
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: 'Could not regenerate the article. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <KnowledgeBlogLayout portal={portal}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </KnowledgeBlogLayout>
    );
  }

  if (error || !article) {
    return (
      <KnowledgeBlogLayout portal={portal}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Article not found</h2>
          <p className="text-muted-foreground">The article you're looking for doesn't exist or has been removed.</p>
        </div>
      </KnowledgeBlogLayout>
    );
  }

  return (
    <KnowledgeBlogLayout portal={portal} currentSection={article.section}>
      <ArticleDetail
        article={article}
        portal={portal}
        onRegenerate={handleRegenerate}
        isRegenerating={regenerateMutation.isPending}
        canEdit={isAdmin}
      />
    </KnowledgeBlogLayout>
  );
}
