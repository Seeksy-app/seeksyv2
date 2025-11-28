import { useRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';
import { Mic2, Megaphone } from 'lucide-react';

export function RoleIndicator() {
  const { currentRole } = useRole();

  if (!currentRole) return null;

  const isCreator = currentRole === 'creator';

  return (
    <Badge variant="secondary" className="gap-1.5">
      {isCreator ? (
        <>
          <Mic2 className="h-3 w-3" />
          <span>Viewing as Creator</span>
        </>
      ) : (
        <>
          <Megaphone className="h-3 w-3" />
          <span>Viewing as Advertiser</span>
        </>
      )}
    </Badge>
  );
}
