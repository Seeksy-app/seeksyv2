import { BoardLayout } from '@/components/board/BoardLayout';
import { MarkdownRenderer } from '@/components/board/MarkdownRenderer';
import { useBoardContent, useBoardDocuments } from '@/hooks/useBoardContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Download, ExternalLink, File, FileImage, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return FileImage;
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
  return File;
};

export default function BoardDocs() {
  const navigate = useNavigate();
  const { content, isLoading: contentLoading } = useBoardContent('docs');
  const { documents, isLoading: docsLoading } = useBoardDocuments();

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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Documents</h1>
            <p className="text-slate-400">Reports, legal documents & meeting minutes</p>
          </div>
        </div>

        {/* Overview Content */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-8">
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <MarkdownRenderer content={content?.content || ''} />
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Available Documents</h2>
          
          {docsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : documents?.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center text-slate-400">
                No documents available yet. Check back soon.
              </CardContent>
            </Card>
          ) : (
            documents?.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              
              return (
                <Card 
                  key={doc.id} 
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-slate-400 truncate">{doc.description}</p>
                        )}
                      </div>
                      {doc.file_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => window.open(doc.file_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>
                    
                    {doc.content && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <MarkdownRenderer content={doc.content} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {content?.updated_at && (
          <p className="text-sm text-slate-500 mt-6 text-right">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </BoardLayout>
  );
}
