import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserCog, User } from "lucide-react";

interface AdminViewToggleProps {
  adminViewMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export const AdminViewToggle = ({ adminViewMode, onToggle }: AdminViewToggleProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        {adminViewMode ? (
          <UserCog className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
        <Label htmlFor="admin-toggle" className="text-sm font-medium cursor-pointer">
          {adminViewMode ? "Admin View" : "Personal View"}
        </Label>
      </div>
      <Switch
        id="admin-toggle"
        checked={adminViewMode}
        onCheckedChange={onToggle}
      />
    </div>
  );
};
