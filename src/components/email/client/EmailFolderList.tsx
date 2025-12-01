import { Inbox, Send, Clock, FileText, Archive, AlertCircle, Ban, Bot, UserX, Plus, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmailFolderListProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
  onCompose: () => void;
  counts: {
    inbox: number;
    sent: number;
    scheduled: number;
    drafts: number;
    archived: number;
    bounced: number;
    suppressed: number;
    automated: number;
    unsubscribed: number;
    trash: number;
  };
}

const folders = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "bounced", label: "Bounced", icon: AlertCircle },
  { id: "suppressed", label: "Suppressed", icon: Ban },
  { id: "automated", label: "Automated Emails", icon: Bot },
  { id: "unsubscribed", label: "Unsubscribed", icon: UserX },
];

export function EmailFolderList({ selectedFolder, onFolderSelect, onCompose, counts }: EmailFolderListProps) {
  return (
    <div className="h-full border-r bg-muted/30 p-3">
      <Button 
        onClick={onCompose}
        className="w-full mb-3"
        size="sm"
      >
        <Edit3 className="h-4 w-4 mr-2" />
        New Email
      </Button>
      
      <nav className="space-y-0.5">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const count = counts[folder.id as keyof typeof counts] || 0;
          
          return (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors",
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{folder.label}</span>
              </div>
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center",
                  selectedFolder === folder.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : folder.id === "inbox"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
    </div>
  );
}