import { Download, Plus, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type SeeksyModule, INTEGRATION_ICONS, formatDownloads } from "./moduleData";

interface ModuleCardProps {
  module: SeeksyModule;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  onOpen?: () => void;
}

export function ModuleCard({ module, isInstalled, isInstalling, onInstall, onOpen }: ModuleCardProps) {
  const Icon = module.icon;
  
  return (
    <div 
      className={cn(
        "group relative rounded-xl border border-border/40 hover:border-primary/40 transition-all duration-300 bg-card overflow-hidden",
        "hover:shadow-xl hover:-translate-y-1"
      )}
    >
      {/* Preview Area with colorful gradient background */}
      <div 
        className={cn(
          "h-36 relative overflow-hidden flex items-center justify-center",
          module.bgGradient || "bg-gradient-to-br from-slate-100 to-slate-50"
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-3 left-3 w-16 h-2.5 rounded-full bg-white/50" />
          <div className="absolute top-7 left-3 w-24 h-2 rounded-full bg-white/40" />
          <div className="absolute top-3 right-3 w-12 h-12 rounded-lg bg-white/30 rotate-12" />
          <div className="absolute bottom-3 left-6 w-20 h-20 rounded-lg bg-white/20 -rotate-6" />
          <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-white/30" />
        </div>
        
        {/* Main Icon in white circle */}
        <div 
          className={cn(
            "relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/50",
            module.iconBg || "bg-white"
          )}
        >
          <Icon className={cn("h-8 w-8", module.iconColor || "text-primary")} />
        </div>
        
        {/* Top-left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {module.isAIPowered && (
            <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-600 hover:to-purple-600 text-white border-0 text-[10px] font-semibold shadow-md gap-1 px-2">
              <span>✨</span> AI Powered
            </Badge>
          )}
          {module.isNew && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-500 hover:to-green-500 text-white border-0 text-[10px] font-semibold shadow-md px-2">
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
            className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
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
                      className="w-5 h-5 rounded bg-muted flex items-center justify-center"
                    >
                      <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
                    </div>
                  );
                }
                return (
                  <div 
                    key={i}
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold",
                      IntegrationData.bg
                    )}
                    title={IntegrationData.name}
                  >
                    {IntegrationData.icon}
                  </div>
                );
              })}
              {module.integrations.length > 4 && (
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                  <span className="text-[9px] font-medium text-muted-foreground">
                    +{module.integrations.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {isInstalled ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-0"
                disabled
              >
                <Check className="h-3.5 w-3.5" />
                Added
              </Button>
              {module.route && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
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
              className="flex-1 gap-1.5 text-xs bg-primary hover:bg-primary/90"
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
