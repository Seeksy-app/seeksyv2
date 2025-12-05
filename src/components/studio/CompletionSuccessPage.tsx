import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Download, FileText, Layers, Type, Scissors, 
  Eye, FolderOpen, Share2, ExternalLink, ChevronRight, Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProcessingAnalyticsPanel, DurationComparisonBanner } from "./ProcessingAnalyticsPanel";

interface AnalyticsData {
  fillerWordsRemoved: number;
  pausesRemoved: number;
  silencesTrimmed: number;
  noiseReduced: number;
  totalTimeSaved: number;
  chaptersDetected: number;
  originalDuration: number;
  finalDuration: number;
}

interface CompletionSuccessPageProps {
  mediaId: string;
  mediaName: string;
  analytics: AnalyticsData;
  onCompareClick: () => void;
  hasOriginalPreview?: boolean;
}

export function CompletionSuccessPage({
  mediaId,
  mediaName,
  analytics,
  onCompareClick,
  hasOriginalPreview = true
}: CompletionSuccessPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopyLink = () => {
    // In a real implementation, this would copy a shareable link
    navigator.clipboard.writeText(`${window.location.origin}/studio/media/${mediaId}`);
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard"
    });
  };

  const handleDownload = (type: 'video' | 'transcript' | 'chapters' | 'srt') => {
    toast({
      title: "Download Started",
      description: `Your ${type} is being prepared for download.`
    });
    // In a real implementation, this would trigger the actual download
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div 
        className="p-6 rounded-xl text-white"
        style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">🎉 Your Video Has Been Successfully Enhanced</h2>
            <p className="text-white/80 mt-1">
              Your enhanced content is ready. Choose what you'd like to do next.
            </p>
          </div>
        </div>
      </div>

      {/* Enhancement Summary */}
      <Card>
        <CardContent className="pt-6">
          <ProcessingAnalyticsPanel 
            analytics={analytics} 
            variant="summary" 
          />
          <DurationComparisonBanner 
            originalDuration={analytics.originalDuration}
            finalDuration={analytics.finalDuration}
            totalTimeSaved={analytics.totalTimeSaved}
          />
        </CardContent>
      </Card>

      {/* Download Your Files */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-[#2C6BED]" />
            Download Your Files
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5 transition-all"
              onClick={() => handleDownload('video')}
            >
              <Download className="h-6 w-6 text-[#2C6BED]" />
              <span className="text-sm font-medium">Enhanced Video</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5 transition-all"
              onClick={() => handleDownload('transcript')}
            >
              <FileText className="h-6 w-6 text-[#2C6BED]" />
              <span className="text-sm font-medium">Transcript</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5 transition-all"
              onClick={() => handleDownload('chapters')}
            >
              <Layers className="h-6 w-6 text-[#2C6BED]" />
              <span className="text-sm font-medium">Chapters JSON</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5 transition-all"
              onClick={() => handleDownload('srt')}
            >
              <Type className="h-6 w-6 text-[#2C6BED]" />
              <span className="text-sm font-medium">SRT Captions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Next Steps</h3>
          <div className="space-y-3">
            {/* Primary CTA - Generate Clips */}
            <Button 
              className="w-full justify-between h-auto py-4 text-white group"
              style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
              onClick={() => navigate(`/studio/clips?media=${mediaId}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Scissors className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">✂️ Generate AI Clips from This Video</div>
                  <div className="text-xs text-white/70">Create viral short clips automatically</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 gap-3"
                onClick={onCompareClick}
              >
                <Eye className="h-5 w-5 text-[#2C6BED]" />
                <div className="text-left">
                  <div className="font-medium">Compare Original vs Enhanced</div>
                  {!hasOriginalPreview && (
                    <div className="text-xs text-muted-foreground">Original not available for import</div>
                  )}
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 gap-3"
                onClick={() => navigate(`/studio/enhanced/${mediaId}`)}
              >
                <FolderOpen className="h-5 w-5 text-[#2C6BED]" />
                <div className="text-left">
                  <div className="font-medium">View Full Details</div>
                  <div className="text-xs text-muted-foreground">Analytics, downloads & sharing</div>
                </div>
              </Button>
            </div>
            
            {/* Share/Copy Link */}
            <Button 
              variant="ghost" 
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              onClick={handleCopyLink}
            >
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Share or Copy Link</span>
              </div>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
