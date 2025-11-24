import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Radio, ChevronLeft, Edit2 } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface StudioTopBarProps {
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  isLiveOnProfile: boolean;
  onGoLive: () => void;
  onBack: () => void;
}

export function StudioTopBar({
  sessionName,
  onSessionNameChange,
  isLiveOnProfile,
  onGoLive,
  onBack,
}: StudioTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <Input
              value={sessionName}
              onChange={(e) => onSessionNameChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              className="h-8 w-64 text-lg font-semibold"
              autoFocus
            />
          ) : (
            <>
              <h1 className="text-lg font-semibold">{sessionName}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(true)}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>

        {isLiveOnProfile ? (
          <Button
            onClick={onGoLive}
            size="sm"
            variant="destructive"
            className="font-semibold"
          >
            <Radio className="h-4 w-4 mr-2" />
            End Live
          </Button>
        ) : (
          <Button
            onClick={onGoLive}
            size="sm"
            className="bg-brand-blue hover:bg-brand-blue/90 font-semibold"
          >
            <Radio className="h-4 w-4 mr-2" />
            Go live
          </Button>
        )}
      </div>
    </div>
  );
}
