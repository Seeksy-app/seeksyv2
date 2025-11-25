import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Camera, Focus, Scissors, TrendingUp, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProcessingStage {
  id: string;
  label: string;
  icon: any;
  status: 'pending' | 'processing' | 'complete';
  description: string;
  changes?: string[];
}

interface AICameraProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  onComplete: (edits: any) => void;
}

export const AICameraProcessingDialog = ({ 
  open, 
  onOpenChange, 
  videoUrl,
  onComplete 
}: AICameraProcessingDialogProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detectedChanges, setDetectedChanges] = useState<string[]>([]);
  const [currentEdit, setCurrentEdit] = useState<{ type: string; label: string } | null>(null);
  const [pipScale, setPipScale] = useState(1);
  
  const stages: ProcessingStage[] = [
    {
      id: 'analyzing',
      label: 'Analyzing Video',
      icon: Camera,
      status: 'processing',
      description: 'Detecting speakers, emotions, and emphasis points...',
      changes: []
    },
    {
      id: 'planning',
      label: 'Planning Camera Angles',
      icon: Focus,
      status: 'pending',
      description: 'Determining optimal wide, medium, and close-up shots...',
      changes: []
    },
    {
      id: 'editing',
      label: 'Creating Virtual Cameras',
      icon: Scissors,
      status: 'pending',
      description: 'Generating punch-ins, zooms, and reframing effects...',
      changes: []
    },
    {
      id: 'optimizing',
      label: 'Finalizing Edit',
      icon: TrendingUp,
      status: 'pending',
      description: 'Smoothing transitions and balancing shot variety...',
      changes: []
    }
  ];

  const [processedStages, setProcessedStages] = useState(stages);

  useEffect(() => {
    if (!open) {
      setCurrentStageIndex(0);
      setProgress(0);
      setProcessedStages(stages);
      setDetectedChanges([]);
      setCurrentEdit(null);
      setPipScale(1);
      return;
    }

    // Simulate real-time change detection
    const changeTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 1.5, 100);
        
        // Add realistic change notifications at specific progress points
        if (newProgress >= 20 && newProgress < 22 && detectedChanges.length === 0) {
          setDetectedChanges(['Found speaker at 0:05 - creating close-up shot']);
          setCurrentEdit({ type: 'close_up', label: 'Focusing on Speaker' });
          setPipScale(1.5);
        }
        if (newProgress >= 35 && newProgress < 37 && detectedChanges.length === 1) {
          setDetectedChanges(prev => [...prev, 'Emphasis detected at 0:18 - adding punch-in']);
          setCurrentEdit({ type: 'punch_in', label: 'Adding Punch-In Effect' });
          setPipScale(1.8);
        }
        if (newProgress >= 50 && newProgress < 52 && detectedChanges.length === 2) {
          setDetectedChanges(prev => [...prev, 'Conversation flow at 0:32 - alternating to wide shot']);
          setCurrentEdit({ type: 'wide', label: 'Switching to Wide Angle' });
          setPipScale(0.9);
        }
        if (newProgress >= 65 && newProgress < 67 && detectedChanges.length === 3) {
          setDetectedChanges(prev => [...prev, 'Energy shift at 0:47 - adding digital zoom']);
          setCurrentEdit({ type: 'zoom', label: 'Applying Digital Zoom' });
          setPipScale(1.6);
        }
        if (newProgress >= 80 && newProgress < 82 && detectedChanges.length === 4) {
          setDetectedChanges(prev => [...prev, 'Smoothing transition at 1:02 - medium shot']);
          setCurrentEdit({ type: 'medium', label: 'Creating Medium Shot' });
          setPipScale(1.2);
        }
        
        // Update stage status based on progress
        const stageProgress = (newProgress / 100) * stages.length;
        const newStageIndex = Math.floor(stageProgress);
        
        if (newStageIndex !== currentStageIndex && newStageIndex < stages.length) {
          setCurrentStageIndex(newStageIndex);
          setProcessedStages(prev => prev.map((stage, idx) => ({
            ...stage,
            status: idx < newStageIndex ? 'complete' : 
                   idx === newStageIndex ? 'processing' : 'pending',
            changes: idx < newStageIndex ? detectedChanges.slice(idx * 2, (idx + 1) * 2) : []
          })));
        }
        
        // Complete processing
        if (newProgress === 100) {
          setTimeout(() => {
            onComplete({
              edits: [
                { timestamp: 5, type: 'close_up', description: 'Speaker emphasis - close-up shot' },
                { timestamp: 18, type: 'punch_in', description: 'Key point - digital punch-in' },
                { timestamp: 32, type: 'wide', description: 'Conversational flow - wide angle' },
                { timestamp: 47, type: 'zoom', description: 'Energy shift - smooth zoom in' },
                { timestamp: 62, type: 'medium', description: 'Natural transition - medium shot' }
              ],
              totalShots: 5,
              avgShotLength: 15,
              multicamStyle: 'professional'
            });
            onOpenChange(false);
          }, 500);
        }
        
        return newProgress;
      });
    }, 80);

    return () => clearInterval(changeTimer);
  }, [open, currentStageIndex, detectedChanges.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            AI Camera Focus - Creating Multicam Edit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Real-time Video Preview with PiP */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/20">
            {/* Original Video (Background) */}
            <video 
              src={videoUrl} 
              className="w-full h-full object-contain"
              muted
              loop
              autoPlay
            />
            
            {/* Picture-in-Picture Edited Preview */}
            <div className="absolute bottom-4 right-4 w-64 aspect-video bg-black/90 rounded-lg overflow-hidden border-2 border-primary shadow-2xl">
              <video 
                src={videoUrl} 
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700 ease-in-out",
                )}
                style={{ transform: `scale(${pipScale})` }}
                muted
                loop
                autoPlay
              />
              
              {/* Edit Type Overlay */}
              {currentEdit && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center space-y-2 animate-in fade-in zoom-in duration-300">
                    {currentEdit.type === 'zoom' && <ZoomIn className="h-8 w-8 text-white mx-auto animate-pulse" />}
                    {currentEdit.type === 'close_up' && <Focus className="h-8 w-8 text-white mx-auto animate-pulse" />}
                    {currentEdit.type === 'wide' && <Camera className="h-8 w-8 text-white mx-auto animate-pulse" />}
                    <p className="text-white text-xs font-semibold px-2">
                      {currentEdit.label}
                    </p>
                  </div>
                </div>
              )}
              
              {/* PiP Label */}
              <div className="absolute top-2 left-2 right-2">
                <Badge variant="default" className="text-[10px] bg-primary/90 backdrop-blur">
                  AI Edited Preview
                </Badge>
              </div>
            </div>

            {/* Processing Indicator */}
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-red-500 animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing
              </Badge>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing video...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Processing Stages */}
          <div className="space-y-3">
            {processedStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div 
                  key={stage.id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                    stage.status === 'processing' 
                      ? 'bg-primary/10 border border-primary/20' 
                      : stage.status === 'complete'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="mt-0.5">
                    {stage.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : stage.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{stage.label}</p>
                      {stage.status === 'processing' && (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                      {stage.status === 'complete' && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Changes Detected */}
          {detectedChanges.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Changes Being Applied:
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {detectedChanges.map((change, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Stats */}
          {progress > 40 && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.min(Math.floor(progress / 20), 5)}</p>
                <p className="text-xs text-muted-foreground">Virtual Cameras</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.min(Math.floor(progress / 25), 4)}</p>
                <p className="text-xs text-muted-foreground">Smooth Transitions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};