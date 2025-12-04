import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GripVertical, Star, Home, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavPreferences, NAV_ITEMS, LANDING_OPTIONS, NavConfig } from "@/hooks/useNavPreferences";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NavCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableNavItemProps {
  item: typeof NAV_ITEMS[0];
  isVisible: boolean;
  isPinned: boolean;
  onToggleVisibility: () => void;
  onTogglePinned: () => void;
  disableHide: boolean;
}

function SortableNavItem({ 
  item, 
  isVisible, 
  isPinned, 
  onToggleVisibility, 
  onTogglePinned,
  disableHide 
}: SortableNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isVisible ? "bg-card border-border" : "bg-muted/30 border-transparent",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </button>
      
      <div className="flex-1 flex items-center gap-2">
        {item.isHome && <Home className="h-3 w-3 text-muted-foreground" />}
        <span className={cn(
          "text-sm font-medium",
          isVisible ? "text-foreground" : "text-muted-foreground"
        )}>
          {item.label}
        </span>
      </div>

      <button
        onClick={onTogglePinned}
        disabled={!isVisible}
        className={cn(
          "p-1 rounded transition-colors",
          isPinned ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground"
        )}
        title={isPinned ? "Unpin from nav" : "Pin to nav"}
      >
        <Star className={cn("h-4 w-4", isPinned && "fill-current")} />
      </button>

      <Switch
        checked={isVisible}
        onCheckedChange={onToggleVisibility}
        disabled={disableHide}
      />
    </div>
  );
}

export function NavCustomizationModal({ open, onOpenChange }: NavCustomizationModalProps) {
  const { navConfig, defaultLandingRoute, savePreferences, resetToDefaults, isLoading } = useNavPreferences();
  
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [localHidden, setLocalHidden] = useState<string[]>([]);
  const [localPinned, setLocalPinned] = useState<string[]>([]);
  const [localLanding, setLocalLanding] = useState<string>('/my-day');
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open && !isLoading) {
      setLocalOrder(navConfig.order.length > 0 ? navConfig.order : NAV_ITEMS.map(i => i.id));
      setLocalHidden(navConfig.hidden);
      setLocalPinned(navConfig.pinned);
      setLocalLanding(defaultLandingRoute);
    }
  }, [open, navConfig, defaultLandingRoute, isLoading]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = (id: string) => {
    // Check if hiding this would leave no home pages visible
    const homeItems = NAV_ITEMS.filter(i => i.isHome).map(i => i.id);
    const currentlyVisibleHomes = homeItems.filter(h => !localHidden.includes(h));
    
    if (localHidden.includes(id)) {
      // Showing the item
      setLocalHidden(prev => prev.filter(h => h !== id));
    } else {
      // Hiding the item - check constraints
      if (homeItems.includes(id) && currentlyVisibleHomes.length <= 1) {
        toast.error("At least one home page must be visible");
        return;
      }
      setLocalHidden(prev => [...prev, id]);
      // Also remove from pinned if hidden
      setLocalPinned(prev => prev.filter(p => p !== id));
    }
  };

  const togglePinned = (id: string) => {
    if (localPinned.includes(id)) {
      setLocalPinned(prev => prev.filter(p => p !== id));
    } else {
      setLocalPinned(prev => [...prev, id]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const config: NavConfig = {
        order: localOrder,
        hidden: localHidden,
        pinned: localPinned
      };
      await savePreferences(config, localLanding);
      toast.success("Navigation preferences saved");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetToDefaults();
      toast.success("Reset to defaults");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to reset");
    } finally {
      setIsSaving(false);
    }
  };

  // Sort items by local order
  const sortedItems = [...NAV_ITEMS].sort((a, b) => {
    const aIndex = localOrder.indexOf(a.id);
    const bIndex = localOrder.indexOf(b.id);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const homeItems = NAV_ITEMS.filter(i => i.isHome).map(i => i.id);
  const visibleHomes = homeItems.filter(h => !localHidden.includes(h));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Navigation</DialogTitle>
          <DialogDescription>
            Set your startup page and organize your sidebar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="startup" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="startup">Startup Page</TabsTrigger>
            <TabsTrigger value="nav">Nav Items</TabsTrigger>
          </TabsList>

          <TabsContent value="startup" className="flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Choose where you land after logging in:
              </p>
              <RadioGroup value={localLanding} onValueChange={setLocalLanding}>
                {LANDING_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      localLanding === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setLocalLanding(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="nav" className="flex-1 overflow-y-auto">
            <div className="py-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Drag to reorder. Toggle visibility and pin favorites.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                  {sortedItems.map((item) => (
                    <SortableNavItem
                      key={item.id}
                      item={item}
                      isVisible={!localHidden.includes(item.id)}
                      isPinned={localPinned.includes(item.id)}
                      onToggleVisibility={() => toggleVisibility(item.id)}
                      onTogglePinned={() => togglePinned(item.id)}
                      disableHide={item.isHome && visibleHomes.length <= 1 && !localHidden.includes(item.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
