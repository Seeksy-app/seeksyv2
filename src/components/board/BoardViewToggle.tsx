import { useBoardViewMode } from '@/hooks/useBoardViewMode';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BoardViewToggle() {
  const { canToggleBoardView, isViewingAsBoard, toggleBoardView, isToggling } = useBoardViewMode();
  const navigate = useNavigate();

  if (!canToggleBoardView) return null;

  const handleToggle = () => {
    toggleBoardView();
    // Navigate to appropriate dashboard after toggle
    setTimeout(() => {
      if (!isViewingAsBoard) {
        navigate('/board');
      } else {
        navigate('/admin');
      }
    }, 100);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isViewingAsBoard ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggle}
          disabled={isToggling}
          className="gap-2"
        >
          {isViewingAsBoard ? (
            <>
              <EyeOff className="w-4 h-4" />
              Exit Board View
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Board View
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isViewingAsBoard
          ? 'Exit board member view and return to admin'
          : 'Switch to board member view for demos and presentations'}
      </TooltipContent>
    </Tooltip>
  );
}
