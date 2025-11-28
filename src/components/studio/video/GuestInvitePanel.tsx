import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, UserPlus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const GuestInvitePanel = () => {
  const inviteLink = `${window.location.origin}/studio/join/abc123`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guest Invite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Link</label>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="font-mono text-xs" />
            <Button onClick={handleCopyLink} size="icon" variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Waiting Room */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Waiting Room</span>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              2 waiting
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Guest 1</div>
                  <div className="text-xs text-muted-foreground">Waiting to join</div>
                </div>
              </div>
              <Button size="sm">Admit</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Guest 2</div>
                  <div className="text-xs text-muted-foreground">Waiting to join</div>
                </div>
              </div>
              <Button size="sm">Admit</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
