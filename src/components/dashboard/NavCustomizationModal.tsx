import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

interface NavCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", visible: true, order: 0 },
  { id: "studio", label: "Studio", icon: "Mic", visible: true, order: 1 },
  { id: "podcasts", label: "Podcasts", icon: "Podcast", visible: true, order: 2 },
  { id: "clips", label: "Clips", icon: "Scissors", visible: true, order: 3 },
  { id: "media", label: "Media Library", icon: "FolderOpen", visible: true, order: 4 },
  { id: "social", label: "Social Analytics", icon: "BarChart3", visible: true, order: 5 },
  { id: "identity", label: "Identity", icon: "Shield", visible: true, order: 6 },
  { id: "audience", label: "Audience", icon: "Users", visible: false, order: 7 },
  { id: "email", label: "Email", icon: "Mail", visible: false, order: 8 },
  { id: "events", label: "Events", icon: "Calendar", visible: false, order: 9 },
  { id: "meetings", label: "Meetings", icon: "Video", visible: false, order: 10 },
];

export function NavCustomizationModal({ open, onOpenChange }: NavCustomizationModalProps) {
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const saved = localStorage.getItem("nav-customization");
    return saved ? JSON.parse(saved) : defaultNavItems;
  });

  const toggleVisibility = (id: string) => {
    setNavItems(prev => 
      prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item)
    );
  };

  const handleSave = () => {
    localStorage.setItem("nav-customization", JSON.stringify(navItems));
    onOpenChange(false);
  };

  const handleReset = () => {
    setNavItems(defaultNavItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Navigation</DialogTitle>
          <DialogDescription>
            Show or hide sections in your sidebar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2 max-h-[400px] overflow-y-auto">
          {navItems.sort((a, b) => a.order - b.order).map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                item.visible ? "bg-card border-border" : "bg-muted/30 border-transparent"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
              <span className={cn(
                "flex-1 text-sm font-medium",
                item.visible ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              <Switch
                checked={item.visible}
                onCheckedChange={() => toggleVisibility(item.id)}
                disabled={item.id === "dashboard"} // Always show dashboard
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
