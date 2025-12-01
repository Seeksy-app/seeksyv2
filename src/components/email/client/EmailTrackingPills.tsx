import { Badge } from "@/components/ui/badge";
import { Eye, MousePointer, AlertTriangle, Zap, Circle, CheckCircle2, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateEngagementStats, getEngagementTag, getEngagementColor, EngagementTag } from "@/utils/emailEngagement";
import { cn } from "@/lib/utils";

interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  ip_address?: string;
  clicked_url?: string;
}

interface EmailTrackingPillsProps {
  events: EmailEvent[];
  sentAt: string;
  onClick?: () => void;
}

export function EmailTrackingPills({ events, sentAt, onClick }: EmailTrackingPillsProps) {
  const daysSinceSent = Math.floor((Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24));
  const stats = calculateEngagementStats(events, sentAt);
  const engagementTag = getEngagementTag(stats, daysSinceSent);

  // Determine email status
  const hasClicked = stats.clicks > 0;
  const hasOpened = stats.opens > 0;
  const hasDelivered = events.some(e => e.event_type === "email.delivered");
  const hasBounced = stats.bounces > 0;
  const sentOnly = !hasDelivered && !hasBounced;

  const tooltipContent = (
    <div className="space-y-2 text-xs">
      {sentOnly && <div className="text-muted-foreground">Sent {Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000)} minutes ago</div>}
      {hasDelivered && !hasOpened && <div className="text-muted-foreground">Delivered · Not opened yet</div>}
      {hasOpened && (
        <div>
          <strong>Opens:</strong> {stats.opens}
          {stats.firstOpenMinutes !== null && (
            <div className="text-muted-foreground">
              Opened {stats.firstOpenMinutes} min after sending
            </div>
          )}
        </div>
      )}
      {hasClicked && (
        <div>
          <strong>Clicks:</strong> {stats.clicks}
        </div>
      )}
      {hasBounced && (
        <div className="text-red-500">
          <strong>Bounced</strong> · Delivery failed
        </div>
      )}
      {stats.devices.size > 0 && (
        <div>
          <strong>Devices:</strong> {Array.from(stats.devices).join(", ")}
        </div>
      )}
      {engagementTag && (
        <div className="pt-1 border-t border-border">
          <strong>AI Tag:</strong> {engagementTag}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={onClick}>
            {/* Status Indicator */}
            {hasBounced ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">Bounced</span>
              </div>
            ) : hasClicked ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <Circle className="h-2.5 w-2.5 fill-current" />
                <Sparkles className="h-3 w-3" />
                <span className="text-xs font-medium">Clicked</span>
              </div>
            ) : hasOpened ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-xs font-medium">Opened</span>
              </div>
            ) : hasDelivered ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Circle className="h-2.5 w-2.5 fill-current" />
                <span className="text-xs font-medium">Delivered</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                <Circle className="h-2.5 w-2.5 fill-current" />
                <span className="text-xs font-medium">Sent</span>
              </div>
            )}

            {/* AI Engagement Tag */}
            {engagementTag && (
              <Badge variant="secondary" className={cn("text-xs px-1.5 py-0.5 border-0", getEngagementColor(engagementTag))}>
                <Zap className="h-3 w-3 mr-1" />
                {engagementTag}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-popover">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
