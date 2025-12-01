import { Inbox, Send, Clock, FileText, Archive, AlertCircle, Ban, Bot, UserX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailFolderListProps {
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
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
  };
}

const folders = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "bounced", label: "Bounced", icon: AlertCircle },
  { id: "suppressed", label: "Suppressed", icon: Ban },
  { id: "automated", label: "Automated Emails", icon: Bot },
  { id: "unsubscribed", label: "Unsubscribed", icon: UserX },
];

export function EmailFolderList({ selectedFolder, onFolderSelect, counts }: EmailFolderListProps) {
  return (
    <div className="h-full border-r bg-muted/30 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">Folders</h2>
      </div>
      
      <nav className="space-y-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const count = counts[folder.id as keyof typeof counts] || 0;
          
          return (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
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
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedFolder === folder.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      <button className="w-full flex items-center gap-2 px-3 py-2 mt-4 rounded-md text-sm border border-dashed border-border hover:bg-muted transition-colors">
        <Plus className="h-4 w-4" />
        <span>Create Folder</span>
      </button>
    </div>
  );
}