import { Inbox, Send, Clock, FileText, Archive, AlertCircle, Ban, Bot, UserX, Edit3, Trash2, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

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
  const navigate = useNavigate();

  return (
    <div className="h-full border-r bg-muted/30 p-3 flex flex-col">
      <Button 
        onClick={onCompose}
        className="w-full mb-3"
        size="sm"
      >
        <Edit3 className="h-4 w-4 mr-2" />
        New Email
      </Button>
      
      <nav className="space-y-0.5 flex-1">
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

      <Separator className="my-3" />

      {/* Bottom Actions */}
      <div className="space-y-0.5">
        <button
          onClick={() => navigate("/email/analytics")}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm hover:bg-muted text-foreground transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Tracking & Analytics</span>
        </button>
        <button
          onClick={() => navigate("/email-settings")}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm hover:bg-muted text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Email Settings</span>
        </button>
      </div>
    </div>
  );
}