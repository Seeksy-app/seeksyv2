import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Save, X, ArrowRight } from "lucide-react";

interface AIEditCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalEdits: number;
  onSaveEdits: () => void;
  onKeepOriginal: () => void;
}

export const AIEditCompletionDialog = ({ 
  open, 
  onOpenChange,
  totalEdits,
  onSaveEdits,
  onKeepOriginal
}: AIEditCompletionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            AI Editing Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Success Message */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <Sparkles className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg">
              I've successfully applied <span className="font-bold text-primary">{totalEdits} AI edits</span> to your video
            </p>
            <p className="text-sm text-muted-foreground">
              Your edited video is now displayed in the timeline. Review the changes and decide what to do next.
            </p>
          </div>

          {/* Next Steps Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              What happens next?
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Badge variant="default" className="text-xs">Option 1</Badge>
                <p className="flex-1 text-muted-foreground">
                  <span className="font-medium text-foreground">Save Edits:</span> Keep all AI changes and continue with manual edits if needed
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Option 2</Badge>
                <p className="flex-1 text-muted-foreground">
                  <span className="font-medium text-foreground">Keep Original:</span> Discard all AI changes and start fresh
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onKeepOriginal();
              onOpenChange(false);
            }}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Keep Original
          </Button>
          <Button
            onClick={() => {
              onSaveEdits();
              onOpenChange(false);
            }}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Edits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
