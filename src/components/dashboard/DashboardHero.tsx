import { Button } from "@/components/ui/button";
import { Settings2, LayoutGrid } from "lucide-react";

interface DashboardHeroProps {
  firstName: string;
  onCustomizeDashboard: () => void;
  onCustomizeNav: () => void;
}

export function DashboardHero({ firstName, onCustomizeDashboard, onCustomizeNav }: DashboardHeroProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening in your creator hub today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCustomizeDashboard}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Customize Dashboard</span>
          <span className="sm:hidden">Widgets</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCustomizeNav}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Customize Navigation</span>
          <span className="sm:hidden">Nav</span>
        </Button>
      </div>
    </div>
  );
}
