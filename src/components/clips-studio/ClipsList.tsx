import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, BarChart3, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipsListProps {
  clips: ClipData[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  sourceMedia: SourceMedia;
}

export function ClipsList({ clips, selectedClipId, onSelectClip, sourceMedia }: ClipsListProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    return "D";
  };

  return (
    <div className="w-80 border-r bg-card/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">AI Clips</h2>
          <Badge variant="secondary" className="text-xs">
            {clips.length} found
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranked by virality potential
        </p>
      </div>

      {/* Source info */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-black rounded overflow-hidden flex-shrink-0">
            <video
              src={sourceMedia.file_url}
              className="w-full h-full object-cover"
              muted
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {sourceMedia.file_name.replace(/\.[^/.]+$/, "")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatTime(sourceMedia.duration_seconds || 0)} total
            </p>
          </div>
        </div>
      </div>

      {/* Clips list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {clips.map((clip, index) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectClip(clip.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all group",
                selectedClipId === clip.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {/* Thumbnail with score overlay */}
              <div className="relative mb-2">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={`${sourceMedia.file_url}#t=${clip.start_seconds}`}
                    className="w-full h-full object-cover"
                    muted
                  />
                </div>
                
                {/* Score badge */}
                <div className={cn(
                  "absolute top-2 left-2 px-2 py-0.5 rounded-md text-sm font-bold",
                  "bg-black/80 backdrop-blur-sm",
                  getScoreColor(clip.virality_score || 0)
                )}>
                  {clip.virality_score || 0}
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                  {formatTime(clip.start_seconds)} - {formatTime(clip.end_seconds)}
                </div>
              </div>

              {/* Title */}
              <p className="font-medium text-sm line-clamp-2 mb-2">
                {clip.title || `Clip ${index + 1}`}
              </p>

              {/* Mini scores */}
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center p-1 rounded bg-muted/50">
                  <Zap className="h-3 w-3 mx-auto mb-0.5 text-yellow-500" />
                  <p className={cn("text-[10px] font-bold", getScoreColor(clip.hook_score || clip.virality_score || 0))}>
                    {getScoreGrade(clip.hook_score || clip.virality_score || 0)}
                  </p>
                  <p className="text-[8px] text-muted-foreground">Hook</p>
                </div>
                <div className="text-center p-1 rounded bg-muted/50">
                  <BarChart3 className="h-3 w-3 mx-auto mb-0.5 text-blue-500" />
                  <p className={cn("text-[10px] font-bold", getScoreColor(clip.flow_score || clip.virality_score || 0))}>
                    {getScoreGrade(clip.flow_score || clip.virality_score || 0)}
                  </p>
                  <p className="text-[8px] text-muted-foreground">Flow</p>
                </div>
                <div className="text-center p-1 rounded bg-muted/50">
                  <TrendingUp className="h-3 w-3 mx-auto mb-0.5 text-green-500" />
                  <p className={cn("text-[10px] font-bold", getScoreColor(clip.value_score || clip.virality_score || 0))}>
                    {getScoreGrade(clip.value_score || clip.virality_score || 0)}
                  </p>
                  <p className="text-[8px] text-muted-foreground">Value</p>
                </div>
                <div className="text-center p-1 rounded bg-muted/50">
                  <Flame className="h-3 w-3 mx-auto mb-0.5 text-orange-500" />
                  <p className={cn("text-[10px] font-bold", getScoreColor(clip.trend_score || clip.virality_score || 0))}>
                    {getScoreGrade(clip.trend_score || clip.virality_score || 0)}
                  </p>
                  <p className="text-[8px] text-muted-foreground">Trend</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
