import { useRole } from '@/contexts/RoleContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Mic2, Megaphone, ChevronDown } from 'lucide-react';

export function RoleSwitcher() {
  const { currentRole, availableRoles, hasMultipleRoles, switchRole } = useRole();

  if (!hasMultipleRoles) return null;

  const roleIcon = currentRole === 'creator' ? <Mic2 className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />;
  const roleLabel = currentRole === 'creator' ? 'Creator' : 'Advertiser';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {roleIcon}
          <span className="hidden sm:inline">View as:</span>
          <span className="font-semibold">{roleLabel}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableRoles.includes('creator') && (
          <DropdownMenuItem
            onClick={() => switchRole('creator')}
            disabled={currentRole === 'creator'}
            className="gap-2"
          >
            <Mic2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Creator</span>
              <span className="text-xs text-muted-foreground">
                Podcasts, Studio, Content
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        {availableRoles.includes('advertiser') && (
          <DropdownMenuItem
            onClick={() => switchRole('advertiser')}
            disabled={currentRole === 'advertiser'}
            className="gap-2"
          >
            <Megaphone className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Advertiser</span>
              <span className="text-xs text-muted-foreground">
                Campaigns, Ads, Analytics
              </span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
