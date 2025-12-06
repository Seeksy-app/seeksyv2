import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type SeeksyModule, INTEGRATION_ICONS, formatDownloads } from "./moduleData";

interface ModuleCardProps {
  module: SeeksyModule;
  onClick: () => void;
}

export function ModuleCard({ module, onClick }: ModuleCardProps) {
  const Icon = module.icon;
  
  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border/40 hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden"
      onClick={onClick}
    >
      {/* Preview Area with colorful background */}
      <div 
        className={cn(
          "h-40 relative overflow-hidden flex items-center justify-center",
          module.bgGradient || "bg-gradient-to-br from-slate-100 to-slate-50"
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-4 w-20 h-3 rounded bg-white/40" />
          <div className="absolute top-10 left-4 w-32 h-2 rounded bg-white/30" />
          <div className="absolute top-4 right-4 w-16 h-16 rounded-lg bg-white/20" />
          <div className="absolute bottom-4 left-8 w-24 h-24 rounded-lg bg-white/15 rotate-6" />
        </div>
        
        {/* Main Icon */}
        <div 
          className={cn(
            "relative z-10 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
            module.iconBg || "bg-white"
          )}
        >
          <Icon className={cn("h-7 w-7", module.iconColor || "text-primary")} />
        </div>
        
        {/* Badges */}
        {module.isNew && (
          <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-xs font-medium shadow-sm">
            New
          </Badge>
        )}
        {module.isAIPowered && (
          <Badge className="absolute top-3 left-3 bg-violet-500/90 hover:bg-violet-500/90 text-white border-0 text-xs font-medium shadow-sm gap-1">
            <span className="text-[10px]">✨</span> AI
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {module.name}
          </h3>
          <p className="text-xs text-muted-foreground">by Seeksy</p>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {module.description}
        </p>
        
        {/* Footer with downloads and integrations */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{formatDownloads(module.downloads || 0)}</span>
          </div>
          
          {/* Integration Icons */}
          {module.integrations && module.integrations.length > 0 && (
            <div className="flex items-center gap-0.5">
              {module.integrations.slice(0, 4).map((integration, i) => {
                const IntegrationData = INTEGRATION_ICONS[integration];
                if (!IntegrationData) {
                  return (
                    <div 
                      key={i} 
                      className="w-6 h-6 rounded-md bg-muted flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                    </div>
                  );
                }
                return (
                  <div 
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold",
                      IntegrationData.bg
                    )}
                    title={IntegrationData.name}
                  >
                    {IntegrationData.icon}
                  </div>
                );
              })}
              {module.integrations.length > 4 && (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    +{module.integrations.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
