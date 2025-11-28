import { useState } from 'react';
import { useRole, UserRole } from '@/contexts/RoleContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic2, Megaphone } from 'lucide-react';

export function RoleChooser() {
  const { currentRole, availableRoles, hasMultipleRoles, switchRole } = useRole();
  const [isOpen, setIsOpen] = useState(hasMultipleRoles && !currentRole);

  const handleRoleSelect = async (role: UserRole) => {
    await switchRole(role);
    setIsOpen(false);
  };

  if (!hasMultipleRoles || currentRole) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How do you want to use Seeksy?</DialogTitle>
          <DialogDescription>
            You have access to both Creator and Advertiser features. Choose your starting role:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {availableRoles.includes('creator') && (
            <Button
              variant="outline"
              className="h-auto flex-col gap-3 p-6"
              onClick={() => handleRoleSelect('creator')}
            >
              <Mic2 className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-lg">I'm a Creator</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Create podcasts, record episodes, and manage your content
                </div>
              </div>
            </Button>
          )}

          {availableRoles.includes('advertiser') && (
            <Button
              variant="outline"
              className="h-auto flex-col gap-3 p-6"
              onClick={() => handleRoleSelect('advertiser')}
            >
              <Megaphone className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-lg">I'm an Advertiser</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Create campaigns, manage ads, and reach your audience
                </div>
              </div>
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You can switch between roles anytime from the menu
        </p>
      </DialogContent>
    </Dialog>
  );
}
