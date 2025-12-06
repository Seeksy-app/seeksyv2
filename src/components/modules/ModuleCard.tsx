import { Plus, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type SeeksyModule, INTEGRATION_ICONS } from "./moduleData";
import { MODULE_CUSTOM_ICONS, CATEGORY_GRADIENTS } from "./ModuleIcons";

interface ModuleCardProps {
  module: SeeksyModule;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  onOpen?: () => void;
}

export function ModuleCard({ module, isInstalled, isInstalling, onInstall, onOpen }: ModuleCardProps) {
  const LucideIcon = module.icon;
  const CustomIcon = MODULE_CUSTOM_ICONS[module.id];
  const categoryGradient = CATEGORY_GRADIENTS[module.category];
  
  // Use category-based gradient or module-specific one
  const bgGradient = categoryGradient?.bg || module.bgGradient || "bg-gradient-to-br from-slate-100 to-slate-50";
  const iconRing = categoryGradient?.iconRing || "ring-white/50";
  
  return (
    <div 
      className={cn(
        "group relative rounded-xl border border-border/40 transition-all duration-300 bg-card overflow-hidden",
        "hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1.5",
        "shadow-lg shadow-black/5"
      )}
    >
      {/* Preview Area with enhanced gradient background */}
      <div 
        className={cn(
          "h-40 relative overflow-hidden flex items-center justify-center",
          bgGradient
        )}
      >
        {/* Enhanced decorative pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-4 w-20 h-3 rounded-full bg-white/60" />
          <div className="absolute top-9 left-4 w-28 h-2.5 rounded-full bg-white/40" />
          <div className="absolute top-4 right-4 w-14 h-14 rounded-xl bg-white/30 rotate-12" />
          <div className="absolute bottom-4 left-8 w-24 h-24 rounded-xl bg-white/20 -rotate-6" />
          <div className="absolute bottom-10 right-10 w-10 h-10 rounded-full bg-white/40" />
          <div className="absolute top-1/2 left-1/3 w-6 h-6 rounded-full bg-white/20" />
        </div>
        
        {/* Main Icon in enhanced white circle with glow effect */}
        <div 
          className={cn(
            "relative z-10 w-20 h-20 rounded-full flex items-center justify-center",
            "bg-white shadow-xl ring-4",
            iconRing,
            "group-hover:scale-105 transition-transform duration-300 ease-out",
            // Inner shadow for tactile feel
            "before:absolute before:inset-1 before:rounded-full before:shadow-inner before:shadow-black/5"
          )}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-transparent opacity-50" />
          
          {/* Icon - use custom or fallback to lucide */}
          {CustomIcon ? (
            <div className={cn("relative z-10 w-12 h-12", module.iconColor || "text-primary")}>
              <CustomIcon />
            </div>
          ) : (
            <LucideIcon className={cn("relative z-10 h-9 w-9", module.iconColor || "text-primary")} />
          )}
        </div>
        
        {/* Top-left Badges - Enhanced styling */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {module.isAIPowered && (
            <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-600 hover:to-purple-600 text-white border-0 text-[10px] font-bold shadow-lg shadow-purple-500/30 gap-1 px-2.5 py-0.5">
              <span className="text-xs">✨</span> AI Powered
            </Badge>
          )}
          {module.isNew && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-500 hover:to-green-500 text-white border-0 text-[10px] font-bold shadow-lg shadow-green-500/30 px-2.5 py-0.5">
              New
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Author */}
        <div>
          <h3 
            className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer text-base"
            onClick={onOpen}
          >
            {module.name}
          </h3>
          <p className="text-xs text-muted-foreground">by Seeksy</p>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {module.description}
        </p>
        
        {/* Footer with enhanced integration badges */}
        <div className="flex items-center justify-between pt-1">
          {/* Spacer for layout balance */}
          <div className="flex-1" />
          
          {/* Integration Icons with enhanced styling */}
          {module.integrations && module.integrations.length > 0 && (
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1.5">
                {module.integrations.slice(0, 4).map((integration, i) => {
                  const IntegrationData = INTEGRATION_ICONS[integration];
                  if (!IntegrationData) {
                    return (
                      <div 
                        key={i} 
                        className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center border border-border/50"
                      >
                        <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                      </div>
                    );
                  }
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-md cursor-default",
                            "ring-2 ring-white/30 transition-transform hover:scale-110",
                            IntegrationData.bg
                          )}
                          aria-label={IntegrationData.name}
                        >
                          {IntegrationData.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-medium">
                        Works with {IntegrationData.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {module.integrations.length > 4 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center border border-border/50 cursor-default ring-2 ring-white/20">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          +{module.integrations.length - 4}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-medium">
                      {module.integrations.length - 4} more integrations
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {isInstalled ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 font-medium"
                disabled
              >
                <Check className="h-3.5 w-3.5" />
                Added
              </Button>
              {module.route && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium"
                  onClick={onOpen}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1.5 text-xs bg-primary hover:bg-primary/90 font-medium shadow-md shadow-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onInstall();
              }}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add to workspace
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
