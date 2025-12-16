import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Presentation, 
  MonitorStop,
  ListChecks,
  Table2,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronDown,
  Eye,
} from "lucide-react";
import { PresenterSection } from "@/hooks/usePresenterMode";

interface PresenterControlsProps {
  isPresenting: boolean;
  currentSection: PresenterSection;
  onStartPresenting: () => void;
  onStopPresenting: () => void;
  onNavigateToSection: (section: PresenterSection) => void;
}

const sectionLabels: Record<PresenterSection, { label: string; icon: React.ReactNode }> = {
  'video-only': { label: 'Video Only', icon: <Eye className="h-4 w-4" /> },
  'agenda': { label: 'Agenda', icon: <ListChecks className="h-4 w-4" /> },
  'decisions': { label: 'Decision Matrix', icon: <Table2 className="h-4 w-4" /> },
  'ai-notes': { label: 'AI Notes', icon: <Sparkles className="h-4 w-4" /> },
  'questions': { label: 'Questions', icon: <HelpCircle className="h-4 w-4" /> },
  'summary': { label: 'Summary', icon: <FileText className="h-4 w-4" /> },
};

export function PresenterControls({
  isPresenting,
  currentSection,
  onStartPresenting,
  onStopPresenting,
  onNavigateToSection,
}: PresenterControlsProps) {
  if (!isPresenting) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onStartPresenting}
              className="gap-2"
            >
              <Presentation className="h-4 w-4" />
              Present
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Start presenter mode - attendees will see the same content you navigate to</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="bg-primary/90 animate-pulse gap-1">
        <Presentation className="h-3 w-3" />
        Presenting
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1">
            {sectionLabels[currentSection].icon}
            {sectionLabels[currentSection].label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Navigate To</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(sectionLabels) as PresenterSection[]).map((section) => (
            <DropdownMenuItem
              key={section}
              onClick={() => onNavigateToSection(section)}
              className={currentSection === section ? "bg-accent" : ""}
            >
              <span className="mr-2">{sectionLabels[section].icon}</span>
              {sectionLabels[section].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopPresenting}
            >
              <MonitorStop className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop presenting</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
