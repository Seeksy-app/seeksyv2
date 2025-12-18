import { useState, useCallback } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WIPNeed } from '@/types/wip';

interface WIPRankingCardProps {
  needs: WIPNeed[];
  onComplete: (rankedNeedIds: string[]) => void;
  isSubmitting?: boolean;
}

interface RankableItem {
  need: WIPNeed;
  rank: number;
}

export function WIPRankingCard({ needs, onComplete, isSubmitting }: WIPRankingCardProps) {
  const [items, setItems] = useState<RankableItem[]>(() =>
    needs.map((need, index) => ({ need, rank: index + 1 }))
  );

  const handleReorder = useCallback((newItems: RankableItem[]) => {
    // Update ranks based on new order
    const updated = newItems.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
    setItems(updated);
  }, []);

  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;

    handleReorder(newItems);
  }, [items, handleReorder]);

  const handleSubmit = useCallback(() => {
    const rankedIds = items.map((item) => item.need.id);
    onComplete(rankedIds);
  }, [items, onComplete]);

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 1: return 'Most Important';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      case 5: return 'Least Important';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      case 2: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 3: return 'bg-muted/50 border-border text-muted-foreground';
      case 4: return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
      case 5: return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center mb-4">
        Drag to reorder or use arrows • Top = Most Important
      </div>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {items.map((item, index) => (
          <RankableNeedItem
            key={item.need.id}
            item={item}
            index={index}
            totalItems={items.length}
            onMove={moveItem}
            rankLabel={getRankLabel(item.rank)}
            rankColor={getRankColor(item.rank)}
          />
        ))}
      </Reorder.Group>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full mt-6"
        size="lg"
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}

interface RankableNeedItemProps {
  item: RankableItem;
  index: number;
  totalItems: number;
  onMove: (index: number, direction: 'up' | 'down') => void;
  rankLabel: string;
  rankColor: string;
}

function RankableNeedItem({
  item,
  index,
  totalItems,
  onMove,
  rankLabel,
  rankColor,
}: RankableNeedItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="touch-none"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'p-4 border-2 transition-all duration-200 cursor-grab active:cursor-grabbing',
            rankColor
          )}
        >
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => controls.start(e)}
              className="touch-none p-1 rounded hover:bg-foreground/10 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Rank Badge */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold">
              {item.rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">{item.need.label}</div>
              {item.need.description && (
                <div className="text-sm text-muted-foreground truncate">
                  {item.need.description}
                </div>
              )}
            </div>

            {/* Rank Label */}
            <div className="hidden sm:block text-xs font-medium px-2 py-1 rounded bg-background/50">
              {rankLabel}
            </div>

            {/* Arrow Buttons */}
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMove(index, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMove(index, 'down')}
                disabled={index === totalItems - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </Reorder.Item>
  );
}
