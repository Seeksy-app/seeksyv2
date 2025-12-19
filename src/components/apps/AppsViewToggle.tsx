import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppsViewToggleProps {
  value: "collections" | "individual";
  onValueChange: (value: "collections" | "individual") => void;
  className?: string;
}

/**
 * Toggle between Collections view and Individual Seekies view in the App Store.
 */
export function AppsViewToggle({ value, onValueChange, className }: AppsViewToggleProps) {
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onValueChange(v as "collections" | "individual")} 
      className={className}
    >
      <TabsList className="grid grid-cols-2 w-[280px] h-10">
        <TabsTrigger 
          value="collections" 
          className="flex items-center gap-2 text-sm"
        >
          <Layers className="h-4 w-4" />
          Collections
        </TabsTrigger>
        <TabsTrigger 
          value="individual" 
          className="flex items-center gap-2 text-sm"
        >
          <Package className="h-4 w-4" />
          Individual Seekies
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
