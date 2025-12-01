import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface Email {
  id: string;
  to_email: string;
  email_subject: string;
  event_type: string;
  created_at: string;
  campaign_name?: string;
  from_email?: string;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (emailId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
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

const getStatusLabel = (eventType: string) => {
  return eventType.charAt(0).toUpperCase() + eventType.slice(1);
};

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}: EmailListProps) {
  return (
    <div className="h-full border-r flex flex-col">
      {/* Filters and Sorting */}
      <div className="p-4 border-b bg-background">
        <div className="flex gap-2 mb-3">
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {emails.length} email{emails.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No emails found
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => onEmailSelect(email.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  selectedEmailId === email.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {email.to_email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium truncate">
                        {email.to_email}
                      </span>
                      <Circle
                        className={cn("h-2 w-2 fill-current flex-shrink-0", getStatusColor(email.event_type))}
                      />
                    </div>
                    
                    <div className="text-sm font-medium text-foreground mb-1 truncate">
                      {email.email_subject || "(No subject)"}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getStatusLabel(email.event_type)}
                      </Badge>
                      {email.campaign_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          {email.campaign_name}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(email.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}