import { useState, useRef, useEffect } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { ClipsGallery } from "./ClipsGallery";
import { ClipDetailPanel } from "./ClipDetailPanel";
import { ClipVideoPreview } from "./ClipVideoPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, RefreshCw, Download, Share2, Sparkles, 
  Settings, Layers, LayoutGrid, List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipsStudioWorkspaceProps {
  sourceMedia: SourceMedia;
  clips: ClipData[];
  setClips: (clips: ClipData[]) => void;
  onReanalyze: () => void;
  onBack: () => void;
}

export function ClipsStudioWorkspace({
  sourceMedia,
  clips,
  setClips,
  onReanalyze,
  onBack,
}: ClipsStudioWorkspaceProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    clips[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSettings, setShowSettings] = useState(false);

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  const handleClipUpdate = (clipId: string, updates: Partial<ClipData>) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const averageViralityScore = clips.length > 0 
    ? Math.round(clips.reduce((acc, c) => acc + (c.virality_score || 0), 0) / clips.length)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">
                  {sourceMedia.file_name.replace(/\.[^/.]+$/, "")}
                </h1>
                <Badge className="bg-[#2C6BED]/20 text-[#2C6BED] border-[#2C6BED]/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {clips.length} clips
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatDuration(sourceMedia.duration_seconds)} source</span>
                <span>•</span>
                <span>Avg. virality: {averageViralityScore}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'grid' && "bg-background shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'list' && "bg-background shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={onReanalyze}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button size="sm" className="bg-[#053877] hover:bg-[#053877]/90">
              <Share2 className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Clips Gallery */}
        <ClipsGallery
          clips={clips}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          sourceMedia={sourceMedia}
          viewMode={viewMode}
        />

        {/* Center - Video Preview */}
        <ClipVideoPreview
          clip={selectedClip}
          sourceMedia={sourceMedia}
        />

        {/* Right Panel - Clip Details & Editor */}
        <ClipDetailPanel
          clip={selectedClip}
          sourceMedia={sourceMedia}
          onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
        />
      </div>
    </div>
  );
}
