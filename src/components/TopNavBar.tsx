import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CreditsBadge } from "@/components/CreditsBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";

export function TopNavBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger className="flex-shrink-0" />
        
        <div className="flex-1 flex items-center justify-between gap-4">
          <GlobalSearch />
          
          <div className="flex items-center gap-2">
            <CreditsBadge />
            <ThemeToggle />
            <NotificationsBell />
          </div>
        </div>
      </div>
    </header>
  );
}
