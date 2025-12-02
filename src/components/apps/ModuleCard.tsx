import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "available" | "coming_soon";
  recommendedWith?: string[];
  route?: string;
  onClick?: () => void;
}

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  available: {
    label: "Available",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400",
  },
  coming_soon: {
    label: "Coming Soon",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function ModuleCard({
  name,
  description,
  icon: Icon,
  status,
  recommendedWith,
  onClick,
}: ModuleCardProps) {
  const isDisabled = status === "coming_soon";
  const config = statusConfig[status];

  return (
    <Card
      className={cn(
        "group relative p-5 transition-all duration-200 border-border/50",
        !isDisabled && "cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        isDisabled && "opacity-60 cursor-not-allowed"
      )}
      onClick={!isDisabled ? onClick : undefined}
    >
      {/* Status Badge - Top Right */}
      <Badge
        variant="outline"
        className={cn("absolute top-4 right-4 text-[10px] font-medium px-2 py-0.5", config.className)}
      >
        {config.label}
      </Badge>

      {/* Icon */}
      <div className="mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-base mb-1.5 pr-20">{name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>

      {/* Recommended With Pills */}
      {recommendedWith && recommendedWith.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {recommendedWith.map((rec) => (
            <span
              key={rec}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
            >
              💡 Best with: {rec}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
