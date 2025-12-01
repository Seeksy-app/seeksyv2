import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, FileText, Mail, ArrowRight } from "lucide-react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  clicked_url?: string;
  bounce_reason?: string;
}

interface EmailViewerProps {
  email: {
    id: string;
    to_email: string;
    from_email: string;
    email_subject: string;
    event_type: string;
    created_at: string;
    campaign_name?: string;
    template_name?: string;
    html_content?: string;
    device_type?: string;
    user_agent?: string;
    ip_address?: string;
  } | null;
  events: EmailEvent[];
  onResend?: () => void;
  onDuplicate?: () => void;
  onViewTemplate?: () => void;
  onViewCampaign?: () => void;
}

const getStatusColor = (eventType: string) => {
  switch (eventType) {
    case "delivered":
      return "text-green-500";
    case "opened":
      return "text-blue-500";
    case "clicked":
      return "text-purple-500";
    case "bounced":
      return "text-red-500";
    case "unsubscribed":
      return "text-orange-500";
    default:
      return "text-muted-foreground";
  }
};

const eventOrder = ["sent", "delivered", "opened", "clicked"];

export function EmailViewer({
  email,
  events,
  onResend,
  onDuplicate,
  onViewTemplate,
  onViewCampaign,
}: EmailViewerProps) {
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select an email to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">{email.email_subject || "(No subject)"}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>To: {email.to_email}</span>
            <span>•</span>
            <span>From: {email.from_email}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onResend}>
            <Copy className="h-4 w-4 mr-2" />
            Resend
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          {email.template_name && (
            <Button variant="outline" size="sm" onClick={onViewTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              View Template
            </Button>
          )}
          {email.campaign_name && (
            <Button variant="outline" size="sm" onClick={onViewCampaign}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Campaign
            </Button>
          )}
        </div>

        {/* Event Timeline */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">Event Timeline</h3>
          <div className="space-y-3">
            {eventOrder.map((eventType, index) => {
              const event = events.find((e) => e.event_type === eventType);
              const isCompleted = !!event;
              
              return (
                <div key={eventType} className="flex items-center gap-3">
                  <Circle
                    className={cn(
                      "h-3 w-3 fill-current flex-shrink-0",
                      isCompleted ? getStatusColor(eventType) : "text-muted"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-medium",
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                      </span>
                      {event && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.occurred_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {event?.clicked_url && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Clicked: {event.clicked_url}
                      </div>
                    )}
                    {event?.bounce_reason && (
                      <div className="text-xs text-red-500 mt-1">
                        {event.bounce_reason}
                      </div>
                    )}
                  </div>
                  {index < eventOrder.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Device & Location Info */}
        {(email.device_type || email.user_agent || email.ip_address) && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Device & Location</h3>
            <div className="space-y-2 text-sm">
              {email.device_type && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Device:</span>
                  <Badge variant="secondary">{email.device_type}</Badge>
                </div>
              )}
              {email.user_agent && (
                <div>
                  <span className="text-muted-foreground block mb-1">Browser:</span>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {email.user_agent}
                  </code>
                </div>
              )}
              {email.ip_address && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{email.ip_address}</code>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Email Preview */}
        {email.html_content && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Email Preview</h3>
            <div 
              className="border rounded-md p-4 bg-background"
              dangerouslySetInnerHTML={{ __html: email.html_content }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}