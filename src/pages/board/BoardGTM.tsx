import { BoardLayout } from '@/components/board/BoardLayout';
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent } from '@/hooks/useBoardContent';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function BoardGTM() {
  const navigate = useNavigate();
  const { content, isLoading } = useBoardContent('gtm');

  return (
    <BoardLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white mb-6"
          onClick={() => navigate('/board')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">GTM Strategy</h1>
            <p className="text-slate-400">Go-to-market plan & acquisition channels</p>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <MarkdownRenderer content={content?.content || ''} />
            )}
          </CardContent>
        </Card>

        {content?.updated_at && (
          <p className="text-sm text-slate-500 mt-4 text-right">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </BoardLayout>
  );
}
