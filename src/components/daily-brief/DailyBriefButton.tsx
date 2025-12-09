import { useState } from 'react';
import { Newspaper, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyBriefModal } from './DailyBriefModal';

interface DailyBriefButtonProps {
  audienceType?: 'ceo' | 'board' | 'investor' | 'creator';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function DailyBriefButton({ 
  audienceType = 'creator',
  variant = 'outline',
  size = 'default',
  className 
}: DailyBriefButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Newspaper className="w-4 h-4 mr-2" />
        Daily Brief
      </Button>
      
      <DailyBriefModal 
        open={isOpen} 
        onOpenChange={setIsOpen}
        audienceType={audienceType}
      />
    </>
  );
}
